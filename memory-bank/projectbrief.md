# Project Brief: Snapchat Clone MVP

## Project Overview

Building a Snapchat clone mobile application for internal testing and validation. This MVP focuses on core Snapchat functionality including ephemeral photo messaging, stories, real-time chat, and user authentication.

## Primary Goals

- **Photo Messaging**: Send and receive disappearing photo "snaps" between users
- **Stories**: Post and view 24-hour ephemeral stories from contacts
- **Real-time Chat**: Text messaging with real-time synchronization
- **User Authentication**: Secure email/password authentication system
- **Internal Testing**: Validate feasibility and reliability of core features

## Target Audience

- Internal testing team
- Developers learning mobile app development
- Users familiar with Snapchat-style social media apps

## Success Criteria

- All core features implemented and functional
- Users can successfully sign up, send snaps, post stories, and chat
- Clean, responsive UI following Snapchat design conventions
- Reliable Firebase backend integration
- Cross-platform compatibility (iOS/Android)

## Constraints

- MVP scope only - no advanced features like AR filters, video, or geolocation
- Internal testing only - not for public release
- Budget-conscious approach using free/low-cost Firebase tiers
- Single developer implementation (beginner-friendly)

## Timeline

- Target: MVP completion within 4-6 weeks
- Phased approach: Auth → Camera/Snaps → Stories → Chat → Polish

## Key Stakeholders

- Developer (primary implementer)
- Internal testing team
- Project reviewer/mentor (if applicable)

## Pivot Update (2025-06-26): Event-Driven Networking

The project is evolving from a general Snapchat-style social app to a niche **Event-Driven Networking** platform for conferences, festivals, and single-day gatherings.

Key points
- Single-day events: All user-generated content expires 24 h after the event ends.
- Roles: attendees, speakers, exhibitors, organizers – all authenticated participants can post.
- Ephemeral photos with text annotations only (no video in MVP).
- AI assistant powered by Retrieval-Augmented Generation (RAG) surfaces event PDFs (agenda, exhibitor list, sponsor decks, etc.).
- UI palette rebrands dynamically per-event while retaining existing UX patterns.
- Core Snapchat functionality remains; event layer is additive via `eventId` tagging and an `eventStore`.
