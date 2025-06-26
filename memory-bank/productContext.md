# Product Context: Snapchat Clone MVP

## Problem Statement

Creating a mobile social media application that replicates core Snapchat functionality for internal testing and learning purposes. The challenge is to implement ephemeral messaging, real-time communication, and media sharing in a beginner-friendly way.

## User Experience Goals

### Core User Journey

1. **Onboarding**: Simple email/password registration and login
2. **Camera Access**: Immediate access to camera for photo capture
3. **Snap Sending**: Easy selection of recipients and instant sending
4. **Story Posting**: One-tap story posting with automatic 24-hour expiration
5. **Chat Experience**: Real-time messaging with conversation history
6. **Content Viewing**: Intuitive story and snap viewing interfaces

### Design Principles

- **Simplicity First**: Clean, uncluttered interface focusing on core actions
- **Mobile-First**: Optimized for touch interactions and mobile gestures
- **Dark Theme**: Following Snapchat's signature dark aesthetic
- **Full-Screen Experience**: Immersive photo and story viewing
- **Gesture Navigation**: Swipe-based navigation between features

## Feature Requirements

### Authentication System

- Email/password registration with validation
- Secure login/logout with persistent sessions
- Profile creation with display name and optional avatar
- Password reset functionality (future enhancement)

### Photo Messaging (Snaps)

- Camera integration with front/back camera toggle
- Photo gallery selection as alternative to camera
- Recipient selection from user list
- Snap metadata tracking (sender, recipient, timestamp)
- View confirmation and automatic deletion after viewing

### Stories Feature

- 24-hour ephemeral story posting
- Story viewing from contacts
- Automatic story expiration and cleanup
- Story metadata (author, timestamp, expiration)
- Visual indicator for new/unseen stories

### Real-Time Chat

- Text messaging between users
- Real-time message synchronization
- Conversation history preservation
- Chat list showing recent conversations
- Message status indicators (sent, delivered)

### User Management

- User discovery and friend connections
- Contact list management
- User profile viewing
- Online/offline status (future enhancement)

## Success Metrics

### Technical Success

- App launches and runs without crashes
- All core features function as expected
- Real-time features work with minimal delay (<2 seconds)
- Image uploads complete successfully
- Authentication flows work reliably

### User Experience Success

- Intuitive navigation without user confusion
- Fast photo capture and sending (<5 seconds total)
- Stories load and display properly
- Chat messages appear in real-time
- Clean, responsive UI on both iOS and Android

## Non-Goals (Out of Scope)

- Video support for snaps or stories
- AR filters or camera effects
- Geolocation features (Snap Map)
- Advanced privacy settings
- Group stories or public feeds
- Push notifications (initial version)
- Multiple media formats beyond photos

## Open Questions for Future Iterations

1. Should chat support media sharing (photos in messages)?
2. How to implement a friend/following system for content visibility?
3. Should there be notification support for new snaps/messages?
4. What content moderation features are needed?
5. How to handle user blocking and privacy controls?

## User Personas

### Primary User: "Testing Team Member"

- **Goal**: Validate app functionality and user experience
- **Behavior**: Systematic testing of all features
- **Needs**: Clear feedback on feature completion and reliability

### Secondary User: "Social Media User"

- **Goal**: Experience Snapchat-like functionality
- **Behavior**: Photo sharing, story viewing, casual chatting
- **Needs**: Intuitive interface and reliable performance

## Pivot Update (2025-06-26): Event-Driven Networking Context

### New Problem Statement
Event attendees struggle to capture real-time moments and locate context (session times, exhibitor decks) within sprawling agendas. Existing social photo apps lack event-specific expiration and contextual AI search.

### Updated User Experience Goals
1. **Event Onboarding**: Choose or create an event before landing on the main feed.
2. **Photo Capture + Annotate**: Snap a photo, add ≤ 200-char text overlay, post to the event feed.
3. **AI Assistant Tap**: Users can query "When is this session?" or "Show me the sponsor deck" and receive PDF snippets instantly.
4. **Dynamic Theme**: App colours match event branding automatically.
5. **Automatic Cleanup**: All content removed 24 h post-event.

### Added User Personas
* **Organizer** – Needs rapid broadcast and asset ingestion.
* **Exhibitor** – Wants booth traffic via annotated snaps.

### Success Metrics (proposed)
- ≥ 40 % attendees post at least one snap
- AI assistant median response ≤ 3 s
- 100 % content deletion ≤ 25 h post-event

### Pivot Revision (2025-06-27)

Following further scoping, the event model has been simplified to two roles:

* **Host** – The event creator.  Can post stories/snaps, upload PDFs, edit theme, and end the event early.
* **Guest** – Any participant who joins an event (via public list or private join code).  Read-only access to feed and AI assistant.

The dynamic per-event colour palette has been deferred.  For MVP we will adopt a single modern palette that replaces Snapchat yellow.

All existing Contacts/Friends and 1-to-1 Chat requirements have been removed.  Snap workflow persists but is scoped to event participants only.
