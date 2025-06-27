## Relevant Files

- `src/store/eventStore.ts` – Enforce single-event membership; add host promotion helpers
- `src/services/firestore.service.ts` – Generate `hostCode`, promote guest to host, membership checks
- `src/screens/auth/EventSelectionScreen.tsx` – Block join/create when already in an event; UX messages
- `src/screens/organizer/EventSetupScreen.tsx` – Send `hostCode` when creating events; warn user if already in event
- `src/screens/profile/ManageEventScreen.tsx` – NEW: hosts manage docs & end event; host-code promotion UI
- `src/navigation/MainTabNavigator.tsx` – Add ManageEvent and Contacts screens to Profile stack
- `src/screens/profile/ProfileScreen.tsx` – Toggle for contact sharing & links to Manage/Contacts screens
- `src/screens/profile/ContactsListScreen.tsx` – NEW: list participants who shared contact info
- `src/store/userStore.ts` – Add `shareContact` field; update persistence
- `src/services/realtime/messaging.service.ts` – Ensure event-scoped chat rooms
- `src/store/chatStore.ts` – Enforce eventId for 1-to-1 chat creation & queries
- `database.rules.json` – Realtime DB rules for event-scoped chat
- `firestore.rules` – Allow host promotion write; protect assets list
- `tailwind.config.js` – (If needed) minor color tokens for Manage screens

### Notes

- Unit tests should live alongside new screens/services (e.g., `ManageEventScreen.test.tsx`).
- Use Expo mocks for file upload tests.
- Migration scripts for legacy chat can be manual—no code change required if we mark old rooms as archived.

## Tasks

- [ ] 1.0 Enforce Single-Event Membership Logic
  - [ ] 1.1 Add `hasActiveEvent` guard in `createEvent` (service + UI error state)
  - [ ] 1.2 Update `joinEvent` & `joinEventByCode` to reject when `activeEvent` exists
  - [ ] 1.3 Update `EventSelectionScreen` to surface "Leave current event first" toast
  - [ ] 1.4 Extend `eventStore.clearState()` usage when leaving/ending events
  - [ ] 1.5 Write unit tests for create/join guards

- [ ] 2.0 Implement Host Promotion via Host Code
  - [ ] 2.1 Generate 6-digit `hostCode` in `createEvent`
  - [ ] 2.2 Add `promoteToHost(eventId, code)` helper in `firestore.service.ts`
  - [ ] 2.3 Add UI in `ManageEventScreen` to enter host code & call promotion helper
  - [ ] 2.4 Update Firestore rules to allow role update when correct code supplied
  - [ ] 2.5 Write integration tests for host promotion flow

- [ ] 3.0 Complete Manage Event Page (Hosts Only)
  - [ ] 3.1 Create `ManageEventScreen` with docs list, upload, end-event buttons
  - [ ] 3.2 Reuse `StorageService.uploadEventAsset` for new uploads
  - [ ] 3.3 Wire "End Event" to existing cleanup CF & reset navigation
  - [ ] 3.4 Link screen from `ProfileScreen` when role === host
  - [ ] 3.5 QA flows on iOS & Android devices

- [ ] 4.0 Add Opt-In Contact Sharing & Contacts List
  - [ ] 4.1 Add `shareContact` boolean to Firestore user document on profile toggle
  - [ ] 4.2 Add toggle UI in `ProfileScreen`
  - [ ] 4.3 Create `ContactsListScreen` showing participants with sharing enabled
  - [ ] 4.4 Update store and hooks to subscribe to shared contacts list
  - [ ] 4.5 Unit test contact toggle persistence and list query

- [ ] 5.0 Harden Event-Scoped 1-to-1 Chat Permissions
  - [ ] 5.1 Add `eventId` field enforcement in chat room creation logic
  - [ ] 5.2 Update Realtime DB rules to restrict read/write to same-event participants
  - [ ] 5.3 Update chat UI to display error if users are in different events
  - [ ] 5.4 Add jest tests for chat rule validation using Firebase emulator
  - [ ] 5.5 Manual regression test old chat rooms remain accessible within event boundaries

- [ ] 6.0 Restrict Camera to Hosts & Simplify Capture Flow
  - [ ] 6.1 Hide `Camera` tab and direct capture entry points for guests (navigation & conditional rendering)
  - [ ] 6.2 Remove Snap / Avatar / Thumbnail mode toggles from `CameraScreen`; default to "Story" capture
  - [ ] 6.3 Remove or disable snap-sending logic in `snapStore` and related services when feature flag OFF
  - [ ] 6.4 Update UI copy and icons to reflect Stories-only capture
  - [ ] 6.5 Write unit tests ensuring guests can't access camera routes
  - [ ] 6.6 QA on iOS & Android devices with both host and guest accounts

- [ ] 7.0 Redesign Event Feed for Stories-Only & Assistant Entry
  - [ ] 7.1 Refactor `EventFeedScreen` to remove Snaps section and empty-state copy
  - [ ] 7.2 Display story rings grouped by host with clear labels (Host name + avatar)
  - [ ] 7.3 Add engaging empty state: "No stories yet – encourage hosts to post"
  - [ ] 7.4 Add floating "Ask the Assistant" action button that opens Assistant tab (placeholder)
  - [ ] 7.5 Update tests and snapshots for new feed layout
  - [ ] 7.6 QA visual polish across light & dark accessibility modes 