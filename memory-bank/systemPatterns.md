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

#### Event-Scoped Content Flow with Text Overlays (ENHANCED - PHASE 5.0 COMPLETE)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Action   │    │  Text Overlay   │    │  Database Query │    │   UI Update     │
│                 │    │                 │    │                 │    │                 │
│ • Capture Photo │───►│ • Add Text      │───►│ • Event Filter  │───►│ • Real-time     │
│ • Post Story    │    │ • 200 char max  │    │ • Role Check    │    │   Feed Update   │
│ • Send Snap     │    │ • Validation    │    │ • Batch Write   │    │ • Theme Applied │
│ • View Feed     │    │ • Preview       │    │ • Permission    │    │ • Role Banner   │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

1. **Content Creation**: User captures photo with optional text overlay (≤200 chars)
2. **Text Processing**: Real-time character validation and preview display
3. **Role Validation**: Service-level permission checking with UI gating (host/guest)
4. **Database Scoping**: Content automatically filtered by event with role enforcement
5. **Real-time Distribution**: Live updates to event participants only
6. **UI Feedback**: Role-based messaging and permissions banner
7. **Theme Integration**: EventSnap Creative Light Theme throughout

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

#### Role-Based Content Flow with UI Gating (ENHANCED - PHASE 5.0 COMPLETE)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      Host       │    │   UI Gating     │    │   Validation    │    │  Distribution   │
│                 │    │                 │    │                 │    │                 │
│ • Create Story  │───►│ • Enabled Btns  │───►│ • Check Role    │───►│ • All Event     │
│ • Send Snap     │    │ • Full Access   │    │ • Verify Event  │    │   Participants  │
│ • Text Overlay  │    │ • Host Banner   │    │ • Database Auth │    │ • Real-time     │
│ • Full Access   │    │ • Progress UI   │    │ • Service Level │    │ • Feed Updates  │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      Guest      │    │   UI Gating     │    │   Validation    │    │   Consumption   │
│                 │    │                 │    │                 │    │                 │
│ • Create Story  │───►│ • Disabled Snap │───►│ • Check Role    │───►│ • View Content  │
│ • Receive Snaps │    │ • "Host Only"   │    │ • Limited Perms │    │ • Real-time     │
│ • Text Overlay  │    │ • Guest Banner  │    │ • Event Scoped  │    │ • Feed Updates  │
│ • Read Access   │    │ • Clear Msgs    │    │ • Clear Errors  │    │ • Role Aware    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Navigation Flow with EventTabNavigator (NEW - PHASE 5.0 COMPLETE)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  MainTabNav     │    │  EventTabNav    │    │   Screen Flow   │
│                 │    │                 │    │                 │
│ • Feed (Event)  │───►│ • Feed Tab      │───►│ • EventFeed     │
│ • Camera        │    │ • Assistant     │    │ • AI Placeholder│
│ • Chat (Legacy) │    │ • Profile       │    │ • Profile       │
│ • Profile       │    │ • Theme Styled  │    │ • Role Banner   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Architecture

### Screen-Level Components (EventSnap Themed)

```
screens/
├── auth/
│   ├── LoginScreen.tsx           # EventSnap login with Creative Light Theme
│   ├── RegisterScreen.tsx        # EventSnap registration with purple accents
│   ├── AuthLoadingScreen.tsx     # EventSnap branding with purple spinner
│   └── EventSelectionScreen.tsx  # Professional event discovery and joining with EventSnap branding
├── main/
│   ├── CameraScreen.tsx          # Photo capture with text overlay and role-based UI gating
│   ├── EventFeedScreen.tsx       # Unified event content feed with role permissions banner
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

  // Events (PRIMARY ARCHITECTURE - ENHANCED PHASE 6.0)
  currentEvent: Event | null;
  userRole: 'host' | 'guest' | null;
  eventParticipants: User[];
  publicEvents: AppEvent[]; // NEW: Public event discovery
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

## Navigation Patterns (ENHANCED - PHASE 5.0)

### EventTabNavigator Implementation

```typescript
// Modern event-scoped navigation
interface EventTabNavigator {
  structure: {
    feed: 'EventFeedScreen with role-based permissions banner';
    assistant: 'Placeholder for Phase 3.0 AI Assistant';
    profile: 'ProfileScreen with EventSnap theme';
  };

  theme: {
    tabBarStyle: 'Creative Light Theme with purple accents';
    icons: 'Emoji-based icons with proper React Native Text components';
    activeStates: 'Purple focus states for active tabs';
  };

  integration: {
    typeSystem: 'EventTabParamList in navigation types';
    components: 'SafeAreaView, StatusBar, proper React Native architecture';
    placeholder: 'Professional AI Assistant coming soon screen';
  };
}
```

### Navigation Flow Enhancement

```typescript
// Navigation structure evolution
interface NavigationEvolution {
  legacy: {
    homeScreen: 'Removed - replaced with EventFeedScreen';
    mainTabs: 'Updated to use EventFeedScreen instead of HomeScreen';
    tabLabel: 'Changed from "Stories" to "Feed"';
  };

