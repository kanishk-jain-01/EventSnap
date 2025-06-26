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
│ • AsyncStorage  │    │ • AsyncStorage  │    │                 │    │ • Persistence   │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow Patterns

#### Complete Event Onboarding Flow (NEW - PHASE 6.0 COMPLETE)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   App Launch    │    │  Auth & Event   │    │ Event Discovery │    │ Role-Based App  │
│                 │    │   Validation    │    │                 │    │                 │
│ • Auth Check    │───►│ • Load Cached   │───►│ • Public Events │───►│ • Host Features │
│ • AsyncStorage  │    │ • Validate Event│    │ • Join Codes    │    │ • Guest Features│
│ • Initialize    │    │ • Network Check │    │ • Persistence   │    │ • Navigation    │
│ • Event Store   │    │ • Auto-Rejoin   │    │ • State Update  │    │ • Role UI       │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

1. **App Launch**: Authentication check with AsyncStorage event store initialization
2. **Event Validation**: Comprehensive validation of cached events with expiration and participant checks
3. **Event Discovery**: Professional EventSelectionScreen with public/private event options
4. **Role Assignment**: Automatic host/guest determination with role-based navigation
5. **Persistent Sessions**: Smart auto-rejoin with validation and fallback handling
6. **Role-Based Experience**: Complete customization based on user permissions

#### AsyncStorage Persistence Pattern (NEW - PHASE 6.0)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Event Changes   │    │  Validation     │    │   Storage       │    │  Initialization │
│                 │    │                 │    │                 │    │                 │
│ • activeEvent   │───►│ • Expiration    │───►│ • AsyncStorage  │───►│ • App Launch    │
│ • role          │    │ • Existence     │    │ • Serialization │    │ • Event Store   │
│ • participants  │    │ • Participation │    │ • Keys          │    │ • Validation    │
│ • Auto-Save     │    │ • Network Error │    │ • Cleanup       │    │ • Auto-Rejoin   │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Role-Based Navigation Pattern (NEW - PHASE 6.0)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  User Role      │    │  Navigation     │    │  Screen Access  │    │  UI Features    │
│                 │    │                 │    │                 │    │                 │
│ • Host          │───►│ • "Host Profile"│───►│ • Event Mgmt    │───►│ • Crown Icons   │
│ • Guest         │    │ • "Camera"      │    │ • Full Access   │    │ • Manage Button │
│ • No Event      │    │ • "View Only"   │    │ • Limited       │    │ • Contact Lists │
│ • Permissions   │    │ • Tab Icons     │    │ • Read-Only     │    │ • Role Badges   │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

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

#### Authentication Flow with Event Integration (ENHANCED - PHASE 6.0)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  App Navigator  │    │  Auth Status    │    │  Event Status   │    │  Navigation     │
│                 │    │                 │    │                 │    │                 │
│ • Check Auth    │───►│ • Authenticated │───►│ • Has Event     │───►│ • MainNavigator │
│ • Initialize    │    │ • Unauthenticated│    │ • No Event      │    │ • EventSelection│
│ • Event Store   │    │ • Loading       │    │ • Expired       │    │ • AuthNavigator │
│ • Automatic     │    │ • Error         │    │ • Invalid       │    │ • Loading       │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Architecture

### Screen-Level Components (EventSnap Themed with Role-Based Features)

```
screens/
├── auth/
│   ├── LoginScreen.tsx           # EventSnap login with Creative Light Theme
│   ├── RegisterScreen.tsx        # EventSnap registration with purple accents
│   ├── AuthLoadingScreen.tsx     # EventSnap branding with purple spinner
│   └── EventSelectionScreen.tsx  # Professional event discovery with public/private options
├── main/
│   ├── CameraScreen.tsx          # Photo capture with text overlay and role-based UI gating
│   ├── EventFeedScreen.tsx       # Unified event content feed with role permissions banner
│   ├── ChatListScreen.tsx        # Chat conversations (legacy)
│   ├── ChatScreen.tsx            # Individual chat (legacy)
│   ├── SnapViewerScreen.tsx      # Full-screen snap viewing
│   ├── RecipientSelectionScreen.tsx # Snap recipient selection
│   ├── ProfileScreen.tsx         # Role-based user profile with event management features
│   └── StoryViewerScreen.tsx     # Story viewing interface
└── organizer/
    └── EventSetupScreen.tsx      # Event creation with asset upload and role-based access
```

