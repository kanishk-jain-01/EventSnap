## Relevant Files

- `src/services/firestore.service.ts` – Extend for event CRUD operations (`createEvent`, `joinEvent`, `getActiveEvent`, etc.)
- `src/services/storage.service.ts` – Add PDF upload helper for event assets
- `src/services/ai/assistant.service.ts` – NEW: client helper to call AI assistant Cloud Function and stream responses
- `src/services/ai/ingestion.service.ts` – NEW: helper to send PDFs to ingestion Cloud Function
- `src/store/eventStore.ts` – NEW: Zustand store for current event, role, and participants
- `src/navigation/EventTabNavigator.tsx` – NEW: Tab navigator for `EventFeed`, `Assistant`, `Profile`
- `src/screens/auth/EventSelectionScreen.tsx` – NEW: list public events / join private event
- `src/screens/organizer/EventSetupScreen.tsx` – NEW: create or edit event (Host only)
- `src/screens/main/EventFeedScreen.tsx` – NEW: combined event feed (stories + snaps)
- `src/screens/ai/AssistantScreen.tsx` – NEW: chat UI for AI assistant
- `src/screens/main/CameraScreen.tsx` – MODIFY: role gating & text-overlay before posting
- `src/components/ui/ThemeProvider.tsx` – MODIFY: provide modern palette tokens
- `src/store/storyStore.ts` – MODIFY: filter queries by `eventId`
- `src/store/snapStore.ts` – MODIFY: enforce `eventId` and Host-only posting
- `tailwind.config.js` – MODIFY: replace Snapchat yellow with new palette
- `firebase.rules` – UPDATE: events, participants, snaps/stories access control
- `functions/assistantChat/index.ts` – NEW: Cloud Function for AI assistant (RAG)
- `functions/deleteExpiredContent/index.ts` – NEW: scheduled Cloud Function for cleanup
- `functions/ingestPDFEmbeddings/index.ts` – NEW: Cloud Function for PDF → embeddings pipeline
- `src/store/chatStore.ts`, `src/services/realtime/`, `src/screens/main/Chat*` – DELETE: retire 1-to-1 chat
- `src/screens/main/HomeScreen.tsx` – DELETE: superseded by `EventFeedScreen`

### Notes
- Place AI-related service files under `src/services/ai/`.
- Cloud Functions live in the root `functions/` directory.
- Delete files marked **DELETE** once removal tasks are complete.

## Tasks

- [ ] 1.0 Event Data Model & Access Control
  - [ ] 1.1 Define Firestore `events` schema with fields: `name`, `visibility` (`public`|`private`), `joinCode` (nullable), `startTime`, `endTime`, `hostUid`, `palette`, `assets` []
  - [ ] 1.2 Create `/events/{eventId}/participants/{uid}` sub-collection with `{ role: 'host'|'guest', joinedAt }`
  - [ ] 1.3 Add `eventId` to `stories` and `snaps` documents; write one-off migration script (optional during dev)
  - [ ] 1.4 Update `firestore.service.ts` with helpers: `createEvent`, `joinEvent`, `getActiveEvent`, `addParticipant`, `removeParticipant`
  - [ ] 1.5 Implement `eventStore` Zustand slice (current event, role, participants, loading/error states)
  - [ ] 1.6 Amend `firebase.rules` to enforce: Host write access, Guest read-only, private event join via `joinCode`
  - [ ] 1.7 Add Firestore indexes for event visibility & participant queries

- [ ] 2.0 Event Setup & Asset Ingestion Pipeline (Host only)
  - [ ] 2.1 Create `EventSetupScreen` form for event details & palette picker
  - [ ] 2.2 Build client createEvent flow: validation, palette selection, Host assignment
  - [ ] 2.3 Extend `storage.service.ts` for uploading PDFs to `/events/{eventId}/assets/`
  - [ ] 2.4 Implement `ingestion.service.ts` to call Cloud Function for PDF embedding
  - [ ] 2.5 Write Cloud Function `ingestPDFEmbeddings` storing embeddings in Pinecone & asset metadata in Firestore
  - [ ] 2.6 Show asset upload progress & error handling in UI
  - [ ] 2.7 Add "End Event" / delete event action for Host; hook into cleanup CF

