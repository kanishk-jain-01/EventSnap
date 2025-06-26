# Technical Context: EventSnap - Event-Driven Networking Platform

## Technology Stack

### Frontend Architecture

- **React Native**: 0.76.5 with Expo SDK 52
- **TypeScript**: 5.3.3 with strict mode enabled
- **Navigation**: React Navigation v6 with stack and tab navigators
- **State Management**: Zustand for global app state
- **Styling**: NativeWind (TailwindCSS for React Native) with Creative Light Theme
- **UI Components**: Custom component library with EventSnap branding

### Backend Services

- **Firebase Auth**: Email/password authentication with persistent sessions
- **Firestore**: NoSQL database with event-scoped collections and optimized queries
- **Firebase Storage**: File storage for images, PDFs, and user assets
- **Cloud Functions**: Node.js serverless functions for AI processing and cleanup
- **Firebase Realtime Database**: Real-time messaging (legacy - to be deprecated)

### AI & Search Infrastructure

- **OpenAI API**: GPT-4 for text processing and embeddings generation
- **Pinecone**: Vector database for semantic search and RAG capabilities
- **PDF Processing**: pdf-parse for document text extraction
- **Image Processing**: Sharp for image optimization and thumbnail generation

### Development Tools

- **ESLint v9**: Code linting with zero errors policy
- **Prettier**: Code formatting with consistent styling
- **TypeScript**: Full type coverage with strict mode
- **Expo CLI**: Development and deployment tooling
- **Firebase CLI**: Backend service deployment

## Current Architecture Status (Phase 6.0 - 50% Complete)

### Event Discovery & Onboarding System

- **EventSelectionScreen**: Professional event discovery interface with EventSnap branding
- **Public Event Queries**: Database-level filtering with startTime ordering and compound indexes
- **Private Event Access**: 6-digit join code system with validation and participant management
- **Role Assignment**: Automatic host/guest determination with proper state management
- **Navigation Integration**: Seamless auth flow integration (pending Task 6.4)

### Database Architecture (Enhanced)

```typescript
// Optimized Firestore queries for event discovery
interface EventDatabaseQueries {
  publicEvents: {
    query: "collection('events').where('visibility', '==', 'public').orderBy('startTime', 'asc').limit(20)";
    indexes: 'Compound index on (visibility, startTime)';
    performance: 'Configurable pagination with efficient filtering';
  };
  
  privateEvents: {
    query: "collection('events').where('joinCode', '==', code).where('visibility', '==', 'private').limit(1)";
    validation: 'Real-time join code verification';
    security: 'Database-level access control';
  };
  
  participants: {
    collection: '/events/{eventId}/participants/{uid}';
    structure: '{ role: "host" | "guest", joinedAt: serverTimestamp() }';
    roleLogic: 'Host if uid === hostUid, else Guest';
  };
}
```

### State Management (Enhanced)

```typescript
// EventStore with public event discovery
interface EventStoreState {
  // Core Event State
  activeEvent: AppEvent | null;
  role: 'host' | 'guest' | null;
  
  // Event Discovery (NEW - Phase 6.0)
  publicEvents: AppEvent[];
  
  // Event Management
  eventParticipants: User[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadPublicEvents: () => Promise<void>;
  joinEventByCode: (code: string) => Promise<void>;
  createEvent: (eventData: CreateEventData) => Promise<void>;
  joinEvent: (eventId: string) => Promise<void>;
}
```

### Component Architecture (Enhanced)

- **EventSelectionScreen**: Professional event discovery with status indicators
- **Public Events Display**: Paginated event listing with Live Now/Upcoming/Ended status
- **Private Event Joining**: 6-digit code input with real-time validation
- **Host Event Creation**: Navigation to EventSetupScreen with proper permissions
- **Error Handling**: Comprehensive validation with user-friendly messaging

## Development Environment

### Required Dependencies

```json
{
  "expo": "~52.0.0",
  "react-native": "0.76.5",
  "typescript": "~5.3.3",
  "firebase": "^11.1.0",
  "@react-navigation/native": "^6.1.18",
  "zustand": "^5.0.2",
  "nativewind": "^4.1.23"
}
```

### Firebase Configuration

- **Project ID**: snapchat-clone-mvp
- **Region**: us-central1 (Cloud Functions)
- **Authentication**: Email/password provider enabled
- **Firestore**: Multi-region database with security rules
- **Storage**: User-scoped file organization with automatic cleanup
- **Functions**: Node.js 18 runtime with TypeScript

### Security Configuration

```typescript
// Firestore Security Rules (Event-Scoped)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Event access control
    match /events/{eventId} {
      allow read: if isEventParticipant(eventId);
      allow write: if isEventHost(eventId);
      
      // Participant management
      match /participants/{userId} {
        allow read, write: if isEventParticipant(eventId);
      }
    }
    
    // Public event discovery
    match /events/{eventId} {
      allow read: if resource.data.visibility == 'public';
    }
  }
}
```

## Quality Assurance

### Code Quality Standards

- **TypeScript**: 0 compilation errors, strict mode enabled
- **ESLint**: 0 errors, 11 pre-existing warnings (console statements)
- **Prettier**: Consistent code formatting across all files
- **Testing**: Manual verification for all implemented features

### Performance Optimization

- **Database Queries**: Compound indexes for efficient event discovery
- **State Management**: Optimized Zustand stores with proper error handling
- **Image Processing**: Compression and optimization for all uploaded assets
- **Memory Management**: Proper cleanup and disposal of resources

### Production Readiness

- **Error Handling**: Comprehensive try-catch blocks with user-friendly messaging
- **Loading States**: Professional loading indicators throughout the app
- **Offline Support**: Proper error handling for network connectivity issues
- **Security**: Role-based access control and Firebase security rules

## Deployment Architecture

### Cloud Functions (Production)

- **deleteExpiredContent**: Comprehensive cleanup system for expired events
- **ingestPDFEmbeddings**: PDF processing with OpenAI embeddings
- **ingestImageEmbeddings**: Image processing with vector generation
- **cleanupExpiredEventsScheduled**: Daily automated cleanup (2:00 AM UTC)

### Firebase Services

- **Authentication**: Production-ready user management
- **Firestore**: Optimized database with proper indexing
- **Storage**: Organized file structure with automatic cleanup
- **Hosting**: Static asset hosting for web components

### Monitoring & Analytics

- **Firebase Analytics**: User engagement and feature usage tracking
- **Cloud Function Logs**: Comprehensive logging for debugging
- **Performance Monitoring**: App performance and crash reporting
- **Security Monitoring**: Authentication and access control auditing

## Current Development Status

- **Phase 6.0**: Role-Aware Onboarding & Permissions (50% complete)
- **Event Discovery**: Professional public event listing with status indicators
- **Private Events**: Complete 6-digit join code system with validation
- **Participant Management**: Role assignment with database sub-collections
- **Next Tasks**: Auth flow integration, AsyncStorage persistence, role-based navigation

**Architecture Status**: EventSnap is now a professional event-driven networking platform with comprehensive event discovery and joining capabilities, ready for auth flow integration to complete the onboarding experience.
