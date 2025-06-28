# Progress

_Last updated: {{date:YYYY-MM-DD}}_

## What Works ✅
- Core navigation and screen scaffolding
- Firebase initialization and config abstraction
- Auth flows: register, login, logout
- Camera capture and image upload to Storage
- Chat list and message viewing (Firestore backed)
- Story ring UI and viewer with 24h TTL logic
- Basic AI chat screen skeleton with service layer hooks
- Cloud Functions for cleanup and embedding ingestion
- Vector ingestion (PDF & image) functions deployed; Storage trigger auto-upserts to Pinecone

## In Progress 🚧
- AI Chat Retrieval-Augmented Generation (RAG) pipeline integration
- Event creation & feed screens refinement
- Push notification setup via Expo Notifications & FCM
- End-to-end testing configuration

## Next Up 🗓️
1. Finalize AI chat backend endpoints & client integration
2. Implement message reactions and typing indicators
3. Polish UI with Tailwind theme tokens
4. Add unit tests for hooks and stores
5. CI/CD pipeline via GitHub Actions + EAS builds

## Known Issues 🐞
- Occasional duplicate story documents (race condition on upload)
- Memory leaks when leaving CameraScreen rapidly
- Unhandled promise rejection in `ai/cleanup.service.ts` on network loss
- `uploadEventDocument` fails for some hosts (likely Storage rule / role mismatch)

---
Generated automatically by Cursor AI to bootstrap the Memory Bank. 