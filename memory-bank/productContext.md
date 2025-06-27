# Product Context: Event-Driven Snapchat Clone

## Why This Project Exists

### Problem Statement
Traditional social media platforms create permanent digital footprints and lack context-specific sharing. Users want to share moments within specific events or gatherings without the content living forever or being visible to their entire network.

### Solution Approach
An event-driven ephemeral messaging platform that:
- Requires users to be part of specific events to access content
- Automatically deletes all content after predetermined timeframes
- Provides rich, real-time communication within event contexts
- Maintains privacy through event-scoped interactions

## How It Should Work

### User Journey

#### 1. Onboarding Flow
1. **Authentication**: Email/password registration with Firebase
2. **Event Selection**: User must either create or join an event
3. **Role Assignment**: Automatic role assignment (host for creators, guest for joiners)
4. **Main App Access**: Only granted after successful event participation

#### 2. Event Management
- **Event Creation**: Hosts can create events with names, time ranges, and auto-generated join codes
- **Event Joining**: Users join via 6-digit codes shared by hosts
- **Event Switching**: Users can participate in multiple events but only one active at a time

#### 3. Content Sharing
- **Snap System**: Take photos or select from gallery, optimize automatically, send to event participants
- **Story System**: Post content visible to all event participants for 24 hours
- **Real-time Chat**: Text messaging with typing indicators and read receipts

#### 4. Content Consumption
- **Snap Viewing**: Tap to view received snaps, which disappear after viewing
- **Story Feed**: Browse stories from event participants
- **Chat Conversations**: Real-time messaging with status tracking

### User Experience Goals

#### Simplicity
- Minimal steps to join events and start sharing
- Intuitive camera interface with smart optimization
- Clear visual feedback for all actions

#### Privacy & Ephemerality
- All content automatically expires
- Event-scoped visibility (no global social graph)
- Clear indicators of content status (sent, delivered, viewed)

#### Real-Time Engagement
- Instant message delivery and status updates
- Live typing indicators
- Immediate snap notifications

#### Quality & Reliability
- Professional image processing and compression
- Robust error handling with graceful degradation
- Offline capability where possible

## Target User Personas

### The Event Host
- **Needs**: Create private spaces for gatherings, control who can participate
- **Goals**: Facilitate sharing among attendees, maintain event privacy
- **Behaviors**: Creates events, shares join codes, monitors participation

### The Event Participant
- **Needs**: Share moments with fellow attendees, see what others are sharing
- **Goals**: Connect with others at the event, capture memories
- **Behaviors**: Joins events via codes, shares snaps/stories, engages in chat

### The Privacy-Conscious User
- **Needs**: Share content without permanent digital footprint
- **Goals**: Maintain control over content lifespan and visibility
- **Behaviors**: Values ephemeral nature, appreciates event-scoped sharing

## Success Indicators

### Engagement Metrics
- Time spent in app during events
- Number of snaps/stories shared per event
- Chat message frequency and response rates

### User Satisfaction
- Event creation to participation conversion rate
- User retention across multiple events
- Positive feedback on content quality and app performance

### Technical Performance
- Message delivery speed and reliability
- Image upload and processing efficiency
- App stability and error rates 