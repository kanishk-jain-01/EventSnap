# AI Chat Revamp – Retrieval-Augmented Assistant

## 1. Introduction / Overview
Replace the existing peer-to-peer chat with an AI-powered assistant that answers event-specific questions. Hosts upload reference documents (PDFs & images). The assistant uses Retrieval-Augmented Generation (RAG) backed by Pinecone vector search and OpenAI GPT-4o to return contextual answers and source citations. Guests can also browse uploaded documents directly.

## 2. Goals
1. Provide accurate, real-time answers to event-related questions.
2. Allow hosts to upload PDFs and images as knowledge base material.
3. Enable guests to browse the raw documents and open them from chat citations.
4. Maintain role permissions (upload: host-only, view/query: all participants).
5. Seamless integration with existing Firebase stack and mobile UI.

## 3. User Stories
- **US1:** As a *guest*, I want to ask "What's at 2 p.m. today?" and receive the schedule item from the uploaded agenda.
- **US2:** As a *host*, I want to upload a PDF presentation so attendees can query it through chat.
- **US3:** As a *guest*, I want to tap a citation in the AI's reply to open the full source document.
- **US4:** As a *guest*, I want to browse a list of documents relevant to my current event.
- **US5:** As a *host*, I want OCR applied to uploaded images so their text is searchable.

## 4. Functional Requirements
1. The system **must** allow hosts to upload PDFs and images to `events/{eventId}/docs/{docId}` in Firebase Storage.
2. Upon successful upload, the system **must** store document metadata in `events/{eventId}/documents` (Firestore).
3. A Cloud Function **must** extract full text (PDF parsing, image OCR) and push embeddings to a Pinecone namespace named after `eventId`.
4. A callable Cloud Function `ragAnswer` **must**:
   1. Accept `eventId`, `userId`, `question`.
   2. Validate that `userId` is a participant of `eventId`.
   3. Query Pinecone for top-k semantic matches.
   4. Construct a prompt and request completion from OpenAI GPT-4o.
   5. Return the AI answer plus citation metadata (`docId`, page, excerpt).
5. `ChatScreen` **must** display the AI answer in a chat bubble styled differently from user messages.
6. Citations in answers **must** be tappable; tapping **must** open the referenced document at the correct page/anchor if possible.
7. `ChatScreen` input **must** be single-prompt (no recipient selector) and trigger `sendAIQuery()` in `chatStore`.
8. Guests **must** be able to view a browsable list of documents with search and open capabilities.
9. Only hosts **must** see the "Upload Document" action in the UI.
10. The system **must** scale to ~200 pages of docs per event without noticeable latency (<3 s response time).

## 5. Non-Goals
- Real-time peer-to-peer messaging (removed).
- Rate limiting of AI queries (not required for MVP).
- Support for document formats other than PDF and common image types.

## 6. Design Considerations (Optional)
- Reuse existing `ImageEditor` for image capture before upload.
- Show a distinct AI avatar in chat.
- Loading indicators while awaiting AI response.
- Empty-state design for events with no documents uploaded.

## 7. Technical Considerations (Optional)
- Use `pdf-parse` (already typed) for PDF text extraction.
- Use Google Cloud Vision or Tesseract via Cloud Functions for image OCR.
- Pinecone index: `gpt-4o-all-text`, dimension 1536, namespace per `eventId`.
- Store document thumbnails/previews for browse list.
- Environment variables for Pinecone and OpenAI keys managed via Firebase Functions config.

## 8. Success Metrics
- ≥95 % of questions answered correctly in user testing.
- <3 s median response time for 90 % of queries.
- 0 upload failures across supported file types during QA.
- ≥80 % guest engagement with AI chat during an event.

## 9. Open Questions
*(None – all clarifications resolved for MVP scope)*

---
➡️  Ready for task breakdown, we are. 