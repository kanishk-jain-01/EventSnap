# Tech Context

## Technologies Used

### **Frontend Stack**
- **Framework:** React Native with Expo
- **Styling:** Tailwind CSS (via `nativewind`)
- **State Management:** Zustand with subscriptions
- **Navigation:** React Navigation v6 with TypeScript integration
- **Type Safety:** TypeScript throughout
- **Document Viewing:** react-native-webview (PDFs), expo-image (images with zoom/pan)

### **Backend-as-a-Service (BaaS)**
- **Authentication:** Firebase Auth with AsyncStorage persistence
- **Database:** Firestore with offline support
- **File Storage:** Firebase Cloud Storage with security rules
- **Serverless Logic:** Firebase Cloud Functions v2 (TypeScript)
- **Real-time Database:** Firebase Realtime Database for chat/presence

### **AI/ML Services**
- **Vector Database:** Pinecone (for semantic search and RAG)
- **Language Model:** OpenAI GPT-4o (for answer generation)
- **Embeddings:** OpenAI `text-embedding-3-small` (for document and query vectorization)
- **OCR:** Google Cloud Vision API (for image text extraction)
- **PDF Processing:** `pdf-parse` library (for text extraction)

### **External Services Integration**
- **Pinecone:** Vector database with namespace isolation
- **OpenAI API:** Embeddings and chat completions
- **Google Cloud Vision:** OCR for document images
- **Cloud Run:** Underlying infrastructure for Gen 2 Cloud Functions

## Development Setup

### **Local Development**
- Standard Expo development environment
- Firebase configuration required (see `firebase.config.example.js`)
- Environment variables for external services (see Cloud Functions config)

### **Cloud Functions Configuration**
Located in `/functions` directory with separate deployment:

```bash
# Required environment variables (via Firebase Functions config)
firebase functions:config:set \
  openai.api_key="your-openai-key" \
  pinecone.api_key="your-pinecone-key" \
  pinecone.index="your-index-name"
```

### **Build & Deployment**
- **Frontend:** Expo build process for iOS/Android
- **Backend:** Firebase CLI for Cloud Functions deployment
- **Dependencies:** Separate package.json for functions with Node.js 20 runtime

## Architecture Decisions

### **Cloud Functions Generation**
- **Gen 2 Functions:** Using Firebase Functions v2 for better performance and Cloud Run integration
- **Memory Allocation:** 
  - 2048MB for embedding functions (handles large documents)
  - 256MB for API functions (ragAnswer, etc.)
- **IAM Configuration:** Public invocation with internal Firebase Auth validation

### **Vector Database Choice**
- **Pinecone over alternatives:** Chosen for managed service, performance, and namespace support
- **Namespace Strategy:** Event-based isolation (`eventId` as namespace)
- **Index Configuration:** 1536 dimensions (matching OpenAI embedding model)

### **AI Model Selection**
- **GPT-4o:** Latest model for best reasoning and instruction following
- **text-embedding-3-small:** Cost-effective embeddings with good performance
- **Temperature Settings:** Low (0.1) for factual, consistent responses

### **Document Processing Pipeline**
- **Chunking Strategy:** 1000-character chunks with 200-character overlap
- **Supported Formats:** PDFs (text extraction) and images (OCR)
- **Error Handling:** Graceful degradation with comprehensive logging

## Security Configuration

### **Firebase Security Rules**
- **Firestore Rules:** Role-based access (hosts vs. participants)
- **Storage Rules:** Document upload restrictions and read permissions
- **Authentication:** Required for all operations

### **Cloud Function Security**
- **HTTPS Callable:** Automatic Firebase Auth token validation
- **Input Validation:** Comprehensive parameter checking
- **Event Participation:** User authorization before AI queries

### **API Key Management**
- **Firebase Functions Config:** Secure environment variable storage
- **Principle of Least Privilege:** Functions only have necessary permissions
- **Rate Limiting:** Implicit through Firebase/OpenAI service limits

## Performance Considerations

### **Optimization Strategies**
- **Lazy Loading:** Components and screens loaded on demand
- **State Optimization:** Zustand selectors prevent unnecessary re-renders
- **Memory Management:** Proper cleanup in Cloud Functions

### **Scalability Patterns**
- **Serverless Auto-scaling:** Cloud Functions scale automatically
- **Vector Database:** Pinecone handles scaling transparently
- **Event Isolation:** Namespace strategy prevents cross-event interference

### **Monitoring & Debugging**
- **Cloud Function Logs:** Firebase Console and gcloud CLI
- **Error Tracking:** Comprehensive error logging throughout pipeline
- **Performance Metrics:** Built-in Firebase and Cloud Run monitoring

## Development Workflow

### **Code Organization**
- **Monorepo Structure:** Frontend and backend in same repository
- **Feature-Based Organization:** Components organized by functionality
- **Type Safety:** Shared TypeScript interfaces between frontend/backend

### **Testing Strategy**
- **Unit Testing:** Jest for utility functions and business logic
- **Integration Testing:** Firebase emulators for local development
- **End-to-End:** Manual testing with real Firebase services

### **Deployment Pipeline**
- **Functions:** `firebase deploy --only functions`
- **Rules:** `firebase deploy --only firestore:rules,storage`
- **Frontend:** Expo build and app store deployment

## Known Limitations & Considerations

### **Current Constraints**
- **Response Time:** 3-5 seconds for RAG queries (normal for embedding + LLM)
- **Document Size:** Large PDFs may hit Cloud Function memory limits
- **Similarity Threshold:** Currently strict (0.7) - may need tuning
- **Rate Limits:** OpenAI API rate limits apply to all users

### **Future Scalability**
- **Caching:** Could add Redis for embedding caching
- **CDN:** Could add CDN for document serving
- **Multi-region:** Could deploy functions in multiple regions
- **Model Optimization:** Could explore smaller/faster models for certain queries 