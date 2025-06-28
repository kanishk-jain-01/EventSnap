# Active Context (updated {{date:YYYY-MM-DD}})

## Current Focus
Implementing AI Chat RAG pipeline – specifically Task 2.0 (Vector Ingestion) from `tasks-prd-ai-chat-rag.md`.

### Completed Since Last Update
1. Extended `functions/ingestPDFEmbeddings` and `functions/ingestImageEmbeddings` with Pinecone upserts (Tasks 2.1 & 2.2).
2. Added shared `lib/pineconeClient.ts` and set required env vars (Task 2.3).
3. Created `embeddingStorageTrigger` (onFinalize) to auto-ingest new uploads (Task 2.4).
4. Deployed updated Cloud Functions; initial smoke test passes.

### Remaining / Blocking
- Uploading a PDF from the client currently fails with `UploadEventDocument` → "Upload Failed".  Early signs point to Firebase Storage rules rejecting the write (participant role not `host` or missing rule conditions).  Needs rule-or user-role fix and re-test.

### Next Steps
1. Reproduce failure with Storage Rules playground, confirm `participantIsHost` returns true.
2. Adjust rules or `addParticipant` logic if necessary.
3. Once upload succeeds, verify vectors appear in Pinecone and Firestore `assets` doc.
4. Proceed to Task 3.0 – build `ragAnswer` callable and client integration.

---

_This file tracks the live development thread; update after every significant change or decision._ 