# Technical Context: EventSnap - Event-Driven Networking Platform

## Tech Stack Overview

### Frontend

- **Framework**: React Native with Expo
- **Build Tool**: Expo CLI
- **Styling**: TailwindCSS with NativeWind for React Native support
- **Theme System**: React Context-based Creative Light Theme with comprehensive token architecture
- **State Management**: Zustand for global state
- **Navigation**: React Navigation (native stack + tab navigation)
- **Media Handling**: Expo Camera and ImagePicker APIs

### Backend (Firebase Services + AI Infrastructure)

- **Authentication**: Firebase Auth (Email/Password)
- **Database**:
  - Firestore (structured data: events, users, stories, snap metadata)
  - Realtime Database (real-time chat messages - legacy)
- **Storage**: Firebase Storage (event assets, images)
- **Cloud Functions**: Node.js functions for AI processing and cleanup
- **AI Integration**: OpenAI API + Pinecone vector database for RAG
- **Hosting**: Firebase Hosting (if web version needed)

## Development Environment

### Prerequisites

- Node.js 20+ (required for Firebase Functions)
- Expo CLI installed globally
- Firebase CLI for backend management
- iOS Simulator (Mac) or Android Emulator
- Firebase project configured with all services

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Core UI components (Button, Input, Modal, etc.)
│   ├── social/         # Social components (StoryRing, etc.)
│   └── media/          # Media components (ImageEditor, etc.)
├── screens/
│   ├── auth/           # Authentication screens (EventSnap branding)
│   ├── main/           # Main app screens
│   └── organizer/      # Event management screens
├── navigation/         # Navigation configuration
├── hooks/              # Custom React hooks
├── services/           # Firebase service modules + AI services
├── store/              # Zustand store configuration
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Theme System Architecture (NEW - IMPLEMENTED TODAY)

### Creative Light Theme Implementation

```typescript
// Comprehensive theme token system
interface ThemeTokens {
  colors: {
    primary: {
      50: '#f3f4f6',    // Light purple backgrounds
      500: '#7c3aed',   // Main purple
      600: '#6d28d9',   // Hover purple
      700: '#5b21b6'    // Active purple
    },
    accent: {
      50: '#fdf2f8',    // Light pink backgrounds
      500: '#ec4899',   // Main hot pink
      600: '#db2777',   // Hover pink
      700: '#be185d'    // Active pink
    },
    semantic: {
      success: '#10b981',  // Emerald
      warning: '#f59e0b',  // Amber
      error: '#ef4444'     // Rose
    },
    backgrounds: {
      primary: '#fafafa',    // Main light background
      secondary: '#f8fafc',  // Secondary light background
      elevated: '#ffffff'    // Card/modal backgrounds
    },
    text: {
      primary: '#1e293b',    // Dark text on light backgrounds
      secondary: '#64748b',  // Medium gray text
      tertiary: '#94a3b8'    // Light gray text
    }
  },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  fonts: { 
    primary: 'System font stack',
    secondary: 'Monospace font stack'
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)'
  }
}
```

### Theme Provider Architecture

```typescript
// React Context-based theme system
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useMemo(() => createTheme(), []);
  
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hooks for theme access
export const useTheme = () => useContext(ThemeContext);
export const useThemeColors = () => useTheme().colors;
export const useThemeSpacing = () => useTheme().spacing;
```

### Component Integration Pattern

```typescript
// Modern component with theme integration
const EventSnapButton: React.FC<ButtonProps> = ({ variant = 'primary', ...props }) => {
  const colors = useThemeColors();
  
  const variantStyles = {
    primary: 'bg-primary text-white',
    secondary: 'bg-bg-elevated text-text-primary border border-primary',
    danger: 'bg-error text-white'
  };
  
  return (
    <TouchableOpacity 
      className={`${variantStyles[variant]} px-md py-sm rounded-lg shadow-sm`}
      {...props}
    />
  );
};
```

## Firebase Configuration

### Required Services

