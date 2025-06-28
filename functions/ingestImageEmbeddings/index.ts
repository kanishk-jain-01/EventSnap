import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

if (!admin.apps.length) {
  admin.initializeApp();
}

// Env vars
const PINECONE_INDEX = process.env.PINECONE_INDEX ?? 'event-embeddings';

let _openai: OpenAI | null = null;
const getOpenAI = () => {
  if (!_openai) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY env var not set');
    _openai = new OpenAI({ apiKey: key });
  }
  return _openai;
};

let _pinecone: Pinecone | null = null;
const getPineconeIndex = () => {
  if (!_pinecone) {
    const key = process.env.PINECONE_API_KEY;
    if (!key) throw new Error('PINECONE_API_KEY env var not set');
    _pinecone = new Pinecone({ apiKey: key });
  }
  return _pinecone.index(PINECONE_INDEX);
};

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

/**
 * Internal helper used by both callable and Storage trigger implementations for image assets.
 */
export const processImageEmbeddings = async (
  eventId: string,
  storagePath: string,
) => {
  // Download image to tmp
  const bucket = admin.storage().bucket();
  const tempFile = `/tmp/${Date.now()}-asset`;
  await bucket.file(storagePath).download({ destination: tempFile });

  // OCR using Vision API
  const [result] = await visionClient.textDetection(tempFile);
  const textAnnotations = result.textAnnotations || [];
  const rawText = textAnnotations[0]?.description?.trim() ?? '';

  // Prepare vectors array
  const vectors: { id: string; values: number[]; metadata: any }[] = [];

  if (!rawText) {
    // Fallback embedding using image
    const base64 = fs.readFileSync(tempFile, { encoding: 'base64' });
    const embedResp = await getOpenAI().embeddings.create({
      model: 'image-embedding-ada-002',
      input: base64,
    });
    vectors.push({
      id: `${storagePath}#0`,
      values: embedResp.data[0].embedding as number[],
      metadata: { eventId, storagePath, chunkIndex: 0, text: '' },
    });
  } else {
    const chunks = chunkText(rawText);
    let idx = 0;
    for (const chunk of chunks) {
      const emb = await getOpenAI().embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk,
      });
      vectors.push({
        id: `${storagePath}#${idx}`,
        values: emb.data[0].embedding as number[],
        metadata: { eventId, storagePath, chunkIndex: idx, text: chunk },
      });
      idx += 1;
    }
  }

  // Upsert to Pinecone
  const BATCH = 100;
  for (let i = 0; i < vectors.length; i += BATCH) {
    await getPineconeIndex()
      .namespace(eventId)
      .upsert(vectors.slice(i, i + BATCH));
  }

  // Firestore metadata update
  await admin
    .firestore()
    .collection('events')
    .doc(eventId)
    .collection('assets')
    .doc(storagePath.split('/').pop()!)
    .set(
      {
        storagePath,
        embedded: true,
        chunks: vectors.length,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return { success: true, chunks: vectors.length };
};

export const ingestImageEmbeddings = functions.https.onCall(async request => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated',
    );
  }
  const { eventId, storagePath } = request.data as {
    eventId?: string;
    storagePath?: string;
  };
  if (!eventId || !storagePath) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'eventId and storagePath required',
    );
  }
  try {
    return await processImageEmbeddings(eventId, storagePath);
  } catch (err: any) {
    console.error('Image embedding error', err);
    throw new functions.https.HttpsError(
      'internal',
      err.message ?? 'Processing failed',
    );
  }
});