- [ ] 3.0 AI Assistant Integration (RAG Backend + UI)
  - [ ] 3.1 Configure Pinecone/vector DB credentials & environment variables
  - [ ] 3.2 Write `assistantChat` Cloud Function: similarity search → OpenAI completion (streaming)
  - [ ] 3.3 Implement `assistant.service.ts` for SSE/WebSocket streaming responses
  - [ ] 3.4 Build `AssistantScreen` chat UI with loading & error states
  - [ ] 3.5 Add Assistant entry point in `EventTabNavigator`

- [ ] 4.0 UI Theme Refresh (Single Modern Palette)
  - [ ] 4.1 Choose and document new primary/accent colors; update `tailwind.config.js`
  - [ ] 4.2 Implement `ThemeProvider` injecting palette via NativeWind context
  - [ ] 4.3 Refactor UI components (Button, Input, StoryRing, etc.) to use theme tokens
  - [ ] 4.4 Remove all references to Snapchat yellow and old brand assets
  - [ ] 4.5 Snapshot tests to verify new theme renders correctly

- [ ] 5.0 Event Stories, Snaps & Feed Adaptation
  - [ ] 5.1 Create `EventFeedScreen` combining stories + snaps for current event
  - [ ] 5.2 Update `storyStore` & Firestore queries to filter by `eventId`
  - [ ] 5.3 Update `snapStore` & Firestore queries to filter by `eventId` and enforce Host-only posting
  - [ ] 5.4 Add optional ≤200-char text overlay workflow in `CameraScreen` before posting
  - [ ] 5.5 Role gating: hide post buttons for Guests in UI and services
  - [ ] 5.6 Update navigation: add `EventTabNavigator` (Feed, Assistant, Profile) and remove `HomeScreen`

- [ ] 6.0 Role-Aware Onboarding & Permissions
  - [ ] 6.1 Build `EventSelectionScreen` with Public Events list (paginated) & Private join-code form
  - [ ] 6.2 Implement Firestore query for public events; ordering by `startTime`
  - [ ] 6.3 Implement `joinEvent` via `joinCode`; update `eventStore` & participants sub-collection
  - [ ] 6.4 Integrate selection screen into auth flow (redirect when `activeEvent` null)
  - [ ] 6.5 Persist last `activeEvent` in AsyncStorage; auto-rejoin on app launch
  - [ ] 6.6 Conditional navigation/screens based on role (Host vs Guest)

- [ ] 7.0 Content Lifecycle Management & Auto-Expiry
  - [ ] 7.1 Write `deleteExpiredContent` Cloud Function to purge stories/snaps older than `event.endTime + 24h`
  - [ ] 7.2 Schedule function daily; add callable endpoint for Host "End Event" trigger
  - [ ] 7.3 Update local cleanup services to ignore server-deleted docs gracefully
  - [ ] 7.4 Add logging & monitoring (Firebase Logging) for cleanup outcomes

- [ ] 8.0 Legacy Cleanup & Refactor
  - [ ] 8.1 Remove Contacts system: delete `/users/{uid}/contacts/**`, UI components, rules
  - [ ] 8.2 Retire 1-to-1 Chat: delete Realtime DB paths, `chatStore`, chat screens, services, rules
  - [ ] 8.3 Delete `HomeScreen` and old feed components; update navigation references
  - [ ] 8.4 Update snap rules: restrict reads/writes to event participants; drop friend-specific logic
  - [ ] 8.5 Delete or refactor `snapCleanup.service.ts` if redundant with CF
  - [ ] 8.6 Remove deprecated Snapchat yellow palette tokens/assets
  - [ ] 8.7 Code sweep & ESLint pass to ensure no unused imports/vars
  - [ ] 8.8 Regression test remaining modules after cleanup

---