1. **Authentication**: Email/Password provider enabled
2. **Firestore**: Database with event-centric security rules
3. **Realtime Database**: Legacy chat functionality (to be deprecated)
4. **Storage**: Event assets and image uploads with security rules
5. **Cloud Functions**: AI processing and cleanup functions
6. **Hosting**: Optional for web deployment

### Event-Driven Security Model

```javascript
// Firestore security rules (event-centric)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Events collection
    match /events/{eventId} {
      allow read: if isEventParticipant(eventId);
      allow write: if isEventHost(eventId);
      
      // Event participants
      match /participants/{userId} {
        allow read: if isEventParticipant(eventId);
        allow write: if isEventHost(eventId);
      }
    }
    
    // Event-scoped stories and snaps
    match /stories/{storyId} {
      allow read: if isEventParticipant(resource.data.eventId);
      allow create: if isEventHost(resource.data.eventId);
    }
  }
}
```

## AI Infrastructure (Phase 2.0 Complete)

### Cloud Functions Architecture

```typescript
// PDF Ingestion Function
export const ingestPDFEmbeddings = functions.storage.object().onFinalize(async (object) => {
  if (!object.name?.includes('/events/') || !object.name?.endsWith('.pdf')) return;
  
  // Extract text from PDF
  const text = await extractPDFText(object);
  
  // Generate embeddings
  const embeddings = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  
  // Store in Pinecone
  await pinecone.index(INDEX_NAME).upsert([{
    id: object.name,
    values: embeddings.data[0].embedding,
    metadata: { eventId, type: 'pdf', content: text }
  }]);
});

// Image Ingestion Function
export const ingestImageEmbeddings = functions.storage.object().onFinalize(async (object) => {
  if (!object.name?.includes('/events/') || !isImageFile(object.name)) return;
  
  // OCR with Google Vision
  const [result] = await vision.textDetection(object.name);
  const text = result.fullTextAnnotation?.text || '';
  
  // Generate embeddings and store
  // ... similar to PDF processing
});

// Cleanup Function
export const deleteExpiredContent = functions.https.onCall(async (data, context) => {
  const { eventId } = data;
  
  // Comprehensive cleanup: Firestore, Storage, Pinecone
  await Promise.all([
    cleanupFirestore(eventId),
    cleanupStorage(eventId),
    cleanupPinecone(eventId)
  ]);
});
```

### AI Service Integration

```typescript
// Client-side AI service
export class AIService {
  static async queryAssistant(query: string, eventId: string): Promise<string> {
    const response = await fetch('/api/assistant-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, eventId })
    });
    
    return response.text();
  }
}
```

## Development Workflow

1. **Local Development**: Expo development server with theme hot-reload
2. **Testing**: Physical device or simulator with manual verification
3. **Database**: Firebase Emulator Suite for local testing
4. **AI Testing**: Pinecone sandbox environment
5. **Deployment**: Firebase deploy for Cloud Functions, Expo build for app

## Performance Considerations

- **Theme System**: Memoized context to prevent unnecessary re-renders
- **Firebase**: Modular SDKs for optimal bundle size
- **Image Processing**: Compression before upload with context-aware optimization
- **Firestore**: Efficient queries with proper indexing and event-scoped filtering
- **AI Responses**: Streaming responses for better perceived performance
- **Cleanup**: Scheduled functions to prevent data accumulation

## Key Dependencies

```json
{
  "expo": "~53.0.12",
  "react-native": "0.79.4",
  "firebase": "^11.9.1",
  "zustand": "^5.0.5",
  "@react-navigation/native": "^7.1.14",
  "nativewind": "^4.1.23",
  "tailwindcss": "^3.4.17",
  "expo-camera": "^16.1.8",
  "expo-image-picker": "^16.1.4",
  "expo-document-picker": "~13.1.6"
}
```

### Cloud Functions Dependencies

