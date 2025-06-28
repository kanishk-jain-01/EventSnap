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
exports.ingestPDFEmbeddings = exports.processPdfEmbeddings = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const fs = __importStar(require("fs"));
const pinecone_1 = require("@pinecone-database/pinecone");
const openai_1 = __importDefault(require("openai"));
const pdf = __importStar(require("pdf-parse"));
// Initialize Firebase Admin if not already
if (!admin.apps.length) {
    admin.initializeApp();
}
// ***** Environment Variables ***** //
const PINECONE_INDEX = process.env.PINECONE_INDEX ?? 'event-embeddings';
// ****** External Clients ****** //
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
// Token-friendly chunk size (approx 800 tokens ≈ 3k chars)
const MAX_CHARS = 3000;
const OVERLAP = 300; // chars to overlap between chunks for context
/** Helper to chunk a long string with overlap */
const chunkText = (text) => {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + MAX_CHARS, text.length);
        chunks.push(text.slice(start, end));
        start = end - OVERLAP; // overlap
    }
    return chunks;
};
/**
 * Internal helper used by both callable and Storage trigger implementations.
 */
const processPdfEmbeddings = async (eventId, storagePath) => {
    // 1. Download PDF from Firebase Storage
    const bucket = admin.storage().bucket();
    const tempFile = `/tmp/${Date.now()}-asset.pdf`;
    await bucket.file(storagePath).download({ destination: tempFile });
    // 2. Extract text
    const fileBuffer = await fs.promises.readFile(tempFile);
    const parsed = await pdf(fileBuffer);
    const fullText = parsed.text.trim();
    if (!fullText) {
        throw new Error('No text extracted');
    }
    // 3. Chunk
    const chunks = chunkText(fullText);
    // 4. Generate embeddings batch-wise
    const vectors = [];
    let chunkIndex = 0;
    for (const chunk of chunks) {
        const embeddingResponse = await getOpenAI().embeddings.create({
            model: 'text-embedding-3-small',
            input: chunk,
        });
        const vector = embeddingResponse.data[0].embedding;
        vectors.push({
            id: `${storagePath}#${chunkIndex}`,
            values: vector,
            metadata: { eventId, storagePath, chunkIndex, text: chunk },
        });
        chunkIndex += 1;
    }
    // 5. Upsert to Pinecone
    const namespace = eventId;
    const BATCH_SIZE = 100;
    for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
        await getPineconeIndex().namespace(namespace).upsert(vectors.slice(i, i + BATCH_SIZE));
    }
    // 6. Firestore metadata
    await admin
        .firestore()
        .collection('events')
        .doc(eventId)
        .collection('assets')
        .doc(storagePath.split('/').pop())
        .set({
        storagePath,
        embedded: true,
        chunks: vectors.length,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { success: true, chunks: vectors.length };
};
exports.processPdfEmbeddings = processPdfEmbeddings;
/** Cloud Function: ingestPDFEmbeddings */
exports.ingestPDFEmbeddings = functions.https.onCall(async (request) => {
    // Authentication (require host role handled via security rules on callable path)
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { eventId, storagePath } = request.data;
    if (!eventId || !storagePath) {
        throw new functions.https.HttpsError('invalid-argument', 'eventId and storagePath are required');
    }
    try {
        return await (0, exports.processPdfEmbeddings)(eventId, storagePath);
    }
    catch (error) {
        console.error('Embedding ingestion failed', error);
        throw new functions.https.HttpsError('internal', error.message ?? 'Processing failed');
    }
});
