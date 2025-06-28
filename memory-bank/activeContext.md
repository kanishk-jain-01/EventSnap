# Active Context (updated {{date:YYYY-MM-DD}})

## Current Focus
Continuing AI Chat RAG pipeline – Task 2.x wrap-up and prep for Task 3.0 (`ragAnswer` endpoint).

### Completed Since Last Update
1. Extended `functions/ingestPDFEmbeddings` and `functions/ingestImageEmbeddings` with Pinecone upserts (Tasks 2.1 & 2.2).
2. Added shared `lib/pineconeClient.ts` and set required env vars (Task 2.3).
3. Created `embeddingStorageTrigger` (onFinalize) to auto-ingest new uploads (Task 2.4).
4. Deployed updated Cloud Functions; initial smoke test passes.
5. Fixed Storage upload failure for event documents:
   • Added debug logging, identified `storage/unauthorized` root cause.
   • Simplified `storage.rules` – metadata-based `isUploader()` check, removed cross-service lookups.
   • Verified PDF upload succeeds from Profile → Upload Document.
   • Task 2.5 "Deploy CF & verify upserts" completed – vectors appear in Pinecone.
6. Deprecated legacy asset-upload section in `EventSetupScreen`; removed code + UI.

### Remaining / Blocking
None currently blocking.

### Next Steps
1. Build Task 3.0 – `ragAnswer` HTTPS callable (query Pinecone + GPT-4o, return citations).
2. Integrate `chatStore.sendAIQuery` and UI changes for assistant responses.
3. Clean up debug `console` logs & tighten Storage read rules once RAG flow stabilises.

---

_This file tracks the live development thread; update after every significant change or decision._ 