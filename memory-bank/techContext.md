# Tech Context

## Technologies Used

-   **Frontend:** React Native with Expo
-   **Styling:** Tailwind CSS (via `nativewind`)
-   **State Management:** Zustand
-   **Backend-as-a-Service (BaaS):** Firebase
    -   **Authentication:** Firebase Auth
    -   **Database:** Firestore
    -   **File Storage:** Firebase Cloud Storage
    -   **Serverless Logic:** Firebase Cloud Functions (written in TypeScript)
-   **Vector Database:** Pinecone (for RAG feature)
-   **AI/LLM Provider:** OpenAI (for `ragAnswer` function)

## Development Setup

-   The project is a standard Expo application.
-   Firebase configuration is required (see `firebase.config.example.js`).
-   Cloud Functions are located in the `/functions` directory and must be deployed separately via the Firebase CLI.
-   Environment variables for Pinecone and OpenAI APIs must be set in the Firebase Functions configuration. 