### Navigation Components (Role-Aware)

```
navigation/
├── AppNavigator.tsx              # Root navigator with auth + event flow integration
├── AuthNavigator.tsx             # Authentication flow navigation
├── MainNavigator.tsx             # Main app navigation with event integration
├── MainTabNavigator.tsx          # Role-based tab navigation with host/guest customization
├── EventTabNavigator.tsx         # Event-scoped navigation with AI assistant placeholder
└── types.ts                      # Navigation types with RootStackParamList integration
```

## State Management Patterns

### Zustand Store Structure (Event-Centric with Persistence)

```typescript
interface AppState {
  // Authentication (EventSnap)
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;

  // Events (PRIMARY ARCHITECTURE - ENHANCED PHASE 6.0)
  activeEvent: Event | null;
  role: 'host' | 'guest' | null;
  eventParticipants: User[];
  publicEvents: AppEvent[]; // Public event discovery
  isInitialized: boolean; // AsyncStorage initialization state
  eventLoading: boolean;
  eventError: string | null;

  // AsyncStorage Persistence (NEW - PHASE 6.0)
  _saveActiveEventToStorage: () => Promise<void>;
  _loadActiveEventFromStorage: () => Promise<void>;
  initializeEventStore: () => Promise<void>;

  // Theme System
  theme: ThemeTokens;
  isDarkMode: boolean; // Currently false for Creative Light Theme

  // Stories (EVENT-SCOPED - ENHANCED PHASE 5.0)
  stories: Story[];
  eventStories: { [eventId: string]: Story[] };
  storyOwners: { [userId: string]: User };
  postingStory: boolean;
  storyError: string | null;

  // Snaps (EVENT-SCOPED - ENHANCED PHASE 5.0)
  receivedSnaps: Snap[];
  eventSnaps: { [eventId: string]: Snap[] };
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

### AsyncStorage Persistence Patterns (NEW - PHASE 6.0)

```typescript
// AsyncStorage integration patterns
interface AsyncStoragePatterns {
  eventPersistence: {
    keys: {
      activeEvent: 'eventsnap_active_event';
      userRole: 'eventsnap_user_role';
    };
    
    validation: {
      expiration: 'Check 24 hours after event end';
      existence: 'Verify event still exists in Firestore';
      participation: 'Confirm user is still a participant';
      network: 'Graceful offline handling with cached data';
    };
    
    initialization: {
      timing: 'When user is authenticated in AppNavigator';
      fallback: 'Clear invalid events with user notification';
      errorHandling: 'Comprehensive try-catch with logging';
    };
  };
  
  cleanup: {
    logout: 'Clear AsyncStorage when user logs out';
    expiration: 'Automatic removal of expired events';
    errors: 'Clear invalid events with user notification';
  };
}
```

### Role-Based UI Patterns (NEW - PHASE 6.0)

```typescript
// Role-based component patterns
interface RoleBasedUIPatterns {
  navigation: {
    tabCustomization: {
      host: {
        labels: '"Camera", "Host Profile"';
        icons: 'Crown (👑) for host identification';
        access: 'Full navigation and management features';
      };
      guest: {
        labels: '"View Only", "Profile"';
        icons: 'Standard icons for guest users';
        access: 'Limited navigation and read-only features';
      };
    };
  };
  
  profileScreen: {
    roleBadge: 'Visual "Event Host" or "Event Guest" indicator';
    eventCard: 'Event details with status and information';
    hostFeatures: '"Manage Event" button, full contact access';
    guestFeatures: 'Limited contacts (5), read-only features';
    conditionalFeatures: 'Find Friends only for hosts or non-event users';
  };
  
