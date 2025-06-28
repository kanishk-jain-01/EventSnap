import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import pdf from 'pdf-parse';

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
  admin.initializeApp();
}

// ***** Environment Variables ***** //
const getPineconeIndexName = () => {
  const index = process.env.PINECONE_INDEX;
  if (!index) throw new Error('PINECONE_INDEX env var not set');
  return index;
};

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
  return _pinecone.index(getPineconeIndexName());
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
    
    if (end >= text.length) break;
    
    // Calculate next start position, ensuring forward progress
    const nextStart = end - OVERLAP;
    start = nextStart <= start ? start + 1 : nextStart;
  }
  
  return chunks;
};

/**
 * Internal helper used by both callable and Storage trigger implementations.
 */
export const processPdfEmbeddings = async (
  eventId: string,
  storagePath: string,
) => {
  let tempFile: string | null = null;
  
  try {
    console.log(`📄 Processing PDF: ${storagePath}`);
    
    // 1. Download PDF from Firebase Storage
    const bucket = admin.storage().bucket();
    tempFile = `/tmp/${Date.now()}-asset.pdf`;
    await bucket.file(storagePath).download({ destination: tempFile });

    // 2. Extract text
    const fileBuffer = await fs.promises.readFile(tempFile);
    const parsed = await pdf(fileBuffer);
    const fullText = parsed.text.trim();
    console.log(`📄 Extracted ${fullText.length} characters from PDF`);
    
    // Force garbage collection of large buffer
    if (global.gc) {
      global.gc();
    }

    if (!fullText) {
      throw new Error('No text extracted from PDF');
    }

    // 3. Chunk
    const chunks = chunkText(fullText);
    console.log(`📄 Created ${chunks.length} text chunks`);

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
        metadata: { eventId, storagePath, chunkIndex, text: chunk },
      });
      chunkIndex += 1;
    }
    console.log(`🧠 Generated ${vectors.length} embeddings`);

    // 5. Upsert to Pinecone
    const namespace = eventId;
    const BATCH_SIZE = 100;
    for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
      await getPineconeIndex().namespace(namespace).upsert(vectors.slice(i, i + BATCH_SIZE));
    }
    console.log(`📌 Stored ${vectors.length} vectors in Pinecone`);

    // 6. Firestore metadata
    await admin
      .firestore()
      .collection('events')
      .doc(eventId)
      .collection('assets')
      .doc(storagePath.split('/').pop()!)
      .set({
        storagePath,
        embedded: true,
        chunks: vectors.length,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

    console.log('✅ PDF embedding completed successfully');
    return { success: true, chunks: vectors.length };
  } catch (error) {
    console.error('Error processing PDF embeddings:', error);
    throw error;
  } finally {
    // Clean up temp file
    if (tempFile && fs.existsSync(tempFile)) {
      try {
        await fs.promises.unlink(tempFile);
      } catch (unlinkError) {
        console.warn('Failed to clean up temp file:', unlinkError);
      }
    }
  }
};

/** Cloud Function: ingestPDFEmbeddings */
export const ingestPDFEmbeddings = functions.https.onCall(async request => {
  // Authentication (require host role handled via security rules on callable path)
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated',
    );
  }

  const { eventId, storagePath } = request.data as {
    eventId?: string;
    storagePath?: string;
  };
  if (!eventId || !storagePath) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'eventId and storagePath are required',
    );
  }

  try {
    return await processPdfEmbeddings(eventId, storagePath);
  } catch (error: any) {
    console.error('Embedding ingestion failed', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message ?? 'Processing failed',
    );
  }
  },
);
