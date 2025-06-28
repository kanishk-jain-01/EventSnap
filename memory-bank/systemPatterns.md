# System Patterns

## Architecture

-   **Client-Server (via BaaS):** The application follows a client-server model where the React Native frontend communicates directly with Firebase services (Firestore, Auth, Storage).
-   **Serverless Backend:** Complex backend logic, data processing, and third-party integrations are handled by serverless Firebase Cloud Functions. This keeps the client relatively lightweight.
-   **Monorepo-like Structure:** The frontend application and the backend Cloud Functions are housed in the same repository for cohesive development, but are deployed as separate services.

## Key Technical Decisions

-   **Component-Based UI:** The UI is built with reusable React components, organized by feature and type (e.g., `ui/`, `media/`, `social/`).
-   **Centralized State Management:** Zustand is used for managing global state (e.g., auth status, current event), providing a simple and hook-based API. Feature-specific state is co-located with the components where possible.
-   **Retrieval-Augmented Generation (RAG):** The AI Chat feature uses a RAG pattern. Documents are ingested, chunked, and stored as vector embeddings in Pinecone. When a user asks a question, the system retrieves relevant chunks from Pinecone, injects them into a prompt for an LLM (GPT-4o), and returns the generated answer to the user. This allows the AI to answer questions based on specific, private data.
-   **Firebase Security Rules:** Application security relies heavily on Firestore and Storage security rules to control data access based on user authentication and roles (e.g., hosts vs. participants). 