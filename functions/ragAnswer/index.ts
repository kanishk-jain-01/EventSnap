import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

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

// ***** Types ***** //
interface RagAnswerRequest {
  eventId: string;
  userId: string;
  question: string;
}

interface Citation {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  excerpt: string;
  storagePath: string;
}

interface RagAnswerResponse {
  text: string;
  citations: Citation[];
}

/** Cloud Function: ragAnswer */
export const ragAnswer = functions.https.onCall(async (request): Promise<RagAnswerResponse> => {
  // Authentication check
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated',
    );
  }

  const { eventId, userId, question } = request.data as RagAnswerRequest;
  
  // Validate required parameters
  if (!eventId || !userId || !question) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'eventId, userId, and question are required',
    );
  }

  // Validate that the authenticated user matches the userId parameter
  if (request.auth.uid !== userId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User can only query on their own behalf',
    );
  }

  try {
    console.log(`🤖 RAG query from user ${userId} for event ${eventId}: "${question}"`);
    
    // Step 1: Validate user participation in the event
    const participantDoc = await admin
      .firestore()
      .collection('events')
      .doc(eventId)
      .collection('participants')
      .doc(userId)
      .get();

    if (!participantDoc.exists) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'User is not a participant in this event',
      );
    }

    const participantData = participantDoc.data();
    const userRole = participantData?.role;
    
    console.log(`✅ User ${userId} validated as ${userRole} for event ${eventId}`);
    
    // Step 2: Generate embedding for the user's question
    const questionEmbedding = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: question,
    });
    const queryVector = questionEmbedding.data[0].embedding as number[];
    
    console.log(`🔍 Generated embedding for question: "${question}"`);
    
    // Step 3: Query Pinecone for relevant chunks within the event namespace
    const TOP_K = 5; // Number of most relevant chunks to retrieve
    const SIMILARITY_THRESHOLD = 0.5; // Lowered threshold for better recall
    
    const queryResponse = await getPineconeIndex()
      .namespace(eventId)
      .query({
        vector: queryVector,
        topK: TOP_K,
        includeMetadata: true,
        includeValues: false, // We don't need the vector values back
      });
    
    console.log(`📌 Pinecone returned ${queryResponse.matches?.length || 0} matches`);
    
    // Log all match scores for debugging
    if (queryResponse.matches) {
      queryResponse.matches.forEach((match, idx) => {
        console.log(`🔍 Match ${idx + 1}: score=${match.score?.toFixed(4)}, text preview="${(match.metadata?.text as string)?.substring(0, 100)}..."`);
      });
    }
    
    // Filter results by similarity threshold and extract relevant chunks
    const relevantChunks = queryResponse.matches
      ?.filter(match => (match.score || 0) >= SIMILARITY_THRESHOLD)
      .map(match => ({
        text: match.metadata?.text as string,
        storagePath: match.metadata?.storagePath as string,
        chunkIndex: match.metadata?.chunkIndex as number,
        score: match.score || 0,
      })) || [];
    
    console.log(`🎯 Found ${relevantChunks.length} relevant chunks above threshold ${SIMILARITY_THRESHOLD}`);
    
    // If no relevant chunks found, return a helpful message
    if (relevantChunks.length === 0) {
      return {
        text: "I couldn't find any relevant information in the uploaded documents to answer your question. You might want to ask the event organizers directly or check if the relevant documents have been uploaded.",
        citations: [],
      };
    }
    
    // Step 4: Assemble context and generate AI response
    // Prepare context from retrieved chunks
    const contextSections = relevantChunks.map((chunk, _idx) => 
      `[Source ${_idx + 1}]\n${chunk.text}\n`,
    ).join('\n');
    
    // Construct the prompt for GPT-4o
    const systemPrompt = `You are an AI assistant helping attendees at an event. You have access to event documents and should provide helpful, accurate answers based on the provided context.

INSTRUCTIONS:
1. Answer the user's question using ONLY the information provided in the context below
2. If the context doesn't contain enough information to fully answer the question, say so clearly
3. When referencing information, use citation markers like [Source 1], [Source 2], etc. that correspond to the sources provided
4. Be conversational and helpful, but stick to the facts from the documents
5. If asked about something not in the documents, politely explain that you can only answer based on the uploaded event materials

CONTEXT FROM EVENT DOCUMENTS:
${contextSections}`;

    const userPrompt = `Question: ${question}

Please provide a helpful answer based on the event documents provided above.`;

    console.log(`🤖 Generating AI response for question: "${question}"`);
    
    // Call OpenAI GPT-4o for completion
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1, // Low temperature for more factual, consistent responses
      max_tokens: 1000, // Reasonable limit for chat responses
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim();
    
    if (!aiResponse) {
      throw new Error('No response generated from OpenAI');
    }
    
    console.log(`✅ Generated AI response (${aiResponse.length} characters)`);
    
    // Prepare citations with correct document IDs and fetch document names
    const citations: Citation[] = [];
    
    for (let idx = 0; idx < relevantChunks.length; idx++) {
      const chunk = relevantChunks[idx];
      
      // Extract document ID from storage path: events/{eventId}/docs/{docId}
      const pathParts = chunk.storagePath.split('/');
      const docId = pathParts[pathParts.length - 1] || 'unknown';
      
      // Fetch document name from Firestore
      let documentName = `Document ${idx + 1}`; // Fallback name
      try {
        const docSnapshot = await admin
          .firestore()
          .collection('events')
          .doc(eventId)
          .collection('documents')
          .doc(docId)
          .get();
          
        if (docSnapshot.exists) {
          const docData = docSnapshot.data();
          documentName = docData?.name || documentName;
        }
      } catch (error) {
        console.warn(`Failed to fetch document name for ${docId}:`, error);
        // Keep fallback name
      }
      
      citations.push({
        documentId: docId, // This is the Firestore document ID
        documentName: documentName,
        chunkIndex: chunk.chunkIndex,
        excerpt: chunk.text.substring(0, 200) + (chunk.text.length > 200 ? '...' : ''),
        storagePath: chunk.storagePath,
      });
    }
    
    console.log(`📋 Returning response with ${citations.length} citations`);
    
    // Step 5: Return structured answer with text and citations
    return {
      text: aiResponse,
      citations: citations,
    };
    
  } catch (error: any) {
    console.error('RAG answer generation failed:', error);
    
    // Re-throw HttpsError instances to preserve error codes
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      error.message ?? 'Failed to generate answer',
    );
  }
}); 