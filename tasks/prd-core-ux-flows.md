## Introduction / Overview

EventSnap currently offers role-aware onboarding, event-scoped content, and a professional UI.  Before integrating the AI Assistant and retiring legacy code, we need to harden the core user flows and finalize critical permission logic so the platform is functionally solid for real-world use.  This PRD defines the remaining foundational features and constraints that ensure a predictable, secure, and user-friendly baseline.

## Goals

1. Enforce single-event membership: a user (host **or** guest) can belong to only one event at any time.
2. Introduce host promotion & multi-host support via **host code**.
3. Complete the Manage Event experience for hosts (end event, add/view documents).
4. Provide opt-in contact sharing among participants.
5. Retain 1-to-1 event chat for all participants while legacy cleanup is postponed.

## User Stories

1. **As a guest**, I want to enter a host code to become a host so I can help manage the event.
2. **As a user**, I want the app to prevent me from joining or creating another event while I'm already in one so my experience stays focused.
3. **As a host**, I want a Manage Event page where I can end the event or add/view uploaded documents so I have control over my event.
4. **As a participant**, I want a toggle in my profile to share my contact info so I can network with others at the event.
5. **As any participant**, I need to chat 1-to-1 with other participants in the same event so I can network privately.

## Functional Requirements

1. **Single-Event Membership**
   1. The system MUST block event creation if the user already has an activeEvent in any role.
   2. The system MUST block joining another event if the user already has an activeEvent.
   3. Leaving or ending the current event MUST clear the user's activeEvent, enabling new event participation.
2. **Host Promotion & Host Code**
   1. Each event document MUST store a `hostCode` (6 digits, auto-generated).
   2. A guest who supplies the correct hostCode MUST be promoted to role = `host` in the participants sub-collection.
   3. Host code entry UI MUST live inside the "Manage Event" section of Profile.
3. **Manage Event Page (Hosts Only)**
   1. MUST display a list of existing documents (PDF/image names) with open/download action.
   2. MUST allow uploading additional documents (re-using current upload flow).
   3. MUST contain "End Event" button triggering immediate cleanup via the existing Cloud Function.
4. **Contact Sharing**
   1. Each user document MUST include an `shareContact` boolean default = false.
   2. Profile screen MUST expose a toggle "Share my contact info with participants".
   3. Contacts list screen MUST list participants who have shareContact == true, showing email, phone, LinkedIn.
5. **Event Chat (1-to-1)**
   1. MUST limit Realtime DB chat rooms to participants of the same event.
   2. Existing chat screens/services MAY be kept; they MUST enforce eventId for all new chats.

## Non-Goals

- Group chat or reactions/comments on stories.
- Advanced admin dashboards or analytics.
- File type expansion beyond PDF & images.

## Design Considerations

- Follow existing Creative Light Theme tokens.
- Manage Event UI should sit under Profile -> "Manage Event".
- Contact list can reuse existing list components with avatar + name.

## Technical Considerations

- Firestore security rules need updates for host promotion (write access).
- Cloud Function cleanup is already deployed; ensure callable endpoint is reused.
- Realtime DB rules must include `eventId` validation for chat rooms.

## Success Metrics

- 100 % of navigation test cases exit an event before new event creation is allowed.
- ≤5 s median time from "End Event" tap to being redirected to EventSelection.
- ≥80 % of hosts successfully promote another host via code in user testing.
- 0 security rule violations related to host promotion or chat access during QA.

## Open Questions

1. Do we need rate-limiting or confirmation dialogs for host promotion to avoid abuse?
2. Should contact sharing information be downloadable/exportable?
3. Is there a max number of hosts per event we should enforce? 