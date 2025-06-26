# Technical Context: Snapchat Clone MVP

## Tech Stack Overview

### Frontend

- **Framework**: React Native with Expo
- **Build Tool**: Expo CLI
- **Styling**: TailwindCSS with NativeWind for React Native support
- **State Management**: Zustand for global state
- **Navigation**: React Navigation (native stack)
- **Media Handling**: Expo Camera and ImagePicker APIs

### Backend (Firebase Services)

- **Authentication**: Firebase Auth (Email/Password)
- **Database**:
  - Firestore (structured data: users, stories, snap metadata)
  - Realtime Database (real-time chat messages)
- **Storage**: Firebase Storage (snap and story images)
- **Hosting**: Firebase Hosting (if web version needed)

## Development Environment

### Prerequisites

- Node.js 20+ (required for Firebase Functions)
- Expo CLI installed globally
- Firebase CLI for backend management
- iOS Simulator (Mac) or Android Emulator
- Firebase project configured

### Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/
│   ├── auth/           # Authentication screens
│   └── main/           # Main app screens
├── navigation/         # Navigation configuration
├── hooks/              # Custom React hooks
├── services/           # Firebase service modules
├── store/              # Zustand store configuration
└── utils/              # Utility functions
```

## Firebase Configuration

### Required Services

1. **Authentication**: Email/Password provider enabled
2. **Firestore**: Database with security rules
3. **Realtime Database**: For chat functionality
4. **Storage**: For image uploads with security rules
5. **Hosting**: Optional for web deployment

### Security Considerations

- Implement proper Firestore security rules
- Configure Storage security rules for user-generated content
- Use Firebase Auth for all protected routes
- Validate all user inputs before database operations

## Development Workflow

1. **Local Development**: Expo development server
2. **Testing**: Physical device or simulator
3. **Database**: Firebase Emulator Suite for local testing
4. **Deployment**: Expo build service for app distribution

## Performance Considerations

- Use Firebase modular SDKs for optimal bundle size
- Implement image compression before upload
- Use efficient Firestore queries with proper indexing
- Cache frequently accessed data with Zustand
- Optimize React Native performance with proper memo usage

## Key Dependencies

```json
{
  "expo": "~49.0.0",
  "react-native": "0.72.x",
  "firebase": "^10.0.0",
  "zustand": "^4.0.0",
  "@react-navigation/native": "^6.0.0",
  "nativewind": "^2.0.0",
  "expo-camera": "~13.0.0",
  "expo-image-picker": "~14.0.0"
}
```

## Known Technical Challenges

- Camera permissions and cross-platform compatibility
- Real-time synchronization between Firestore and Realtime Database
- Image upload optimization and storage management
- Proper state management for offline scenarios
- TailwindCSS integration with React Native styling

## Pivot Tech Additions (2025-06-26)

### New Backend Components
- **Vector Database**: Supabase Vector or Pinecone for embedding storage.
- **Cloud Functions**:
  - `assistantChat` – RAG inference endpoint
  - `ingestPDFEmbeddings` – PDF → embeddings pipeline
  - `deleteExpiredContent` – scheduled cleanup 24 h post-event

### New Frontend Modules
- **AI Assistant Service**: Streams chat responses via SSE/WebSockets.
- **Event Store**: Holds active event, palette, role.
- **ThemeProvider**: Injects event colours into NativeWind.

### Dependencies
```json
{
  "@supabase/supabase-js": "^2.x" // if Supabase Vector chosen
}
```

### Security Considerations
- Event membership enforced via Firestore rules.
- Asset PDFs uploaded to Storage under `/events/{eventId}/assets/` bucket.

## Event Pivot Tech Additions (2025-06-27)

### New Frontend Modules
- `eventStore` Zustand slice for current event & role.
- Role-aware screens: `EventSelectionScreen`, `EventSetupScreen`, `EventFeedScreen`.
- `EventTabNavigator` replaces `MainTabNavigator`.

### Removed / Deprecated
- Realtime Database chat infrastructure and related screens/stores.
- Contacts/Friends Firestore sub-collection.
- Automated Jest/unit tests – **manual testing only**.

### Backend Changes
- Firestore `events` collection with `participants` sub-collection.
- Cloud Functions: `assistantChat`, `ingestPDFEmbeddings`, `deleteExpiredContent`.
- Pinecone (or Supabase Vector) for embedding storage.

### Security Rule Highlights
- Host write, Guest read-only enforced at collection level.
- Private event join requires `joinCode` match.