```json
{
  "functions": {
    "dependencies": {
      "firebase-functions": "^4.9.0",
      "firebase-admin": "^12.0.0",
      "openai": "^4.0.0",
      "@pinecone-database/pinecone": "^6.1.1",
      "@google-cloud/vision": "^5.2.0",
      "pdf-parse": "^1.1.1"
    }
  }
}
```

## EventSnap Platform Complete Implementation (2025-01-03)

### ✅ **Phase 4.0 Complete - Creative Light Theme System**

#### **Theme Architecture Implemented**
- **ThemeProvider**: React Context with comprehensive token system
- **Custom Hooks**: `useTheme()`, `useThemeColors()`, `useThemeSpacing()`, `useThemeFonts()`
- **Component Integration**: All UI components refactored to use theme tokens
- **Global Styles**: Base CSS with light theme utilities and defaults
- **TypeScript Integration**: Full type safety with theme interfaces

#### **Brand Transformation Complete**
- **Visual Identity**: "Snapchat" → "EventSnap" across all touchpoints
- **Color System**: Yellow (#FFFC00) → Purple (#7C3AED) + Hot Pink (#EC4899)
- **Theme Style**: Dark → Light, professional and accessible
- **Component Consistency**: All UI elements follow Creative Light Theme

#### **Technical Excellence**
```json
{
  "codeQuality": {
    "typescript": "✅ All type errors resolved",
    "eslint": "✅ All linting errors fixed",
    "architecture": "✅ Scalable theme system",
    "performance": "✅ Optimized context with memoization",
    "accessibility": "✅ High contrast ratios",
    "maintainability": "✅ Token-based system"
  }
}
```

### ✅ **Phase 2.0 Complete - AI-Ready Infrastructure**

#### **Deployed Cloud Functions Architecture**
- **`ingestPDFEmbeddings`**: PDF processing with OpenAI embeddings + Pinecone storage
- **`ingestImageEmbeddings`**: Image processing with OCR + embeddings
- **`deleteExpiredContent`**: Manual/automatic event cleanup system
- **`cleanupExpiredEventsScheduled`**: Daily scheduled cleanup (2:00 AM UTC)

#### **Production Infrastructure**
- ✅ Cloud Functions deployed and operational
- ✅ Pinecone integration configured
- ✅ OpenAI API integration active
- ✅ Storage triggers for asset ingestion
- ✅ Scheduled cleanup running daily

### ✅ **Phase 1.0 Complete - Event Data Model**

#### **Event-Centric Architecture**
- Host/Guest role-based permissions
- Event-scoped content isolation
- Comprehensive Firestore security rules
- EventStore Zustand slice for state management

## Known Technical Challenges

- **Theme Consistency**: Ensuring all components use theme tokens correctly ✅ RESOLVED
- **Event Scoping**: Maintaining content isolation between events ✅ IMPLEMENTED
- **AI Response Speed**: Optimizing RAG query performance (Phase 3.0 pending)
- **Content Lifecycle**: Automatic cleanup coordination ✅ IMPLEMENTED
- **Cross-platform Consistency**: Theme rendering on iOS/Android ✅ VERIFIED

## Security Considerations

- **Event Permissions**: Host/Guest role enforcement via Firestore rules
- **Asset Security**: Event-scoped storage with proper access control
- **AI Context**: Query isolation to prevent cross-event information leakage
- **Cleanup Security**: Host-only manual deletion with permission validation
- **Theme Security**: No sensitive data exposed through theme system

## Next Phase Ready: AI Assistant Integration (Phase 3.0)

### **Backend Infrastructure Complete**
- ✅ Pinecone vector database operational
- ✅ Asset ingestion pipeline processing PDFs and images
- ✅ Cloud Functions architecture ready for RAG queries
- ✅ Event-scoped security model implemented

### **Frontend Theme System Ready**
- ✅ EventSnap branding throughout
- ✅ Creative Light Theme tokens available for AI UI components
- ✅ Component library ready for chat interfaces
- ✅ Navigation system ready for assistant integration

**Status**: EventSnap platform with Creative Light Theme complete and ready for AI Assistant integration to fulfill the core Event-Driven Networking Platform vision.
