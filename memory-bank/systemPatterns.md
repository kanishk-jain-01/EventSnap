# System Patterns

## Architecture

### **Core Architecture**
- **Client-Server (via BaaS):** The application follows a client-server model where the React Native frontend communicates directly with Firebase services (Firestore, Auth, Storage).
- **Serverless Backend:** Complex backend logic, data processing, and third-party integrations are handled by serverless Firebase Cloud Functions. This keeps the client relatively lightweight.
- **Monorepo-like Structure:** The frontend application and the backend Cloud Functions are housed in the same repository for cohesive development, but are deployed as separate services.

### **RAG (Retrieval-Augmented Generation) Architecture**
- **Document Ingestion Pipeline:** Uploaded documents (PDFs, images) are automatically processed through a serverless pipeline:
  1. Storage trigger activates Cloud Function
  2. Text extraction (PDF parsing, OCR for images)
  3. Content chunking with overlap for context preservation
  4. Embedding generation using OpenAI `text-embedding-3-small`
  5. Vector storage in Pinecone with event-based namespacing
- **Query Processing Pipeline:** User questions trigger a sophisticated RAG flow:
  1. Question embedding generation
  2. Semantic similarity search in Pinecone (event-scoped)
  3. Context assembly from retrieved document chunks
  4. Prompt engineering with system instructions
  5. GPT-4o inference with structured response format
  6. Citation extraction and metadata return

## Key Technical Decisions

### **Frontend Architecture**
- **Component-Based UI:** The UI is built with reusable React components, organized by feature and type (e.g., `ui/`, `media/`, `social/`, `features/`).
- **Centralized State Management:** Zustand is used for managing global state (e.g., auth status, current event), providing a simple and hook-based API. Feature-specific state is co-located with the components where possible.
- **Feature-Driven Organization:** New pattern of organizing components by feature (`features/chat/`, `features/documents/`) for better maintainability.

### **Backend Patterns**
- **Event-Scoped Data Isolation:** All AI/RAG operations are scoped to specific events using Pinecone namespaces and Firestore subcollections, ensuring complete data privacy between events.
- **Serverless Function Composition:** Complex workflows broken into focused, single-purpose Cloud Functions that can be independently deployed and scaled.
- **Defensive Programming:** Comprehensive error handling, input validation, and resource cleanup throughout the serverless pipeline.

### **AI/ML Integration Patterns**
- **Embedding Consistency:** All text (documents and queries) uses the same embedding model (`text-embedding-3-small`) to ensure semantic compatibility.
- **Chunking Strategy:** 1000-character chunks with 200-character overlap to preserve context while fitting within model constraints.
- **Similarity Thresholding:** Configurable similarity thresholds (currently 0.7) to balance relevance vs. recall in document retrieval.
- **Prompt Engineering:** Structured system prompts with clear instructions, context injection, and citation requirements for consistent AI behavior.

### **Security & Authentication Patterns**
- **Multi-Layer Security:** 
  1. Firebase Auth for user authentication
  2. Cloud Function authentication validation
  3. Firestore security rules for data access
  4. Event participation validation for AI queries
- **IAM for Serverless:** Proper Cloud Run IAM policies for Gen 2 Cloud Functions (public invocation with internal auth validation).

### **Error Handling & User Experience**
- **Progressive Error Recovery:** Multiple levels of error handling from network issues to AI failures, with user-friendly retry mechanisms.
- **Loading State Management:** Multi-phase loading indicators that provide context about what the system is doing.
- **Optimistic UI Updates:** Immediate UI feedback with temporary states while backend processing occurs.

### **Data Flow Patterns**
- **Unidirectional Data Flow:** Clear data flow from user actions → store updates → UI re-renders, following React/Zustand patterns.
- **Event-Driven Processing:** Document processing triggered by Firebase Storage events, ensuring automatic and reliable pipeline execution.
- **Stateful Chat Interface:** AI conversations persist in local state with proper message threading and error state management.

## Component Design Patterns

### **Compound Components**
- **AIMessageBubble + CitationLink:** Composed components that work together to display AI responses with interactive citations.
- **Modal + Content:** Reusable modal wrapper with various content types for consistent UX.

### **Hook-Based State Access**
- **Convenience Hooks:** Custom hooks like `useAIMessages()`, `useIsLoadingAI()` provide clean component APIs.
- **Store Selectors:** Zustand selectors prevent unnecessary re-renders and provide derived state.

### **Error Boundary Patterns**
- **Graceful Degradation:** Components handle missing data and error states without crashing the app.
- **User-Actionable Errors:** Error states include clear messaging and recovery actions (retry, dismiss, etc.).

## Performance Patterns

### **Efficient Re-rendering**
- **Selective State Updates:** Zustand subscriptions only trigger re-renders for components that need specific state slices.
- **Memoization:** Strategic use of React.memo and useMemo for expensive computations.

### **Resource Management**
- **Cloud Function Memory Allocation:** Optimized memory settings (2048MB for embedding functions, 256MB for others).
- **Cleanup Patterns:** Proper cleanup of listeners, subscriptions, and temporary resources.

### **Caching & Optimization**
- **Vector Caching:** Pinecone provides built-in caching for vector operations.
- **Firebase Offline Support:** Firestore offline capabilities for improved user experience. 