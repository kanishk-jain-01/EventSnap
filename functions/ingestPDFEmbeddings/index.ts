import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import * as pdf from 'pdf-parse';

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
  admin.initializeApp();
}

// ***** Environment Variables ***** //
const PINECONE_INDEX = process.env.PINECONE_INDEX ?? 'event-embeddings';

// ****** External Clients ****** //
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

// Token-friendly chunk size (approx 800 tokens ≈ 3k chars)
const MAX_CHARS = 3000;
const OVERLAP = 300; // chars to overlap between chunks for context

/** Helper to chunk a long string with overlap */
const chunkText = (text: string): string[] => {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + MAX_CHARS, text.length);
    chunks.push(text.slice(start, end));
    start = end - OVERLAP; // overlap
  }
  return chunks;
};

/** Cloud Function: ingestPDFEmbeddings */
export const ingestPDFEmbeddings = functions.https.onCall(async (request) => {
  // Authentication (require host role handled via security rules on callable path)
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { eventId, storagePath } = request.data as { eventId?: string; storagePath?: string };
  if (!eventId || !storagePath) {
    throw new functions.https.HttpsError('invalid-argument', 'eventId and storagePath are required');
  }

  try {
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
    const vectors = [] as { id: string; values: number[]; metadata: any }[];
    let chunkIndex = 0;
    for (const chunk of chunks) {
      const embeddingResponse = await getOpenAI().embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk,
      });
      const vector = embeddingResponse.data[0].embedding as number[];
      vectors.push({
        id: `${storagePath}#${chunkIndex}`,
        values: vector,
        metadata: {
          eventId,
          storagePath,
          chunkIndex,
          text: chunk,
        },
      });
      chunkIndex += 1;
    }

    // 5. Upsert to Pinecone
    const namespace = eventId; // event scoped
    // Split into batches of 100
    const BATCH_SIZE = 100;
    for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
      const batch = vectors.slice(i, i + BATCH_SIZE);
      await getPineconeIndex().namespace(namespace).upsert(batch);
    }

    // 6. Write back to Firestore assets sub-collection
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
  } catch (error: any) {
    console.error('Embedding ingestion failed', error);
    throw new functions.https.HttpsError('internal', error.message ?? 'Processing failed');
  }
}); 