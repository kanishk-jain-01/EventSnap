## Relevant Files

- `src/services/firestore.service.ts` – Add `uploadEventDocument()` and related helpers.
- `src/screens/main/DocumentUploadScreen.tsx` – UI for hosts to upload PDFs/images. (created)
- `src/screens/main/DocumentListScreen.tsx` – Browsable list of documents for participants.
- `src/components/features/documents/CitationLink.tsx` – Tappable citation component in chat. (created)
- `src/components/features/chat/AIMessageBubble.tsx` – AI response component with distinct styling. (created)
- `src/store/chatStore.ts` – Add `sendAIQuery` and state for AI responses.
- `src/screens/main/ChatScreen.tsx` – Refactor UI for AI chat, citation handling.
- `src/screens/main/AiChatScreen.tsx` – New AI chat UI with single input and placeholder responses.
- `src/navigation/MainTabNavigator.tsx` – Switched Chat tab to use `AiChatScreen`.
- `src/navigation/MainNavigator.tsx` – Added `DocumentUpload` screen.
- `src/navigation/types.ts` – Added `DocumentUpload` route.
- `src/screens/main/ProfileScreen.tsx` – Added "Upload Document" button for hosts.
- `functions/ingestPDFEmbeddings/index.ts` – Extend to write vectors to Pinecone.
- `functions/ingestImageEmbeddings/index.ts` – Add full-text OCR + vector push.
- `functions/ragAnswer/index.ts` – New HTTPS callable Cloud Function for RAG responses. (created)
- `functions/lib/pineconeClient.ts` – Shared Pinecone client helper.
- `firestore.rules` – Update for `events/{eventId}/documents` permissions.
- `storage.rules` – Update for `events/{eventId}/docs/*` upload rules (host-only writes, participant reads).
- `firestore.rules` – Added documents sub-collection rules.
- `src/types/index.ts` – Define `EventDocument` interface.

## Tasks

- [x] 1.0 Enable Document Upload & Metadata Storage
  - [x] 1.1 Define `EventDocument` interface and Firestore path `events/{eventId}/documents`.
  - [x] 1.2 Implement `uploadEventDocument()` in `FirestoreService` (metadata write + Storage upload helper).
  - [x] 1.3 Create `DocumentUploadScreen` with file picker (PDF & image) visible to hosts only.
  - [x] 1.4 Integrate "Upload Document" entry point in appropriate host UI (e.g., profile or floating action).
  - [x] 1.5 Update `firestore.rules` & `storage.rules` to enforce host-only writes, participant reads.

- [x] 2.0 Implement Vector Ingestion Pipeline to Pinecone
  - [x] 2.1 Extend `ingestPDFEmbeddings` function to parse PDF, chunk text, embed, and upsert to Pinecone (`namespace=eventId`).
  - [x] 2.2 Enhance `ingestImageEmbeddings` with full-text OCR on images, then embed & upsert.
  - [x] 2.3 Create `pineconeClient.ts` util and add Pinecone env vars via `functions:config:set`.
  - [x] 2.4 Wire invocation of ingestion functions via Storage trigger (onFinalize).
  - [x] 2.5 Deploy updated Cloud Functions & verify upserts.

- [x] 3.0 Build `ragAnswer` Cloud Function for RAG responses
  - [x] 3.1 Scaffold HTTPS callable `ragAnswer` function accepting `{eventId, userId, question}`.
  - [x] 3.2 Validate `userId` participation in `eventId` via Firestore lookup.
  - [x] 3.3 Query Pinecone (top-k) within `namespace=eventId`.
  - [x] 3.4 Assemble prompt and call OpenAI GPT-4o; include citations metadata.
  - [x] 3.5 Return structured answer `{text, citations[]}` to client.

- [x] 4.0 Refactor Chat UI & `chatStore` for AI Assistant
  - [x] 4.1 Add `sendAIQuery(question)` action to `chatStore` to call `ragAnswer`.
  - [x] 4.2 Update `ChatScreen` composer to single input without recipient selection.
  - [x] 4.3 Render AI responses with distinct styling and `CitationLink` components.
  - [x] 4.4 Add loading and error states during AI response fetch.

- [ ] 5.0 Implement Document Browser & Citation Interaction
  - [ ] 5.1 Build `DocumentListScreen` listing documents from Firestore for active event.
  - [ ] 5.2 Show document thumbnails/titles and open in appropriate viewer (PDF WebView, Image viewer).
  - [ ] 5.3 Implement `CitationLink` that navigates to the document and highlights referenced page/section.
  - [ ] 5.4 Add navigation entry point (e.g., menu item or tab) visible to all participants. 