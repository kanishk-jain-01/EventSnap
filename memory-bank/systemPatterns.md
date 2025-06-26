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
6. Content creation → Event-scoped stories/snaps with purple/pink theme
7. Event end → Manual or automatic (24h) cleanup
8. Comprehensive cleanup → All content + vectors deleted

#### Theme System Flow (NEW - IMPLEMENTED TODAY)

1. App initialization → ThemeProvider wraps entire app
2. Component render → useThemeColors() hook accesses tokens
3. Dynamic styling → Theme tokens applied via className
4. State changes → Memoized context prevents unnecessary re-renders
5. Consistent branding → EventSnap identity throughout

#### Content Creation Flow (EVENT-SCOPED + THEMED)

1. Camera capture → Local image with Creative Light Theme UI
2. Image compression → Context-aware optimization
3. Event validation → Ensure user is participant with role check
4. Firebase Storage upload → Event-scoped URL returned
5. Firestore document creation → Metadata stored with eventId
6. Real-time listener → Event participants notification with purple theme

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
│   ├── ThemeProvider.tsx         # React Context theme system (NEW)
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

  // Theme System (NEW)
  theme: ThemeTokens;
  isDarkMode: boolean; // Currently false for Creative Light Theme

  // Stories (EVENT-SCOPED)
  stories: Story[];
  storyOwners: { [userId: string]: User };
  postingStory: boolean;
  storyError: string | null;

  // Snaps (EVENT-SCOPED)
  receivedSnaps: Snap[];
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
- **useTheme**: Theme system access (NEW)
- **useThemeColors**: Color token access (NEW)
- **useThemeSpacing**: Spacing system access (NEW)

## Theme System Architecture (NEW - IMPLEMENTED TODAY)

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
// Modern EventSnap component with theme
const EventSnapComponent: React.FC<Props> = ({ variant = 'primary', ...props }) => {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();

  const variantClasses = {
    primary: 'bg-primary text-white',
    secondary: 'bg-bg-elevated text-text-primary border border-primary',
    danger: 'bg-error text-white'
  };

  return (
    <TouchableOpacity 
      className={`${variantClasses[variant]} px-md py-sm rounded-lg shadow-md`}
      style={{ shadowColor: colors.primary[500] }}
      {...props}
    />
  );
};
```

## Firebase Integration Patterns

### Service Layer Architecture (Event-Centric)

```
services/
├── auth.service.ts               # Authentication operations
├── firestore.service.ts          # Database CRUD + Event operations
├── storage.service.ts            # File upload/download + Event assets
├── ai/
│   ├── ingestion.service.ts      # Cloud Function triggers for embeddings
│   ├── cleanup.service.ts        # Event cleanup Cloud Function calls
│   └── assistant.service.ts      # AI assistant integration (Phase 3.0)
├── realtime/
│   ├── index.ts                  # Main realtime service facade (legacy)
│   ├── messaging.service.ts      # Enhanced messaging operations (legacy)
│   ├── models.ts                 # TypeScript interfaces and types
│   └── database-schema.md        # Database structure documentation
└── cleanup/
    ├── snapCleanup.service.ts    # Legacy expired content removal
    └── storyCleanup.service.ts   # Legacy story cleanup
```

### Data Models and Relationships (Event-Driven)

```
Events Collection (PRIMARY ARCHITECTURE)
├── eventId (document ID)
├── name, description, location
├── hostId → Users.uid
├── visibility (public/private)
├── joinCode (for private events)
├── startTime, endTime
├── createdAt, updatedAt
├── assets[] (uploaded PDFs/images)
└── participants/ (subcollection)
    └── {userId}/
        ├── role (host/guest)
        ├── joinedAt
        └── permissions

Users Collection (EventSnap)
├── uid (document ID)
├── email, displayName, avatarUrl
├── createdAt, lastSeen
└── profile (EventSnap-specific fields)

Stories Collection (EVENT-SCOPED)
├── storyId (document ID)
├── eventId (REQUIRED - event scoping)
├── creatorId → Users.uid
├── imageUrl → Firebase Storage
├── createdAt, expiresAt (24h)
├── viewedBy[] (user IDs)
└── metadata (device, location, etc.)

Snaps Collection (EVENT-SCOPED)
├── snapId (document ID)
├── eventId (REQUIRED - event scoping)
├── senderId → Users.uid
├── recipientId → Users.uid
├── imageUrl → Firebase Storage
├── sentAt, viewedAt, expiresAt
└── metadata (viewing duration, etc.)
```

## AI Integration Patterns (Phase 2.0 Complete)

### Cloud Functions Architecture

```typescript
// PDF Ingestion Pattern
export const ingestPDFEmbeddings = functions.storage.object().onFinalize(async (object) => {
  // Event-scoped processing
  const eventId = extractEventIdFromPath(object.name);
  if (!eventId) return;

  // PDF text extraction
  const text = await extractPDFText(object);

  // OpenAI embeddings generation
  const embeddings = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });

  // Pinecone storage with event metadata
  await pinecone.index(INDEX_NAME).upsert([{
    id: `${eventId}-${object.name}`,
    values: embeddings.data[0].embedding,
    metadata: { eventId, type: 'pdf', content: text, filename: object.name }
  }]);
});

