import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { Pinecone } from '@pinecone-database/pinecone';
import { Configuration, OpenAIApi } from 'openai';

if (!admin.apps.length) {
  admin.initializeApp();
}

// Env vars
const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY as string;
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT ?? 'us-east-1-aws';
const PINECONE_INDEX = process.env.PINECONE_INDEX ?? 'event-embeddings';

const openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_API_KEY }));
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY, environment: PINECONE_ENVIRONMENT });
const index = pinecone.index(PINECONE_INDEX);
const visionClient = new ImageAnnotatorClient();

const chunkText = (txt: string, size = 3000, overlap = 300) => {
  const chunks: string[] = [];
  let start = 0;
  while (start < txt.length) {
    const end = Math.min(start + size, txt.length);
    chunks.push(txt.slice(start, end));
    start = end - overlap;
  }
  return chunks;
};

export const ingestImageEmbeddings = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  const { eventId, storagePath } = data as { eventId?: string; storagePath?: string };
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
      const embedResp = await openai.createEmbedding({
        model: 'image-embedding-ada-002',
        input: base64,
      });
      const vector = embedResp.data.data[0].embedding as number[];
      await index.namespace(eventId).upsert([
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
        .doc(storagePath.split('/').pop()!)
        .set(
          { storagePath, embedded: true, chunks: 1, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
          { merge: true },
        );
      return { success: true, chunks: 1 };
    }

    // chunk text and embed
    const chunks = chunkText(rawText);
    const vectors: { id: string; values: number[]; metadata: any }[] = [];
    let idx = 0;
    for (const chunk of chunks) {
      const emb = await openai.createEmbedding({ model: 'text-embedding-3-small', input: chunk });
      vectors.push({
        id: `${storagePath}#${idx}`,
        values: emb.data.data[0].embedding as number[],
        metadata: { eventId, storagePath, chunkIndex: idx, text: chunk },
      });
      idx += 1;
    }
    const BATCH = 100;
    for (let i = 0; i < vectors.length; i += BATCH) {
      await index.namespace(eventId).upsert(vectors.slice(i, i + BATCH));
    }

    await admin
      .firestore()
      .collection('events')
      .doc(eventId)
      .collection('assets')
      .doc(storagePath.split('/').pop()!)
      .set(
        { storagePath, embedded: true, chunks: vectors.length, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true },
      );

    return { success: true, chunks: vectors.length };
  } catch (err: any) {
    console.error('Image embedding error', err);
    throw new functions.https.HttpsError('internal', err.message ?? 'Processing failed');
  }
}); 