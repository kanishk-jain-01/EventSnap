# Technical Context: Development Environment & Stack

## Technology Stack

### Frontend Framework
- **React Native** with Expo SDK ~53.0
  - Cross-platform mobile development
  - Hot reloading and development tools
  - Native module access through Expo
  - TypeScript integration

### Language & Type Safety
- **TypeScript** ~5.8.3
  - Strict type checking enabled
  - Interface-driven development
  - Enhanced IDE support and refactoring

### Styling & UI
- **TailwindCSS** ^3.4.17 with **NativeWind** ^4.1.23
  - Utility-first CSS framework
  - Consistent design system
  - Responsive design capabilities
  - Dark theme support

### Navigation
- **React Navigation** v7
  - Stack navigation for screen transitions
  - Tab navigation for main app structure
  - Type-safe navigation with TypeScript
  - Authentication flow handling

### State Management
- **Zustand** ^5.0.5
  - Lightweight state management
  - TypeScript integration
  - Minimal boilerplate
  - Async action support

## Backend Services (Firebase)

### Core Firebase Services
- **Firebase Authentication** v11.9.1
  - Email/password authentication
  - Session management
  - User profile handling

- **Firestore Database**
  - NoSQL document database
  - Real-time synchronization
  - Offline support
  - Security rules for access control

- **Firebase Realtime Database**
  - Real-time messaging
  - Presence detection
  - Typing indicators
  - Connection state monitoring

- **Firebase Storage**
  - Image and media file storage
  - Progressive upload with progress tracking
  - Automatic file organization
  - CDN-backed delivery

- **Firebase Functions**
  - Server-side processing
  - Automated cleanup services
  - Background tasks
  - PDF and image embedding processing

### Firebase Configuration
```javascript
// firebase.config.js structure
{
  apiKey: string,
  authDomain: string,
  databaseURL: string,      // Realtime Database URL
  projectId: string,
  storageBucket: string,
  messagingSenderId: string,
  appId: string
}
```

## Development Tools & Dependencies

### Core Dependencies
```json
{
  "expo-camera": "^16.1.8",           // Camera functionality
  "expo-image-picker": "^16.1.4",     // Gallery selection
  "expo-image-manipulator": "^13.1.7", // Image processing
  "expo-media-library": "^17.1.7",    // Media access
  "react-native-gesture-handler": "^2.26.0", // Touch handling
  "react-native-reanimated": "3.17.4" // Animations
}
```

### Development Dependencies
```json
{
  "@typescript-eslint/eslint-plugin": "^8.35.0",
  "@typescript-eslint/parser": "^8.35.0",
  "eslint": "^9.29.0",
  "prettier": "^3.6.0"
}
```

## Project Structure

### Directory Organization
```
src/
├── components/
│   ├── common/           # Shared business components
│   ├── features/         # Feature-specific components
│   │   ├── auth/         # Authentication UI
│   │   ├── camera/       # Camera interface
│   │   ├── chat/         # Chat components
│   │   └── stories/      # Stories UI
│   ├── media/            # Media handling components
│   └── ui/               # Reusable UI primitives
├── hooks/                # Custom React hooks
├── navigation/           # Navigation configuration
├── screens/              # Screen components
│   ├── auth/             # Authentication screens
│   ├── main/             # Main app screens
│   └── organizer/        # Event management screens
├── services/             # Business logic services
│   ├── firebase/         # Firebase configuration
│   ├── realtime/         # Real-time messaging
│   ├── cleanup/          # Content cleanup services
│   └── ai/               # AI/ML services
├── store/                # Zustand state stores
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## Development Environment Setup

### Prerequisites
- Node.js 20+
- Expo CLI (`npm install -g @expo/cli`)
- Firebase CLI (`npm install -g firebase-tools`)
- iOS Simulator (macOS) or Android Emulator
- Firebase project with enabled services

### Environment Configuration
1. Firebase project setup with Authentication, Firestore, Realtime Database, Storage, and Functions
2. `firebase.config.js` file with project credentials
3. Firebase security rules deployment
4. Expo development build configuration

### Development Scripts
```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
  "type-check": "tsc --noEmit"
}
```

## Technical Constraints & Considerations

### Performance Constraints
- **Image Processing**: Automatic optimization to prevent memory issues
- **Real-time Listeners**: Proper cleanup to prevent memory leaks
- **State Management**: Selective persistence to minimize storage usage

### Platform Considerations
- **iOS/Android Compatibility**: Expo managed workflow ensures cross-platform consistency
- **Permission Handling**: Camera, media library, and notification permissions
- **Offline Support**: Basic functionality when network unavailable

### Security Constraints
- **Firebase Security Rules**: Server-side validation for all data access
- **Event-Scoped Access**: Users can only access content within their events
- **Content Expiration**: All ephemeral content has automatic deletion

### Scalability Considerations
- **Firebase Quotas**: Monitor usage of Firestore reads/writes and Storage
- **Function Execution**: Optimize Firebase Functions for cost and performance
- **Real-time Connections**: Manage concurrent connections efficiently

## Firebase Functions Architecture

### Function Structure
```
functions/
├── deleteExpiredContent/    # Cleanup expired snaps and stories
├── ingestImageEmbeddings/   # AI image processing
├── ingestPDFEmbeddings/     # PDF processing for events
└── lib/                     # Shared function utilities
```

### Deployment Configuration
- TypeScript compilation before deployment
- Environment variables for API keys and configuration
- Scheduled functions for automated cleanup
- HTTP functions for client-triggered operations

## Development Workflow

### Code Quality
- **ESLint**: Code linting with TypeScript rules
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Git Hooks**: Pre-commit validation (recommended)

### Testing Strategy
- **Type Safety**: TypeScript provides compile-time validation
- **Manual Testing**: Expo development builds for device testing
- **Firebase Emulator**: Local development and testing (recommended)

### Deployment Process
1. **Development**: Expo development server
2. **Staging**: Expo preview builds
3. **Production**: App store distribution via Expo EAS Build 