  permissions: {
    contentCreation: 'Host can create, guests consume';
    eventManagement: 'Host-only event setup and management';
    socialFeatures: 'Tiered access based on role';
  };
}
```

### Hook Patterns (EventSnap Enhanced with Persistence)

- **useAuth**: Authentication state and methods with EventSnap branding and event cleanup
- **useCamera**: Camera permissions and capture logic with theme integration
- **useFirestore**: Firestore CRUD operations with event scoping and participant validation
- **useImageUpload**: File upload with progress tracking and theme UI
- **useTheme**: Theme system access with Creative Light Theme tokens
- **useThemeColors**: Color token access for role-based styling
- **useEventStore**: Event state management with AsyncStorage persistence
- **useAsyncStorage**: Persistent storage utilities with validation

## Navigation Patterns (ENHANCED - PHASE 6.0 COMPLETE)

### AppNavigator Flow Control (NEW)

```typescript
// Complete navigation flow with auth + event integration
interface AppNavigationFlow {
  initialization: {
    authCheck: 'Firebase auth state monitoring';
    eventStoreInit: 'AsyncStorage event loading with validation';
    conditionalNavigation: 'Based on auth + event status';
  };
  
  flowLogic: {
    unauthenticated: 'AuthNavigator (Login/Register)';
    authenticatedNoEvent: 'EventSelectionScreen';
    authenticatedWithEvent: 'MainNavigator with role-based features';
    authLoading: 'AuthLoadingScreen with EventSnap branding';
  };
  
  stateManagement: {
    eventStore: 'Initialize when user authenticated';
    cleanup: 'Clear AsyncStorage on logout';
    validation: 'Comprehensive event and participant checks';
  };
}
```

### Role-Based Navigation Enhancement (NEW)

```typescript
// Role-aware navigation patterns
interface RoleBasedNavigation {
  mainTabNavigator: {
    hostExperience: {
      tabs: '"Feed", "Camera", "Host Profile"';
      icons: 'Crown (👑) for host identification';
      access: 'Full feature access and event management';
    };
    
    guestExperience: {
      tabs: '"Feed", "View Only", "Profile"';
      icons: 'Standard icons for guest users';
      access: 'Limited features and read-only access';
    };
  };
  
  screenAccess: {
    eventManagement: 'Host-only EventSetupScreen access';
    contentCreation: 'Role-based camera and content features';
    socialFeatures: 'Tiered contact and social access';
  };
}
```

### EventTabNavigator Implementation (ENHANCED - PHASE 5.0)

```typescript
// Modern event-scoped navigation
interface EventTabNavigator {
  structure: {
    feed: 'EventFeedScreen with role-based permissions banner';
    assistant: 'Placeholder for Phase 3.0 AI Assistant';
    profile: 'ProfileScreen with role-based features and event management';
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

  profileScreen: {
    roleBasedFeatures: {
      host: 'Event management, full contacts, "Manage Event" button';
      guest: 'Limited contacts (5), read-only features';
      noEvent: 'Standard profile with "Find Friends" access';
    };
  };
}
```

## Database Patterns

### Event Discovery Queries (NEW - PHASE 6.0)

```typescript
// Optimized event discovery patterns
interface EventDiscoveryPatterns {
  publicEvents: {
    query: "collection('events').where('visibility', '==', 'public').orderBy('startTime', 'asc').limit(20)";
    indexes: 'Compound index on (visibility, startTime)';
    performance: 'Configurable pagination with efficient filtering';
    caching: 'EventStore state management for client-side caching';
  };
  
  privateEvents: {
    query: "collection('events').where('joinCode', '==', code).where('visibility', '==', 'private').limit(1)";
    validation: 'Real-time join code verification';
    security: 'Database-level access control';
    uniqueness: 'Single event result for join code uniqueness';
  };
  
