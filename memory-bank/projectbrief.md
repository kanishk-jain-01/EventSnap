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

The project has evolved from a general Snapchat-style social app to a professional **EventSnap - Event-Driven Networking Platform** for conferences, festivals, and professional gatherings.

### Current Implementation Status (2025-01-03)
- **Phase 5.0 COMPLETE**: Event-scoped content system with role-based permissions
- **EventSnap Branding**: Complete transformation to Creative Light Theme (purple/pink professional design)
- **Text Overlays**: 200-character text annotations on photos with real-time validation
- **Role-Based UI Gating**: Host vs Guest permissions with clear UI messaging
- **Modern Navigation**: EventTabNavigator with AI Assistant placeholder for Phase 3.0
- **Production Ready**: TypeScript clean, ESLint compliant, comprehensive architecture

### Key Features Implemented
- **Event-Scoped Content**: All stories and snaps filtered by eventId with database-level scoping
- **Role-Based Permissions**: Host can send event snaps to all participants, guests receive-only
- **Text Overlay System**: Optional ≤200-character text annotations with character validation
- **Real-time Updates**: Live content feeds with event participant subscriptions
- **Professional UI**: EventSnap Creative Light Theme throughout with purple/pink color scheme
- **AI-Ready Backend**: Complete asset ingestion pipeline with Pinecone integration (Phase 2.0)
- **Content Lifecycle**: Automatic cleanup 24 hours after event ends

### Architecture
- Single-day events: All user-generated content expires 24h after the event ends
- Roles: Host (full permissions) and Guest (limited permissions) with clear UI differentiation
- Ephemeral photos with optional text overlays (no video in MVP)
- AI assistant infrastructure complete, ready for Phase 3.0 implementation
- EventSnap professional branding appropriate for business conferences
- Event layer fully integrated with existing UX patterns via `eventId` scoping and `eventStore`
