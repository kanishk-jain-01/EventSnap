# System Patterns: Technical Architecture

## Architecture Overview

### Layer Architecture
```
┌─────────────────────────────────────┐
│           Presentation Layer        │  React Native + UI Components
├─────────────────────────────────────┤
│           Navigation Layer          │  React Navigation + Route Guards
├─────────────────────────────────────┤
│           State Management          │  Zustand Stores + Local State
├─────────────────────────────────────┤
│           Service Layer             │  Firebase Services + Business Logic
├─────────────────────────────────────┤
│           Data Layer                │  Firebase Backend + Local Storage
└─────────────────────────────────────┘
```

## Key Design Patterns

### 1. Event-Driven Architecture
- **Central Concept**: All user interactions happen within event contexts
- **Implementation**: Event store manages active event state across the app
- **Benefits**: Clean separation of concerns, scalable multi-event support

### 2. Service Layer Pattern
- **Structure**: Dedicated service classes for each Firebase service
- **Examples**: `AuthService`, `FirestoreService`, `StorageService`, `MessagingService`
- **Benefits**: Centralized business logic, consistent error handling, testability

### 3. State Management with Zustand
- **Stores**: Separate stores for different domains (auth, events, snaps, chat, stories)
- **Pattern**: Actions co-located with state, async operations handled in store actions
- **Benefits**: TypeScript integration, minimal boilerplate, predictable state updates

### 4. Component Composition
- **Structure**: 
  - `components/ui/` - Reusable UI primitives
  - `components/features/` - Feature-specific components
  - `components/common/` - Shared business components
- **Benefits**: Reusability, consistent design system, maintainability

## Data Flow Patterns

### Authentication Flow
```
App Launch → Auth Check → Event Validation → Main App Access
     ↓              ↓              ↓              ↓
Auth Store → Firebase Auth → Event Store → Navigation
```

### Content Sharing Flow
```
Camera Capture → Image Optimization → Recipient Selection → Upload → Notification
       ↓                ↓                    ↓           ↓         ↓
   CameraService → ImageUtils → SnapStore → Storage → Firestore → Realtime
```

### Real-time Messaging Flow
```
Message Input → Validation → Send → Real-time Sync → Status Update
      ↓            ↓         ↓         ↓             ↓
  ChatStore → MessagingService → Realtime DB → Listeners → UI Update
```

## Firebase Integration Patterns

### 1. Multi-Database Strategy
- **Firestore**: Structured data (users, events, snaps metadata, stories)
- **Realtime Database**: Real-time messaging and presence
- **Storage**: Image and media files
- **Functions**: Background processing and cleanup

### 2. Security Rules Pattern
- **Principle**: Event-scoped access control
- **Implementation**: Rules validate user participation in events
- **Example**: Users can only access snaps/stories within their active events

### 3. Data Modeling
```
Firestore Collections:
├── users/{uid}
├── events/{eventId}
│   └── participants/{uid}
├── snaps/{snapId}
└── stories/{storyId}

Realtime Database:
├── messages/{chatId}/{messageId}
├── conversations/{chatId}
├── presence/{userId}
└── typing/{chatId}/{userId}
```

## Performance Patterns

### 1. Image Optimization Pipeline
- **Context-Aware**: Different optimization for snaps, stories, avatars
- **Automatic**: Smart compression based on content and network
- **Progressive**: Show thumbnails while full images load

### 2. Real-time Optimization
- **Connection Management**: Monitor online/offline status
- **Message Queuing**: Queue messages when offline
- **Listener Management**: Proper cleanup to prevent memory leaks

### 3. State Persistence
- **Database-First**: User's active event stored in Firestore user document
- **Real-time Sync**: Event state synchronized between auth store and event store
- **Cross-Device Consistency**: Active event persists across devices and sessions
- **Session Persistence**: Active events survive logout/login cycles
- **Explicit Termination**: Events only cleared when expired or ended by host

## Error Handling Patterns

### 1. Layered Error Handling
- **Service Layer**: Catch and transform Firebase errors
- **Store Layer**: Handle business logic errors
- **UI Layer**: Display user-friendly error messages

### 2. Graceful Degradation
- **Offline Support**: Basic functionality when network unavailable
- **Permission Handling**: Clear user guidance for required permissions
- **Fallback UI**: Show appropriate states for loading/error conditions

### 3. Error Recovery
- **Automatic Retry**: For transient network errors
- **User-Initiated Retry**: For actions that can be safely repeated
- **Error Reporting**: Log errors for debugging and monitoring

## Security Patterns

### 1. Authentication Guard
- **Implementation**: Route-level authentication checks
- **Event Validation**: Ensure user has active event before main app access
- **Session Management**: Handle auth state changes gracefully

### 2. Data Validation
- **Client-Side**: Immediate feedback for user input
- **Server-Side**: Firebase security rules as final validation
- **Type Safety**: TypeScript interfaces for data contracts

### 3. Content Security
- **Ephemeral Design**: All content has expiration times
- **Access Control**: Event-scoped visibility rules
- **Cleanup Services**: Automated deletion of expired content

## Scalability Patterns

### 1. Modular Architecture
- **Feature Isolation**: Each feature can be developed independently
- **Service Boundaries**: Clear interfaces between services
- **Component Reusability**: Shared components across features

### 2. Efficient Data Loading
- **Pagination**: Load messages and content in chunks
- **Lazy Loading**: Load content only when needed
- **Caching**: Store frequently accessed data locally

### 3. Background Processing
- **Firebase Functions**: Handle cleanup and processing server-side
- **Client-Side Cleanup**: Opportunistic cleanup on app launch
- **Scheduled Tasks**: Regular maintenance via cloud functions 