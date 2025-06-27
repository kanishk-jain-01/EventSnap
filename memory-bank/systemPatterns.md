# System Patterns

## High-Level Architecture
```
React Native (Expo) App
│
├── Navigation Layer (react-navigation) ── AppNavigator, MainNavigator, AuthNavigator
│
├── Feature Modules
│   ├── Auth
│   ├── Camera
│   ├── Chat
│   ├── Stories
│   ├── Events
│   └── AI Chat (RAG)
│
├── Shared UI Components (NativeWind + Tailwind CSS)
│
├── State Management (Zustand stores)
│
└── Service Layer
    ├── Firebase Auth / Firestore / Storage / RTDB
    ├── Cloud Functions (TypeScript)
    └── AI Services (OpenAI via Cloud Functions)
```

## Key Design Principles
1. **Feature Isolation** – Each feature owns its screens, hooks, and stores.
2. **Service Abstraction** – Firebase & external APIs accessed through `/src/services` for testability.
3. **Atomic UI Components** – Reusable, theme-aware building blocks in `/src/components/ui`.
4. **Serverless Backend** – All business logic runs in Cloud Functions to avoid dedicated servers.
5. **Type Safety** – End-to-end TypeScript across app and functions.
6. **Optimistic UI** – Immediate client updates with background persistence using Firestore offline support.

## Component Interaction Flow (Example: Send Snap)
1. `CameraScreen` captures media via `useCamera` hook.
2. `useImageUpload` uploads to Firebase Storage, writes metadata to Firestore.
3. `storyStore`/`chatStore` update local state optimistically.
4. Cloud Function `deleteExpiredContent` removes media after TTL.

## Patterns in Cloud Functions
- **Scheduled Cleanup** for expiring content and embeddings.
- **Queue-Based Processing** using Firestore triggers for ingestion services.
- **Composition over Inheritance** via utility libs in `functions/lib`.

---
Generated automatically by Cursor AI to bootstrap the Memory Bank. 