// Cleanup Pattern
export const deleteExpiredContent = functions.https.onCall(async (data, context) => {
  const { eventId } = data;
  
  // Host permission validation
  await validateHostPermission(context.auth?.uid, eventId);
  
  // Comprehensive cleanup across all services
  const results = await Promise.allSettled([
    cleanupFirestore(eventId),
    cleanupStorage(eventId),
    cleanupPinecone(eventId)
  ]);
  
  return { success: true, results };
});
```

### Event-Scoped Security Pattern

```javascript
// Firestore Security Rules (Event-Centric)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Event access control
    function isEventParticipant(eventId) {
      return exists(/databases/$(database)/documents/events/$(eventId)/participants/$(request.auth.uid));
    }
    
    function isEventHost(eventId) {
      return get(/databases/$(database)/documents/events/$(eventId)/participants/$(request.auth.uid)).data.role == 'host';
    }
    
    // Event-scoped content
    match /stories/{storyId} {
      allow read: if isEventParticipant(resource.data.eventId);
      allow create: if isEventParticipant(resource.data.eventId);
      allow update: if resource.data.creatorId == request.auth.uid;
    }
    
    match /snaps/{snapId} {
      allow read: if resource.data.recipientId == request.auth.uid || 
                     resource.data.senderId == request.auth.uid;
      allow create: if isEventParticipant(resource.data.eventId) && 
                       request.auth.uid == resource.data.senderId;
    }
  }
}
```

## Navigation Patterns (EventSnap Themed)

### Navigation Architecture

```typescript
// App-Level Navigation (EventSnap)
const AppNavigator = () => {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <ThemeProvider>
      <NavigationContainer>
        {isAuthenticated ? (
          <MainNavigator />
        ) : (
          <AuthNavigator />
        )}
      </NavigationContainer>
    </ThemeProvider>
  );
};

// Main Navigation (Event-Aware)
const MainNavigator = () => {
  const { currentEvent, userRole } = useEventStore();
  
  if (!currentEvent) {
    return <EventSelectionNavigator />;
  }
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#ffffff' }, // Light theme
        tabBarActiveTintColor: '#7c3aed', // Purple active
        tabBarInactiveTintColor: '#94a3b8' // Light gray inactive
      }}
    >
      <Tab.Screen name="Feed" component={EventFeedScreen} />
      <Tab.Screen name="Camera" component={CameraScreen} />
      {userRole === 'host' && (
        <Tab.Screen name="Manage" component={EventManageScreen} />
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
```

## Performance Optimization Patterns

### Theme System Performance

```typescript
// Memoized theme context to prevent unnecessary re-renders
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useMemo(() => createTheme(), []);
  
  // Memoized color access to prevent object recreation
  const colors = useMemo(() => theme.colors, [theme.colors]);
  const spacing = useMemo(() => theme.spacing, [theme.spacing]);
  
  return (
    <ThemeContext.Provider value={{ ...theme, colors, spacing }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Component-level memoization
const EventSnapButton = React.memo<ButtonProps>(({ variant, children, ...props }) => {
  const colors = useThemeColors();
  
  const styles = useMemo(() => ({
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[600]
  }), [colors.primary]);
  
  return (
    <TouchableOpacity style={styles} {...props}>
      {children}
    </TouchableOpacity>
  );
});
```

### Event-Scoped Query Optimization

```typescript
// Efficient event-scoped queries
const useEventStories = (eventId: string) => {
  return useFirestore(
    ['stories', eventId],
    () => firestoreService.getActiveStories(eventId),
    {
      enabled: !!eventId,
      staleTime: 30000, // 30 seconds
      refetchInterval: 60000 // 1 minute
    }
  );
};

// Batch operations for performance
const batchUpdateStoryViews = async (storyIds: string[], userId: string) => {
  const batch = firestore.batch();
  
  storyIds.forEach(storyId => {
    const storyRef = firestore.collection('stories').doc(storyId);
    batch.update(storyRef, {
      viewedBy: firestore.FieldValue.arrayUnion(userId)
    });
  });
  
  await batch.commit();
};
```

## EventSnap Platform Status (2025-01-03)

### ✅ **Phase 4.0 Complete - Creative Light Theme System**

#### **Theme Architecture Implemented**
- **React Context Pattern**: Comprehensive theme provider with memoization
- **Token System**: Purple/pink color scheme with semantic variants
- **Component Integration**: All UI components using theme hooks
- **Performance Optimized**: Memoized contexts prevent unnecessary re-renders
- **TypeScript Safe**: Full type definitions for theme tokens

#### **Brand Identity Transformation**
- **Visual Consistency**: EventSnap branding throughout navigation and components
- **Color Migration**: Complete transition from yellow to purple/pink system
- **Theme Application**: Light backgrounds with dark text for professional appeal
- **Component Variants**: Primary (purple), secondary (white), danger (rose) buttons

### ✅ **Phase 2.0 Complete - AI Infrastructure**

#### **Cloud Functions Deployed**
- **Asset Ingestion**: PDF and image processing with OpenAI embeddings
- **Vector Storage**: Pinecone integration for RAG queries
- **Cleanup System**: Comprehensive content lifecycle management
- **Event Scoping**: All AI operations respect event boundaries

### ✅ **Phase 1.0 Complete - Event Foundation**

#### **Event-Centric Architecture**
- **Role-Based Access**: Host/Guest permissions throughout
- **Content Scoping**: All stories/snaps tied to specific events
- **Security Rules**: Firestore rules enforce event participation
- **State Management**: EventStore with real-time updates

**Status**: EventSnap platform with Creative Light Theme complete. Ready for AI Assistant integration (Phase 3.0) to complete the Event-Driven Networking Platform vision.
