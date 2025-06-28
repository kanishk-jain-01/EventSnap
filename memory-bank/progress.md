# Progress

This document tracks the implementation progress of the AI Chat RAG feature, based on the task list in `tasks/tasks-prd-ai-chat-rag.md`.

## What Works

-   **Task 1.0: Document Upload & Metadata Storage:** Complete. Hosts can upload documents (PDFs, images), which are stored in Firebase Storage, and the corresponding metadata is saved to Firestore. Security rules are in place.
-   **Task 2.0: Vector Ingestion Pipeline:** Complete. Cloud Functions are triggered on document upload. They process the files (text extraction, OCR), generate embeddings, and successfully upsert the vectors into Pinecone, namespaced by `eventId`.
-   **Partial UI Refactor (Task 4.2):** The chat screen composer has been updated to a single input field in preparation for the AI chat interface.

## What's Left to Build

-   **Task 3.0: `ragAnswer` Cloud Function:** The core backend logic for retrieving context and generating answers is not yet implemented.
-   **Task 4.0: Full Chat UI & State Management:** The `chatStore` needs to be updated to handle AI queries, and the UI needs to be able to render AI responses, citations, and loading/error states.
-   **Task 5.0: Document Browser & Citation Interaction:** The screens for browsing uploaded documents and the functionality for handling clicks on citations in the chat do not exist yet. 