  participants: {
    collection: '/events/{eventId}/participants/{uid}';
    structure: '{ role: "host" | "guest", joinedAt: serverTimestamp() }';
    roleLogic: 'Host if uid === hostUid, else Guest';
    validation: 'Participant existence checks for event persistence';
  };
}
```

### Event-Scoped Story Queries (ENHANCED)

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

  // Participant validation for persistence (NEW - PHASE 6.0)
  async getParticipant(eventId: string, userId: string): Promise<any> {
    const doc = await this.db
      .collection('events')
      .doc(eventId)
      .collection('participants')
      .doc(userId)
      .get();
    
    return doc.exists ? doc.data() : null;
  }
}
```

## Theme System Patterns (ENHANCED - PHASE 4.0)

### Creative Light Theme Architecture

```typescript
// Complete theme system with EventSnap branding
interface ThemeSystemArchitecture {
  colors: {
    primary: 'Purple (#7C3AED) with light/dark variants';
    accent: 'Hot Pink (#EC4899) for interactive elements';
    semantic: 'Emerald (success), Amber (warning), Rose (error)';
    backgrounds: 'Clean whites (#FFFFFF, #F8FAFC, #FAFAFA)';
    text: 'Dark slate for optimal readability on light backgrounds';
  };

  roleBasedStyling: {
    host: 'Crown icons, purple accents, full access indicators';
    guest: 'Standard icons, limited access styling';
    badges: 'Role-specific color coding and visual indicators';
  };

  components: {
    navigation: 'Role-based tab labels and icons';
    profile: 'Event cards with status indicators';
    buttons: 'Host/guest appropriate styling and access';
  };
}
```

## Security Patterns

### Role-Based Access Control (ENHANCED)

```typescript
// Complete security pattern implementation
interface SecurityPatterns {
  firestore: {
    eventAccess: 'Participant-based read/write permissions';
    roleValidation: 'Host/guest role enforcement at database level';
    participantChecks: 'Sub-collection existence validation';
  };
  
  asyncStorage: {
    validation: 'Comprehensive event and participant validation';
    expiration: 'Time-based event expiration checks';
    networkHandling: 'Graceful offline fallback with cached data';
  };
  
  uiSecurity: {
    roleGating: 'UI-level role-based feature access';
    permissionsBanner: 'Clear role-appropriate messaging';
    conditionalFeatures: 'Host/guest feature differentiation';
  };
}
```

## Performance Patterns

### AsyncStorage Optimization (NEW - PHASE 6.0)

```typescript
// Efficient persistence patterns
interface AsyncStorageOptimization {
  initialization: {
    timing: 'Load only when user is authenticated';
    validation: 'Comprehensive checks before using cached data';
    fallback: 'Graceful handling of invalid or expired events';
  };
  
  caching: {
    strategy: 'Cache valid events with expiration checks';
    cleanup: 'Automatic removal of expired or invalid events';
    errorHandling: 'Network-aware validation with offline support';
  };
  
  performance: {
    serialization: 'Efficient JSON serialization for complex objects';
    validation: 'Batch validation checks for better performance';
    memoryManagement: 'Proper cleanup on logout and errors';
  };
}
```

### Database Query Optimization

```typescript
// Optimized query patterns for event discovery
interface DatabaseOptimization {
  compoundIndexes: {
    publicEvents: 'Index on (visibility, startTime) for efficient discovery';
    eventContent: 'Index on (eventId, createdAt) for content queries';
    participants: 'Index on (eventId, role) for role-based queries';
  };
  
  pagination: {
    eventDiscovery: 'Configurable limits for public event listing';
    contentFeeds: 'Efficient pagination for stories and snaps';
    participantLists: 'Optimized participant loading';
  };
  
  caching: {
    clientSide: 'Zustand store caching for frequently accessed data';
    persistence: 'AsyncStorage for critical user state';
    invalidation: 'Smart cache invalidation on data changes';
  };
}
```

## Quality Assurance Patterns

### Code Quality Standards (MAINTAINED)

```typescript
// Comprehensive quality assurance
interface QualityStandards {
  typescript: {
    strictMode: 'Enabled with zero compilation errors';
    typeDefinitions: 'Complete type coverage for all components';
    interfaces: 'Comprehensive interfaces for all data structures';
  };
  
  linting: {
    eslint: 'Zero errors policy with professional configuration';
    warnings: 'Only pre-existing console warnings from earlier phases';
    formatting: 'Prettier with consistent code formatting';
  };
  
  testing: {
    manual: 'Comprehensive manual verification for all features';
    integration: 'End-to-end testing of complete user flows';
    performance: 'Manual performance validation on target devices';
  };
}
```

**Status**: EventSnap now has a complete, professional system architecture with seamless event onboarding, role-based experiences, smart persistence, and comprehensive quality assurance. The platform is ready for advanced features like AI Assistant integration or enhanced content management systems.
