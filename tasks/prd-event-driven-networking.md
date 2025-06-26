# PRD: Event-Driven Networking – Ephemeral Event Stories

## 1. Introduction / Overview

This feature pivots the existing Snapchat-style MVP toward conferences, festivals, and other single-day events. Attendees, speakers, exhibitors, and organizers can share real-time photo "snaps" and short text-annotated stories that disappear 24 hours after the event ends. An in-app AI assistant (RAG-powered) surfaces contextual event information (agenda, speaker bios, exhibitor decks) on demand to enhance engagement and navigation.

## 2. Goals

1. Enable event participants to capture and share time-boxed photos with optional text annotation.
2. Provide an AI assistant that can answer contextual questions and retrieve event assets (PDF agendas, exhibitor lists, sponsor decks) in under 3 seconds.
3. Ensure all user-generated content and event assets auto-expire 24 hours after the event to preserve privacy and exclusivity.
4. Rebrand UI with an event-centric palette while retaining the familiar snap/workflow patterns.

## 3. User Stories

1. **Attendee – share moment**  
   _As an attendee, I want to snap a photo of a keynote slide and add a caption so others can see highlights in real time while the content auto-deletes after the event._
2. **Attendee – discover schedule details**  
   _As an attendee, after viewing a snap of a panel, I want to tap an AI prompt that tells me when and where that session is scheduled so I can decide to attend._
3. **Speaker – promote session**  
   _As a speaker, I want to post an annotated photo of my upcoming talk so attendees receive a teaser and can add it to their agenda._
4. **Exhibitor – drive booth traffic**  
   _As an exhibitor, I want to share a snap of my booth demo with "Find Us at B-12" text so visitors can locate us easily before the demo ends._
5. **Organizer – broadcast update**  
   _As an organizer, I want to push a story announcing last-minute schedule changes so everyone sees the update for the next 30 minutes._
6. **Organizer – post-event cleanup**  
   _As an organizer, I want all attendee-generated content to auto-expire 24 hours after the event so no stale media remains._
7. **Attendee – context request**  
   _As an attendee, when I view a snap of a product demo, I want to ask "Show me the exhibitor's deck" and receive the PDF immediately so I can review it while the demo is fresh._

## 4. Functional Requirements

1. The system **must** allow authenticated event participants (attendee, speaker, exhibitor, organizer roles) to capture or upload a photo.
2. The system **must** support adding a short text annotation (≤ 200 characters) overlay on each photo prior to posting.
3. The system **must** post photos to a real-time feed visible to all participants of the same event.
4. The system **must** group photos into "Event Stories" for easy carousel viewing.
5. The system **must** auto-expire and delete all event photos and stories 24 hours after the official event end-time.
6. The system **must** provide an in-app AI assistant chat/button that:
   a. Accepts free-text questions.  
   b. Retrieves answers by performing RAG over provided PDFs (agenda, exhibitor list, sponsor deck).  
   c. Returns answers within 3 seconds avg response time.
7. The system **must** ingest PDF assets into a vector store during event setup (organizer-only action).
8. The system **must** respect existing Firebase security rules; only event participants can read/post content for that event.
9. The system **must** use an event-branded color palette (to be provided by organizers) across all UI elements.

## 5. Non-Goals (Out of Scope)

- Video capture or upload.
- Attendee-to-attendee direct chat or matchmaking.
- Push notifications or email alerts.
- Multi-day or recurring event handling (single-day only for MVP).
- Public access for non-participants.

## 6. Design Considerations (Optional)

- Replace yellow Snapchat accent with event primary/secondary colors via Tailwind theme extension.
- Maintain dark-theme foundation for photo emphasis.
- Leverage existing `StoryRing`, `CameraScreen`, and `ImageEditor` components; update styling tokens only.
- AI assistant entry point: floating action button or bottom tab labeled "Ask AI".

## 7. Technical Considerations (Optional)

- Reuse Firestore `stories` collection logic; introduce `eventId` field for multi-event support (future-proofing).
- PDFs processed with an ingestion script → embeddings stored in a serverless vector DB (e.g., Pinecone) or local Supabase Vector.
- AI assistant via OpenAI functions + RAG; implement caching for repeated queries.
- Schedule auto-deletion via Firebase Cloud Function scheduled 24 h post-event.

## 8. Success Metrics (Proposed)

| Metric                                    | Target                                   |
| ----------------------------------------- | ---------------------------------------- |
| % of attendees who post at least one snap | ≥ 40 %                                   |
| Avg snaps per active poster               | ≥ 3                                      |
| Median AI-assistant response time         | ≤ 3 s                                    |
| AI assistant daily queries per attendee   | ≥ 1                                      |
| Content deletion compliance               | 100 % of items removed ≤ 25 h post-event |

_These targets are placeholders; organizers should confirm or adjust._

## 9. Open Questions

1. Finalize success-metric targets—are the proposed numbers acceptable?
2. Confirm exact event color palette (HEX codes) for UI theme.
3. What vector-database service (if any) is preferred for PDF embeddings?
4. Should AI assistant responses include external links (e.g., speaker LinkedIn) or be limited to in-app PDFs?
5. Any legal/privacy requirements for storing attendee-generated media (GDPR, consent prompts)?