  modern: {
    eventTabs: 'New EventTabNavigator for event-scoped navigation';
    integration: 'Seamless theme consistency throughout';
    future: 'Ready for AI Assistant implementation in Phase 3.0';
  };
}
```

## Event-Scoped Content Patterns (ENHANCED - PHASE 5.0 COMPLETE)

### Text Overlay Patterns

```typescript
// Text overlay system implementation
interface TextOverlaySystem {
  modal: {
    characterLimit: 200;
    validation: 'Real-time character counting with visual feedback';
    keyboard: 'KeyboardAvoidingView for iOS/Android compatibility';
    integration: 'Seamless camera workflow integration';
  };

  display: {
    preview: 'Semi-transparent overlay on photo previews';
    positioning: 'Configurable text position (future enhancement)';
    styling: 'Clean, readable text with background overlay';
  };

  workflow: {
    capture: 'Photo capture → Optional text overlay → Story posting';
    editing: 'Add, edit, clear text functionality';
    validation: 'Character limit enforcement with clear feedback';
  };
}
```

### Role-Based UI Gating Patterns

```typescript
// Comprehensive role-based UI system
interface RoleBasedUIGating {
  cameraScreen: {
    host: {
      eventSnap: 'Enabled "Event Snap" button with progress tracking';
      functionality: 'Full event snap sending capabilities';
      feedback: 'Progress indicators and success/error states';
    };

    guest: {
      eventSnap: 'Disabled "Host Only" button with clear messaging';
      functionality: 'Receive-only for event snaps';
      feedback: 'Clear role restriction messaging';
    };

    nonEvent: {
      functionality: 'Regular snap functionality preserved';
      interface: 'Standard camera interface without role restrictions';
    };
  };

  eventFeed: {
    permissionsBanner: {
      host: 'Host-specific messaging about event management';
      guest: 'Guest-appropriate messaging about participation';
      styling: 'Consistent with Creative Light Theme';
    };
  };
}
```

### Database Query Patterns

#### Event-Scoped Story Queries

```typescript
// Service-level event filtering
class FirestoreService {
  // Enhanced story creation with event scoping
  async createStory(
    storyData: Partial<Story>,
    eventId?: string,
  ): Promise<string> {
    const story = {
      ...storyData,
      eventId: eventId || null, // Optional event scoping
      createdAt: new Date(),
      expiresAt: eventId
        ? getEventExpirationTime(eventId) // Event-based expiration
        : new Date(Date.now() + 24 * 60 * 60 * 1000), // Standard 24h
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

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Story);
  }

  // Real-time event story subscriptions
  subscribeToStoriesForEvent(
    eventId: string,
    callback: (stories: Story[]) => void,
  ): () => void {
    return this.db
      .collection('stories')
      .where('eventId', '==', eventId)
      .where('expiresAt', '>', new Date())
      .orderBy('expiresAt')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const stories = snapshot.docs.map(
          doc => ({ id: doc.id, ...doc.data() }) as Story,
        );
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
  postStory: (
    content: string,
    imageUrl: string,
    eventId?: string,
  ) => Promise<void>;
  loadStoriesForEvent: (eventId: string) => Promise<void>;
  subscribeToStoriesForEvent: (eventId: string) => () => void;

  // Event-scoped state
  eventStories: { [eventId: string]: Story[] };
  currentEventStories: Story[]; // Computed from currentEvent
}

// SnapStore with role-based permissions
interface SnapStore {
  // Host-only event snap sending
  sendEventSnap: (
    imageUrl: string,
    eventId: string,
    text?: string,
  ) => Promise<void>;
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
      stories => storyStore.setEventStories(eventId, stories),
    );

    // Snap subscription
    const snapUnsub = firestoreService.subscribeToReceivedSnapsForEvent(
      eventId,
      snaps => snapStore.setEventSnaps(eventId, snaps),
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

#### Event Discovery & Joining Flow (NEW - PHASE 6.0 ENHANCED)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Event Discovery │    │  Join Validation│    │  Database Query │    │   State Update  │
│                 │    │                 │    │                 │    │                 │
│ • Public Events │───►│ • Status Check  │───►│ • Event Filter  │───►│ • activeEvent   │
│ • Private Codes │    │ • Code Validate │    │ • Role Assign   │    │ • role Update   │
│ • Host Creation │    │ • Permission    │    │ • Participant   │    │ • Navigation    │
│ • Status Filter │    │ • Error Handle  │    │ • Sub-collection│    │ • Professional  │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

1. **Event Discovery**: User browses public events or enters private join code
2. **Status Validation**: Real-time validation with professional error messaging
3. **Database Operations**: Optimized queries with compound indexes for performance
4. **Role Assignment**: Automatic host/guest determination based on event ownership
5. **State Management**: EventStore updates with activeEvent and role information
6. **Navigation**: Seamless transition to main app with professional UX
7. **Participant Management**: Sub-collection updates with proper timestamps

#### Database Query Optimization Patterns (NEW - PHASE 6.0)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Public Events  │    │ Private Events  │    │  Participants   │
│                 │    │                 │    │                 │
│ • visibility    │───►│ • joinCode      │───►│ • role          │
│ • startTime     │    │ • visibility    │    │ • joinedAt      │
│ • limit(20)     │    │ • limit(1)      │    │ • serverTime    │
│ • compound idx  │    │ • validation    │    │ • merge: true   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Query Patterns:**
- **Public Events**: `where('visibility', '==', 'public').orderBy('startTime', 'asc').limit(20)`
- **Private Discovery**: `where('joinCode', '==', code).where('visibility', '==', 'private').limit(1)`
- **Participant Creation**: `doc('events/{eventId}/participants/{uid}').set({role, joinedAt})`
