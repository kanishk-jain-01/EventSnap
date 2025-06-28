import { onObjectFinalized } from 'firebase-functions/v2/storage';
import * as logger from 'firebase-functions/logger';
import { processPdfEmbeddings } from './ingestPDFEmbeddings';
import { processImageEmbeddings } from './ingestImageEmbeddings';

/**
 * Triggered when a file is uploaded to Firebase Storage.
 * Expects event document assets to follow the path: events/{eventId}/docs/**
 * Determines file type (PDF vs image/*) and invokes the corresponding
 * embedding pipeline, storing vectors in Pinecone and metadata in Firestore.
 */
export const ingestEmbeddingsOnFinalize = onObjectFinalized(
  {
    memory: '1GiB',
    timeoutSeconds: 540, // max for long PDF processing
  },
  async event => {
    const file = event.data;
    const storagePath = file.name;
    if (!storagePath) {
      logger.warn('onFinalize: no file name');
      return;
    }

    // Only handle docs under events/{eventId}/docs/
    const match = storagePath.match(/^events\/([^/]+)\/docs\//);
    if (!match) {
      logger.debug(`Skipping file outside docs folder: ${storagePath}`);
      return;
    }
    const eventId = match[1];
    const contentType = file.contentType ?? '';

    try {
      if (contentType === 'application/pdf') {
        logger.info(`Processing PDF embeddings for ${storagePath}`);
        await processPdfEmbeddings(eventId, storagePath);
      } else if (contentType.startsWith('image/')) {
        logger.info(`Processing image embeddings for ${storagePath}`);
        await processImageEmbeddings(eventId, storagePath);
      } else {
        logger.info(`Unhandled content type ${contentType} for ${storagePath}`);
      }
    } catch (err) {
      logger.error('Embedding onFinalize error', err);
      throw err;
    }
  },
); 