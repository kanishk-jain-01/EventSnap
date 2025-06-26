"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestImageEmbeddings = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const fs = __importStar(require("fs"));
const vision_1 = require("@google-cloud/vision");
const pinecone_1 = require("@pinecone-database/pinecone");
const openai_1 = __importDefault(require("openai"));
if (!admin.apps.length) {
    admin.initializeApp();
}
// Env vars
const PINECONE_INDEX = process.env.PINECONE_INDEX ?? 'event-embeddings';
let _openai = null;
const getOpenAI = () => {
    if (!_openai) {
        const key = process.env.OPENAI_API_KEY;
        if (!key)
            throw new Error('OPENAI_API_KEY env var not set');
        _openai = new openai_1.default({ apiKey: key });
    }
    return _openai;
};
let _pinecone = null;
const getPineconeIndex = () => {
    if (!_pinecone) {
        const key = process.env.PINECONE_API_KEY;
        if (!key)
            throw new Error('PINECONE_API_KEY env var not set');
        _pinecone = new pinecone_1.Pinecone({ apiKey: key });
    }
    return _pinecone.index(PINECONE_INDEX);
};
const visionClient = new vision_1.ImageAnnotatorClient();
const chunkText = (txt, size = 3000, overlap = 300) => {
    const chunks = [];
    let start = 0;
    while (start < txt.length) {
        const end = Math.min(start + size, txt.length);
        chunks.push(txt.slice(start, end));
        start = end - overlap;
    }
    return chunks;
};
exports.ingestImageEmbeddings = functions.https.onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const { eventId, storagePath } = request.data;
    if (!eventId || !storagePath) {
        throw new functions.https.HttpsError('invalid-argument', 'eventId and storagePath required');
    }
    try {
        // Download image to tmp
        const bucket = admin.storage().bucket();
        const tempFile = `/tmp/${Date.now()}-asset`;
        await bucket.file(storagePath).download({ destination: tempFile });
        // OCR using Vision API
        const [result] = await visionClient.textDetection(tempFile);
        const textAnnotations = result.textAnnotations || [];
        const rawText = textAnnotations[0]?.description?.trim() ?? '';
        if (!rawText) {
            // even if no text, create a CLIP-style image embedding using base64 encoded image
            const base64 = fs.readFileSync(tempFile, { encoding: 'base64' });
            const embedResp = await getOpenAI().embeddings.create({
                model: 'image-embedding-ada-002',
                input: base64,
            });
            const vector = embedResp.data[0].embedding;
            await getPineconeIndex().namespace(eventId).upsert([
                {
                    id: `${storagePath}#0`,
                    values: vector,
                    metadata: { eventId, storagePath, chunkIndex: 0, text: '' },
                },
            ]);
            await admin
                .firestore()
                .collection('events')
                .doc(eventId)
                .collection('assets')
                .doc(storagePath.split('/').pop())
                .set({ storagePath, embedded: true, chunks: 1, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
            return { success: true, chunks: 1 };
        }
        // chunk text and embed
        const chunks = chunkText(rawText);
        const vectors = [];
        let idx = 0;
        for (const chunk of chunks) {
            const emb = await getOpenAI().embeddings.create({ model: 'text-embedding-3-small', input: chunk });
            vectors.push({
                id: `${storagePath}#${idx}`,
                values: emb.data[0].embedding,
                metadata: { eventId, storagePath, chunkIndex: idx, text: chunk },
            });
            idx += 1;
        }
        const BATCH = 100;
        for (let i = 0; i < vectors.length; i += BATCH) {
            await getPineconeIndex().namespace(eventId).upsert(vectors.slice(i, i + BATCH));
        }
        await admin
            .firestore()
            .collection('events')
            .doc(eventId)
            .collection('assets')
            .doc(storagePath.split('/').pop())
            .set({ storagePath, embedded: true, chunks: vectors.length, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        return { success: true, chunks: vectors.length };
    }
    catch (err) {
        console.error('Image embedding error', err);
        throw new functions.https.HttpsError('internal', err.message ?? 'Processing failed');
    }
});
