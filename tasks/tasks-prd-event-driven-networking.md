## Relevant Files

- `src/services/firestore.service.ts` – Extend for event CRUD & queries
- `src/services/storage.service.ts` – PDF asset upload helper
- `src/services/ai/assistant.service.ts` – NEW: calls OpenAI & vector DB
- `src/services/ai/ingestion.service.ts` – NEW: PDF → embeddings pipeline
- `src/screens/organizer/EventSetupScreen.tsx` – NEW: organizer UI for event creation & asset upload
- `src/screens/auth/EventSelectionScreen.tsx` – NEW: choose or join event
- `src/screens/ai/AssistantScreen.tsx` – NEW: chat UI for AI assistant
- `src/store/eventStore.ts` – NEW: Zustand store for current event & participants
- `src/store/storyStore.ts` – Modify: add `eventId` filtering logic
- `src/components/ui/ThemeProvider.tsx` – NEW: provide event palette tokens
- `firebase.rules` – Update security rules for events & assets
- `functions/deleteExpiredContent.ts` – NEW Cloud Function for auto-expiry
- `tailwind.config.js` – Extend with dynamic event palette

### Notes
- Place AI service files under `src/services/ai/` for separation.
- Cloud Functions reside in `functions/` directory (not yet in repo – create).
- Unit tests should be placed alongside new service files (`*.test.ts`).

## Tasks

- [ ] 1.0 Event Data Model & Access Control
  - [ ] 1.1 Design Firestore `events` collection schema (id, name, startTime, endTime, palette, assets[])
  - [ ] 1.2 Add `eventId` field to `stories`, `snaps`, and chat indices; write migration script (optional)
  - [ ] 1.3 Update `firestore.service.ts` with CRUD helpers: `createEvent`, `getActiveEvent`, `joinEvent`
  - [ ] 1.4 Create `eventStore` Zustand store to hold current event context & participant role
  - [ ] 1.5 Amend Firebase security rules to restrict reads/writes by `eventId` membership

- [ ] 2.0 Event Setup & Asset Ingestion Pipeline
  - [ ] 2.1 Build `EventSetupScreen` UI for organizers (input event details, upload PDFs)
  - [ ] 2.2 Extend `storage.service.ts` to support PDF uploads & return URLs
  - [ ] 2.3 Implement `ingestion.service.ts` to parse PDFs and generate embeddings
  - [ ] 2.4 Trigger ingestion after upload via callable Cloud Function
  - [ ] 2.5 Store asset metadata & vector index reference in Firestore under the event document

- [ ] 3.0 AI Assistant Integration (UI + RAG Backend)
  - [ ] 3.1 Evaluate & configure vector DB (Supabase Vector or Pinecone) – env setup
  - [ ] 3.2 Implement Cloud Function `assistantChat` to perform similarity search + OpenAI completion
  - [ ] 3.3 Create `AssistantScreen` with chat UI & loading states
  - [ ] 3.4 Develop `assistant.service.ts` hook to send/receive streaming responses
  - [ ] 3.5 Add FAB or bottom-tab entry to open assistant from any event screen

- [ ] 4.0 UI Rebranding to Event Palette
  - [ ] 4.1 Extend `tailwind.config.js` with dynamic palette tokens (primary, accent)
  - [ ] 4.2 Build `ThemeProvider` to inject palette via NativeWind context
  - [ ] 4.3 Update core UI components (Button, Input, StoryRing) to reference theme tokens
  - [ ] 4.4 Implement event palette fetch on app launch & hot-reload styles

- [ ] 5.0 Event Stories & Feed Adaptation
  - [ ] 5.1 Update `storyStore` & Firestore queries to filter by current `eventId`
  - [ ] 5.2 Modify `CameraScreen` to add optional text overlay before posting
  - [ ] 5.3 Ensure annotation saved & rendered in `StoryViewerScreen`
  - [ ] 5.4 Build `EventSelectionScreen` for attendees to choose active event (pre-home)
  - [ ] 5.5 Update `HomeScreen` & snaps list to only show content for active event

- [ ] 6.0 Content Lifecycle Management & Auto-Expiry
  - [ ] 6.1 Write Cloud Function `deleteExpiredContent` to query stories/snaps older than eventEnd + 24h and purge
  - [ ] 6.2 Integrate logs & alerts for deletion outcomes
  - [ ] 6.3 Update local cleanup services to skip server-deleted docs gracefully
  - [ ] 6.4 Add unit/integration tests for lifecycle logic

---