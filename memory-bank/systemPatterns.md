# System Patterns: EventSnap - Event-Driven Networking Platform

## Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │    Firebase     │    │   AI Services   │    │   File Storage  │
│   Frontend App  │◄──►│    Backend      │◄──►│   (OpenAI +     │◄──►│   (Images +     │
│                 │    │                 │    │    Pinecone)    │    │    PDFs)        │
│ • EventSnap UI  │    │ • Auth          │    │ • Embeddings    │    │ • Event Assets  │
│ • Theme System  │    │ • Firestore     │    │ • RAG Search    │    │ • Stories       │
│ • State (Zustand│    │ • Cloud Funcs   │    │ • Cleanup       │    │ • Snaps         │
│ • Navigation    │    │ • Storage       │    │                 │    │ • Avatars       │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow Patterns

#### Event-Scoped Content Flow (NEW - IMPLEMENTED PHASE 5.0)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Action   │    │  Database Query │    │   UI Update     │
│                 │    │                 │    │                 │
│ • Post Story    │───►│ • Event Filter  │───►│ • Real-time     │
│ • Send Snap     │    │ • Role Check    │    │   Feed Update   │
│ • View Feed     │    │ • Batch Write   │    │ • Theme Applied │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

1. **Content Creation**: User creates story/snap with eventId
2. **Role Validation**: Service-level permission checking (host/guest)
3. **Database Scoping**: Content automatically filtered by event
4. **Real-time Distribution**: Live updates to event participants only
5. **Theme Integration**: EventSnap Creative Light Theme throughout

#### Authentication Flow (EventSnap Branding)

1. User inputs credentials → Firebase Auth
2. Auth state change → Zustand store update
3. EventSnap-branded navigation redirect based on auth status
4. Protected routes check auth state with Creative Light Theme

#### Event Lifecycle Flow (EVENT-DRIVEN ARCHITECTURE)

1. Host creates event → EventSetupScreen with Creative Light Theme validation
2. Event document creation → Firestore with role assignments
3. Asset upload → Firebase Storage + Cloud Function triggers
4. PDF/Image ingestion → OpenAI embeddings → Pinecone storage
5. Event participation → Host/guest role assignment with theme-aware UI
6. **Content creation → Event-scoped stories/snaps with role-based permissions (NEW)**
7. **Real-time content updates → Event participants receive live feed updates (NEW)**
8. Event end → Manual or automatic (24h) cleanup
9. Comprehensive cleanup → All content + vectors deleted

#### Theme System Flow (IMPLEMENTED PHASE 4.0)

1. App initialization → ThemeProvider wraps entire app
2. Component render → useThemeColors() hook accesses tokens
3. Dynamic styling → Theme tokens applied via className
4. State changes → Memoized context prevents unnecessary re-renders
5. Consistent branding → EventSnap identity throughout

#### Role-Based Content Flow (NEW - IMPLEMENTED PHASE 5.0)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      Host       │    │   Validation    │    │  Distribution   │
│                 │    │                 │    │                 │
│ • Create Story  │───►│ • Check Role    │───►│ • All Event     │
│ • Send Snap     │    │ • Verify Event  │    │   Participants  │
│ • Full Access   │    │ • Database Auth │    │ • Real-time     │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      Guest      │    │   Validation    │    │   Consumption   │
│                 │    │                 │    │                 │
│ • Create Story  │───►│ • Check Role    │───►│ • View Content  │
│ • Receive Snaps │    │ • Limited Perms │    │ • Real-time     │
│ • Read Access   │    │ • Event Scoped  │    │ • Feed Updates  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Architecture

### Screen-Level Components (EventSnap Themed)

```
screens/
├── auth/
│   ├── LoginScreen.tsx           # EventSnap login with Creative Light Theme
│   ├── RegisterScreen.tsx        # EventSnap registration with purple accents
│   └── AuthLoadingScreen.tsx     # EventSnap branding with purple spinner
├── main/
│   ├── CameraScreen.tsx          # Photo capture with light theme UI
│   ├── HomeScreen.tsx            # Event feed with purple story rings
│   ├── EventFeedScreen.tsx       # Unified event content feed (NEW - PHASE 5.0)
│   ├── ChatListScreen.tsx        # Chat conversations (legacy)
│   ├── ChatScreen.tsx            # Individual chat (legacy)
│   ├── SnapViewerScreen.tsx      # Full-screen snap viewing
│   ├── RecipientSelectionScreen.tsx # Snap recipient selection
│   ├── ProfileScreen.tsx         # User profile management
│   └── StoryViewerScreen.tsx     # Story viewing interface
└── organizer/
    └── EventSetupScreen.tsx      # Event creation with asset upload
```

### Reusable Components (Creative Light Theme)

```
components/
├── ui/
│   ├── Button.tsx                # Purple primary, white secondary, rose danger
│   ├── Input.tsx                 # White backgrounds, purple focus states
│   ├── LoadingSpinner.tsx        # Purple spinners throughout
│   ├── Modal.tsx                 # Clean white modals with shadows
│   ├── ThemeProvider.tsx         # React Context theme system
│   └── ErrorBoundary.tsx         # Error handling with theme support
├── media/
│   ├── ImageViewer.tsx           # Full-screen image display
│   ├── ImageEditor.tsx           # Image editing interface
│   ├── CameraControls.tsx        # Camera interface controls
│   └── UploadProgress.tsx        # Asset upload progress UI
└── social/
    ├── StoryRing.tsx             # Purple/pink story rings (REFACTORED)
    ├── SnapPreview.tsx           # Snap thumbnail
    └── UserAvatar.tsx            # User profile image
```

## State Management Patterns

### Zustand Store Structure (Event-Centric)

```typescript
interface AppState {
  // Authentication (EventSnap)
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;

  // Events (PRIMARY ARCHITECTURE)
  currentEvent: Event | null;
  userRole: 'host' | 'guest' | null;
  eventParticipants: User[];
  eventLoading: boolean;
  eventError: string | null;

  // Theme System
  theme: ThemeTokens;
  isDarkMode: boolean; // Currently false for Creative Light Theme

  // Stories (EVENT-SCOPED - ENHANCED PHASE 5.0)
  stories: Story[];
  eventStories: { [eventId: string]: Story[] }; // NEW: Event-scoped stories
  storyOwners: { [userId: string]: User };
  postingStory: boolean;
  storyError: string | null;

  // Snaps (EVENT-SCOPED - ENHANCED PHASE 5.0)
  receivedSnaps: Snap[];
  eventSnaps: { [eventId: string]: Snap[] }; // NEW: Event-scoped snaps
  sentSnaps: Snap[];
  sendingSnap: boolean;

  // Chat (LEGACY - TO BE DEPRECATED)
  conversations: Conversation[];
  messages: { [chatId: string]: Message[] };
  activeChat: string | null;

  // UI State
  currentScreen: string;
  cameraPermission: boolean;
}
```

### Hook Patterns (EventSnap Enhanced)

- **useAuth**: Authentication state and methods with EventSnap branding
- **useCamera**: Camera permissions and capture logic with theme integration
- **useFirestore**: Firestore CRUD operations with event scoping
- **useImageUpload**: File upload with progress tracking and theme UI
- **useTheme**: Theme system access
- **useThemeColors**: Color token access
- **useThemeSpacing**: Spacing system access

## Event-Scoped Content Patterns (NEW - PHASE 5.0)

### Database Query Patterns

#### Event-Scoped Story Queries

```typescript
// Service-level event filtering
class FirestoreService {
  // Enhanced story creation with event scoping
  async createStory(storyData: Partial<Story>, eventId?: string): Promise<string> {
    const story = {
      ...storyData,
      eventId: eventId || null, // Optional event scoping
      createdAt: new Date(),
      expiresAt: eventId 
        ? getEventExpirationTime(eventId) // Event-based expiration
        : new Date(Date.now() + 24 * 60 * 60 * 1000) // Standard 24h
    };
    
    return await this.db.collection('stories').add(story);
  }

  // Database-level event filtering
  async getActiveStoriesForEvent(eventId: string): Promise<Story[]> {
    const snapshot = await this.db
      .collection('stories')
      .where('eventId', '==', eventId)
      .where('expiresAt', '>', new Date())
      .orderBy('expiresAt')
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
  }

  // Real-time event story subscriptions
  subscribeToStoriesForEvent(eventId: string, callback: (stories: Story[]) => void): () => void {
    return this.db
      .collection('stories')
      .where('eventId', '==', eventId)
      .where('expiresAt', '>', new Date())
      .orderBy('expiresAt')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const stories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
        callback(stories);
      });
  }
}
```

#### Role-Based Snap Creation Pattern

```typescript
// Host-only event snap broadcasting
async createEventSnap(snapData: Partial<Snap>, eventId: string): Promise<void> {
  // 1. Validate sender is event host
  const event = await this.getEvent(eventId);
  if (!event || event.hostId !== snapData.senderId) {
    throw new Error('Only event hosts can send event snaps');
  }

  // 2. Get all event participants
  const participants = await this.getEventParticipants(eventId);
  
  // 3. Create batch writes for all participants
  const batch = this.db.batch();
  
  participants.forEach(participant => {
    const snapRef = this.db.collection('snaps').doc();
    batch.set(snapRef, {
      ...snapData,
      eventId,
      recipientId: participant.id,
      createdAt: new Date(),
      expiresAt: getEventExpirationTime(eventId)
    });
  });

  // 4. Execute batch write
  await batch.commit();
}
```

### Store Integration Patterns

#### Event-Scoped Store Methods

```typescript
// StoryStore with event scoping
interface StoryStore {
  // Enhanced methods with event support
  postStory: (content: string, imageUrl: string, eventId?: string) => Promise<void>;
  loadStoriesForEvent: (eventId: string) => Promise<void>;
  subscribeToStoriesForEvent: (eventId: string) => () => void;
  
  // Event-scoped state
  eventStories: { [eventId: string]: Story[] };
  currentEventStories: Story[]; // Computed from currentEvent
}

// SnapStore with role-based permissions
interface SnapStore {
  // Host-only event snap sending
  sendEventSnap: (imageUrl: string, eventId: string, text?: string) => Promise<void>;
  loadReceivedSnapsForEvent: (eventId: string) => Promise<void>;
  subscribeToReceivedSnapsForEvent: (eventId: string) => () => void;
  
  // Event-scoped state
  eventSnaps: { [eventId: string]: Snap[] };
  currentEventSnaps: Snap[]; // Computed from currentEvent
}
```

## Theme System Architecture (IMPLEMENTED PHASE 4.0)

### ThemeProvider Pattern

```typescript
// Theme Context Architecture
interface ThemeContextType {
  colors: ColorTokens;
  spacing: SpacingTokens;
  fonts: FontTokens;
  shadows: ShadowTokens;
  createThemeStyles: (styles: any) => any;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useMemo(() => ({
    colors: colorTokens,
    spacing: spacingTokens,
    fonts: fontTokens,
    shadows: shadowTokens,
    createThemeStyles: (styles) => ({ ...styles, theme: colorTokens })
  }), []);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Component Theme Integration Pattern

```typescript
// Modern EventSnap component with theme and event scoping
const EventFeedScreen: React.FC = () => {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const { currentEvent, userRole } = useEventStore();
  
  // Event-scoped content loading
  const { stories, snaps, loading } = useEventContent(currentEvent?.id);
  
  // Role-aware UI rendering
  const renderHostMessage = () => (
    <Text className="text-text-secondary text-center px-lg">
      As the event host, your content will be visible to all participants
    </Text>
  );
  
  const renderGuestMessage = () => (
    <Text className="text-text-secondary text-center px-lg">
      Welcome to the event! View stories and snaps from other participants
    </Text>
  );

  return (
    <View className="flex-1 bg-bg-primary">
      {/* Event-scoped stories */}
      <ScrollView horizontal className="py-md">
        {stories.map(story => (
          <StoryRing key={story.id} story={story} />
        ))}
      </ScrollView>
      
      {/* Role-aware messaging */}
      {userRole === 'host' ? renderHostMessage() : renderGuestMessage()}
      
      {/* Event-scoped snaps */}
      <FlatList
        data={snaps}
        renderItem={({ item }) => <SnapItem snap={item} />}
        className="flex-1"
      />
    </View>
  );
};
```

## Performance Optimization Patterns

### Database Index Strategy (EVENT-SCOPED)

```javascript
// Firestore composite indexes for event-scoped queries
// stories collection
{
  "collectionGroup": "stories",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "eventId", "order": "ASCENDING" },
    { "fieldPath": "expiresAt", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}

// snaps collection  
{
  "collectionGroup": "snaps",
  "queryScope": "COLLECTION", 
  "fields": [
    { "fieldPath": "eventId", "order": "ASCENDING" },
    { "fieldPath": "recipientId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### Real-time Subscription Management

```typescript
// Efficient subscription lifecycle management
class EventContentManager {
  private subscriptions: Map<string, () => void> = new Map();
  
  subscribeToEventContent(eventId: string) {
    // Cleanup existing subscriptions
    this.cleanup();
    
    // Story subscription
    const storyUnsub = firestoreService.subscribeToStoriesForEvent(
      eventId, 
      (stories) => storyStore.setEventStories(eventId, stories)
    );
    
    // Snap subscription  
    const snapUnsub = firestoreService.subscribeToReceivedSnapsForEvent(
      eventId,
      (snaps) => snapStore.setEventSnaps(eventId, snaps)
    );
    
    // Store cleanup functions
    this.subscriptions.set('stories', storyUnsub);
    this.subscriptions.set('snaps', snapUnsub);
  }
  
  cleanup() {
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions.clear();
  }
}
```

## Security Patterns (EVENT-SCOPED)

### Role-Based Access Control

```javascript
// Enhanced Firestore security rules with event scoping
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Event-scoped stories
    match /stories/{storyId} {
      allow read: if isEventParticipant(resource.data.eventId);
      allow create: if isEventParticipant(request.resource.data.eventId) 
                    && request.auth.uid == request.resource.data.userId;
    }
    
    // Event-scoped snaps with role validation
    match /snaps/{snapId} {
      allow read: if request.auth.uid == resource.data.recipientId;
      allow create: if isEventHost(request.resource.data.eventId) 
                    && request.auth.uid == request.resource.data.senderId;
    }
    
    // Helper functions
    function isEventParticipant(eventId) {
      return exists(/databases/$(database)/documents/events/$(eventId)/participants/$(request.auth.uid));
    }
    
    function isEventHost(eventId) {
      return get(/databases/$(database)/documents/events/$(eventId)).data.hostId == request.auth.uid;
    }
  }
}
```

This comprehensive system architecture now supports:

1. **Event-Scoped Content**: All stories and snaps properly filtered by event
2. **Role-Based Permissions**: Host vs Guest capabilities enforced at service level
3. **Real-time Updates**: Live content feeds scoped to event participants
4. **Performance Optimization**: Database-level filtering with proper indexing
5. **Professional Theme**: Creative Light Theme integrated throughout
6. **Security**: Comprehensive access control with event-based permissions

**Status**: Event content system architecture complete and operational.
