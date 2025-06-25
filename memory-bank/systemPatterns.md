# System Patterns: Snapchat Clone MVP

## Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │    Firebase     │    │   File Storage  │
│   Frontend App  │◄──►│    Backend      │◄──►│   (Images)      │
│                 │    │                 │    │                 │
│ • Components    │    │ • Auth          │    │ • Snaps         │
│ • Navigation    │    │ • Firestore     │    │ • Stories       │
│ • State (Zustand│    │ • Realtime DB   │    │ • Avatars       │
│ • Hooks         │    │ • Storage       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow Patterns

#### Authentication Flow

1. User inputs credentials → Firebase Auth
2. Auth state change → Zustand store update
3. Navigation redirect based on auth status
4. Protected routes check auth state

#### Snap Sending Flow

1. Camera capture → Local image
2. Image compression → Optimized file
3. Firebase Storage upload → URL returned
4. Firestore document creation → Metadata stored
5. Real-time listener → Recipient notification

#### Story Posting Flow (NEW - IMPLEMENTED TODAY)

1. Camera capture/gallery selection → Local image processing
2. Image optimization → Context-aware compression
3. Firebase Storage upload → Public story URL
4. Firestore document creation → Story metadata with 24-hour expiration
5. Real-time listeners → Story feed updates
6. Background cleanup → Expired stories automatically removed

#### Story Feed Display Flow (NEW - IMPLEMENTED TODAY)

1. HomeScreen mount → Subscribe to active stories
2. Firestore query → Stories within 24-hour window
3. User data loading → Story owner information
4. Story ring computation → Visual status indicators
5. Real-time updates → Live story feed refresh

#### Real-time Messaging Flow

1. Message composition → Local validation
2. Optimistic UI update → Immediate display
3. Firebase Realtime DB write → Message persisted
4. Status update (sending → sent → delivered → read)
5. Real-time listeners → Recipient receives message
6. Typing indicators → Real-time status updates

## Component Architecture

### Screen-Level Components

```
screens/
├── auth/
│   ├── LoginScreen.tsx      # Email/password login
│   ├── RegisterScreen.tsx   # User registration
│   └── AuthLoadingScreen.tsx # Auth state check
└── main/
    ├── CameraScreen.tsx     # Photo capture + story posting (ENHANCED)
    ├── HomeScreen.tsx       # Story feed + snaps list (ENHANCED)
    ├── ChatListScreen.tsx   # Chat conversations
    ├── ChatScreen.tsx       # Individual chat
    ├── SnapViewerScreen.tsx # Full-screen snap viewing
    ├── RecipientSelectionScreen.tsx # Snap recipient selection
    └── ProfileScreen.tsx    # User profile management
```

### Reusable Components

```
components/
├── ui/
│   ├── Button.tsx           # Styled button component
│   ├── Input.tsx            # Form input with validation
│   ├── LoadingSpinner.tsx   # Loading states
│   ├── Modal.tsx            # Modal dialogs
│   └── ErrorBoundary.tsx    # Error handling
├── media/
│   ├── ImageViewer.tsx      # Full-screen image display
│   ├── ImageEditor.tsx      # Image editing interface
│   └── CameraControls.tsx   # Camera interface controls
└── social/
    ├── StoryRing.tsx        # Story avatar rings (NEW - IMPLEMENTED)
    ├── SnapPreview.tsx      # Snap thumbnail
    └── UserAvatar.tsx       # User profile image
```

## State Management Patterns

### Zustand Store Structure

```typescript
interface AppState {
  // Authentication
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;

  // Snaps
  receivedSnaps: Snap[];
  sentSnaps: Snap[];
  sendingSnap: boolean;

  // Stories (NEW - IMPLEMENTED)
  stories: Story[];
  storyOwners: { [userId: string]: User };
  postingStory: boolean;
  storyError: string | null;

  // Chat
  conversations: Conversation[];
  messages: { [chatId: string]: Message[] };
  activeChat: string | null;
  typingUsers: { [chatId: string]: string[] };
  userPresence: { [userId: string]: UserPresence };
  isConnected: boolean;

  // UI State
  currentScreen: string;
  cameraPermission: boolean;
}
```

### Hook Patterns

- **useAuth**: Authentication state and methods
- **useCamera**: Camera permissions and capture logic
- **useFirestore**: Firestore CRUD operations
- **useRealtimeChat**: Real-time message synchronization
- **useImageUpload**: File upload with progress tracking

## Firebase Integration Patterns

### Service Layer Architecture

```
services/
├── auth.service.ts          # Authentication operations
├── firestore.service.ts     # Database CRUD + Stories operations (ENHANCED)
├── storage.service.ts       # File upload/download
├── realtime/
│   ├── index.ts             # Main realtime service facade
│   ├── messaging.service.ts # Enhanced messaging operations
│   ├── models.ts            # TypeScript interfaces and types
│   └── database-schema.md   # Database structure documentation
└── cleanup/
    └── snapCleanup.service.ts # Expired content removal
```

### Data Models and Relationships

```
Users Collection
├── uid (document ID)
├── email, displayName, avatarUrl
└── createdAt

Snaps Collection
├── snapId (auto-generated)
├── senderId → Users.uid
├── receiverId → Users.uid
├── imageUrl, timestamp, viewed
└── expiresAt (24 hours)

Stories Collection (NEW - IMPLEMENTED)
├── storyId (auto-generated)
├── creator → Users.uid
├── imageUrl, createdAt
├── expiresAt (24 hours from creation)
└── viewedBy: string[] (user IDs who viewed)

Realtime Database
└── chats/
    ├── {chatId}/
    │   ├── messages/
    │   │   └── {messageId}
    │   └── typing/
    │       └── {userId}
    ├── userChats/
    │   └── {userId}/
    │       └── {chatId}
    └── userPresence/
        └── {userId}
```

### Stories Implementation Patterns (NEW - IMPLEMENTED TODAY)

#### Story Ring Visual Indicators

```typescript
// Color-coded status system
const getStoryRingColor = (story: Story, currentUserId: string) => {
  if (story.creator === currentUserId) return 'border-blue-500'; // Own story
  if (story.viewedBy.includes(currentUserId)) return 'border-gray-400'; // Viewed
  return 'border-yellow-400'; // Unviewed
};
```

#### Story Feed Integration

```typescript
// HomeScreen layout pattern
<FlatList
  data={snaps}
  ListHeaderComponent={
    <FlatList
      horizontal
      data={storyRingData}
      renderItem={({ item }) => <StoryRing {...item} />}
    />
  }
  renderItem={({ item }) => <SnapItem {...item} />}
  ListEmptyComponent={EmptyState}
/>
```

#### Story Posting Flow

```typescript
// CameraScreen story posting pattern
const handlePostStory = async (imageUri: string) => {
  setPostingStory(true);
  try {
    await storyStore.postStory(imageUri);
    navigation.navigate('MainTabs', { screen: 'Home' });
  } catch (error) {
    Alert.alert('Error', 'Failed to post story');
  } finally {
    setPostingStory(false);
  }
};
```

## Security Patterns

### Firestore Security Rules

```javascript
// Users can only read/write their own data
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// Snaps readable by sender and recipient only
match /snaps/{snapId} {
  allow read: if request.auth != null &&
    (request.auth.uid == resource.data.senderId ||
     request.auth.uid == resource.data.receiverId);
}

// Stories readable by all authenticated users (NEW)
match /stories/{storyId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.auth.uid == resource.data.creator;
  allow update: if request.auth != null; // For view tracking
}
```

### Storage Security Rules

```javascript
// Users can upload to their own folders
match /snaps/{userId}/{allPaths=**} {
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

## Performance Optimization Patterns

### Image Handling

- Compress images before upload (max 1MB)
- Generate thumbnails for story previews
- Lazy load images in chat and story feeds
- Cache downloaded images locally

### Database Optimization

- Use Firestore composite indexes for complex queries
- Implement pagination for chat messages
- Cache frequently accessed data in Zustand
- Use real-time listeners only when necessary

### Code Splitting

```typescript
// Lazy load screens for better performance
const CameraScreen = lazy(() => import('./screens/main/CameraScreen'));
const ChatScreen = lazy(() => import('./screens/main/ChatScreen'));
```

## Error Handling Patterns

### Global Error Boundary

```typescript
// Catch and handle React errors gracefully
<ErrorBoundary fallback={<ErrorScreen />}>
  <App />
</ErrorBoundary>
```

### Firebase Error Handling

```typescript
// Standardized error handling for Firebase operations
try {
  await firestoreService.createSnap(snapData);
} catch (error) {
  if (error.code === 'permission-denied') {
    showError('Access denied');
  } else if (error.code === 'network-error') {
    showError('Connection failed');
  }
}
```

## Testing Patterns

### Component Testing

- Unit tests for reusable components
- Integration tests for screen workflows
- Mock Firebase services for testing
- Snapshot testing for UI consistency

### Service Testing

- Mock Firebase SDK for service layer tests
- Test error handling scenarios
- Validate data transformation logic
- Test real-time listener behavior
