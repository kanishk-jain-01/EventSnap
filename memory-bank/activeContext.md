# Active Context: Snapchat Clone MVP

## Current Project State

- **Phase**: Phase 8 User Management & Social Features – **IN PROGRESS** (5/8 tasks completed)
- **Status**: Core user-profile foundation implemented; avatar upload, profile editing, user search screens functional
- **Developer Level**: Beginner to mobile app development
- **Priority**: Implement Contacts/Friends management (Task 8.6)

## Immediate Focus

**Current Phase**: Phase 6 - Stories Feature Implementation

**Current Phase**: Phase 8 - User Management & Social Features Implementation

1. **Task 8.1**: ✅ Firestore user schema & search support
2. **Task 8.2**: ✅ Created Zustand `userStore` for profile & contacts
3. **Task 8.3**: ✅ Avatar upload flow & profile update action
4. **Task 8.4**: ✅ Built `ProfileScreen` with editing UI
5. **Task 8.5**: ✅ Implemented `UserSearchScreen` & `UserProfileScreen`
6. **Task 8.6**: ✅ Basic Contacts/Friends management (completed)
7. **Task 8.7**: ✅ Integrate contacts with Snaps, Stories & Chat
8. **Task 8.8**: ⏳ End-to-end QA & polish

## Today's Major Achievements

### 🚀 **MAJOR PROGRESS TODAY: Tasks 6.1-6.3 Completed**

#### ✅ **Task 6.1: Firestore Data Model for Stories - COMPLETED**

**Professional Stories Database System**:

- **Enhanced FirestoreService** (`src/services/firestore.service.ts`): ✅ Complete story operations added
  - **Story Creation**: ✅ `createStory` function with proper document structure and metadata
  - **Active Stories Retrieval**: ✅ `getActiveStories` with 24-hour expiration filtering
  - **Real-time Subscriptions**: ✅ `subscribeToStories` for live story updates
  - **View Tracking**: ✅ `markStoryViewed` for story interaction tracking
  - **TypeScript Integration**: ✅ Proper typing and error handling throughout
- **Database Structure**: ✅ Stories collection with comprehensive metadata (creator, imageUrl, createdAt, expiresAt, viewedBy)
- **Existing Infrastructure**: ✅ Leveraged existing Firestore rules and indexes

#### ✅ **Task 6.2: Story Posting Functionality - COMPLETED**

**Professional Story Publishing System**:

- **Story Store** (`src/store/storyStore.ts`): ✅ Complete Zustand store implementation
  - **Story Posting**: ✅ `postStory` function with image upload and Firestore integration
  - **State Management**: ✅ Loading states, error handling, and success feedback
  - **Real-time Subscriptions**: ✅ Live story updates and user data loading
  - **TypeScript Safety**: ✅ Full type definitions and error handling
- **Camera Integration** (`src/screens/main/CameraScreen.tsx`): ✅ Enhanced with story posting
  - **Post Story Button**: ✅ Dedicated button for story publishing with visual feedback
  - **Progress Tracking**: ✅ Loading indicators and success/error states
  - **Navigation Integration**: ✅ Seamless return to home screen after posting
  - **Error Handling**: ✅ Comprehensive error management with user alerts

#### ✅ **Task 6.3: Story Feed Interface - COMPLETED**

**Professional Story Display System**:

- **Story Ring Component** (`src/components/social/StoryRing.tsx`): ✅ Circular avatar with story indicators
  - **Visual Status Indicators**: ✅ Color-coded rings (yellow=unviewed, gray=viewed, blue=current user)
  - **User Avatar Display**: ✅ Profile picture with proper fallbacks
  - **Interactive Design**: ✅ Touchable with press feedback and navigation ready
  - **Professional Styling**: ✅ Snapchat-style design with proper dimensions and colors
- **Home Screen Integration** (`src/screens/main/HomeScreen.tsx`): ✅ Complete story feed implementation
  - **Story Feed Display**: ✅ Horizontal scrollable list of story rings at top of screen
  - **Real-time Updates**: ✅ Live story subscriptions and automatic refresh
  - **User Data Loading**: ✅ Story owner information retrieval and caching
  - **Smart Layout**: ✅ Stories header integrated with existing snaps list
  - **Error Handling**: ✅ Graceful handling of loading states and errors

### 🔧 **Critical Debugging & Fixes Completed**

#### **Stories Display Issues Resolved**:

- **Empty State Bug**: ✅ Fixed issue where stories wouldn't display when no snaps existed
- **Layout Integration**: ✅ Ensured FlatList always renders to show stories header
- **Conditional Rendering**: ✅ Moved empty state to ListEmptyComponent instead of conditional FlatList
- **Real-time Updates**: ✅ Confirmed story subscriptions and data flow working correctly

#### **Technical Fixes**:

- **Linting Compliance**: ✅ Fixed empty catch block with proper error handling comment
- **Navigation Types**: ✅ Corrected navigation call in CameraScreen for proper TypeScript compliance
- **Component Integration**: ✅ Seamless integration of story components with existing UI

#### **Debugging Process**:

- **Visual Debugging**: ✅ Added temporary visual indicators to identify rendering issues
- **Console Logging**: ✅ Comprehensive logging to track data flow and component states
- **Root Cause Analysis**: ✅ Identified core issue with conditional FlatList rendering
- **Clean Resolution**: ✅ Removed all debugging code after successful fix

### ✅ **Previous Phase Achievements**

### ✅ Phase 7: Real-time Chat System - **COMPLETE** (8/8 tasks completed)

#### ✅ **Task 7.1**: ✅ Configure Firebase Realtime Database for chat functionality

#### ✅ **Task 7.2**: ✅ Create chat data models and database structure

#### ✅ **Task 7.3**: ✅ Implement real-time message sending and receiving service

#### ✅ **Task 7.4**: ✅ Build chat list screen showing recent conversations

#### ✅ **Task 7.5**: ✅ Create individual chat screen with message history and input

#### ✅ **Task 7.6**: ✅ Implement typing indicators and message status

#### ✅ **Task 7.7**: ✅ Implement Zustand store for chat state management

#### ✅ **Task 7.8**: ✅ Multi-user chat QA; permission-denied bug resolved

### ✅ Phase 5: Firebase Storage & Snap System - **COMPLETE** (8/8 tasks completed)

**Major Achievement**: Complete snap sending and viewing system with professional-grade automatic deletion implemented

### ➡️ **Next Focus**

- Create cleanup trigger (Cloud Function or client-side) – pending decision
- Resume deferred Task 4.8 (cross-platform camera QA)
- Begin Phase 8 (User Management & Social Features)

## Recent Achievements

### ✅ Phase 5: Firebase Storage & Snap System - COMPLETED (8/8 tasks completed)

**Major Achievement**: Complete snap sending and viewing system with professional-grade automatic deletion implemented:

#### ✅ **Task 5.4: Snap Sending Functionality with Recipient Selection - COMPLETED**

**Professional Snap Sending System**:

- **Comprehensive Snap Store** (`src/store/snapStore.ts`): ✅ Complete state management for snaps, recipients, and sending process
- **Recipient Selection Screen** (`src/screens/main/RecipientSelectionScreen.tsx`): ✅ Professional UI with search, multi-selection, progress tracking
- **Camera Integration**: ✅ Updated CameraScreen with "Send Snap" button and navigation to recipient selection
- **Navigation Enhancement**: ✅ New MainNavigator with stack navigation for modal screens
- **Multi-recipient Support**: ✅ Send snaps to multiple recipients simultaneously with progress tracking
- **Error Handling**: ✅ Comprehensive error management and user feedback
- **Professional UI**: ✅ Snapchat-style design with consistent branding

#### ✅ **Task 5.5: Snap Viewing Interface with Automatic Deletion - COMPLETED**

**Professional Snap Viewing System**:

- **SnapViewerScreen** (`src/screens/main/SnapViewerScreen.tsx`): ✅ Full-screen snap viewing with automatic 10-second deletion
- **Enhanced HomeScreen** (`src/screens/main/HomeScreen.tsx`): ✅ Professional snap list with real-time updates and sender information
- **Automatic Deletion**: ✅ Snaps automatically delete from both Firestore and Firebase Storage after viewing
- **Professional UI Features**:
  - ✅ Progress bar showing remaining viewing time
  - ✅ Swipe down gesture to manually close
  - ✅ Sender information display with avatar and timestamp
  - ✅ Real-time countdown timer
  - ✅ Professional loading and error states
- **HomeScreen Features**:
  - ✅ Received snaps list with expiration tracking
  - ✅ Real-time updates via Firestore subscriptions
  - ✅ Visual indicators for viewed vs. new snaps
  - ✅ Pull-to-refresh functionality
  - ✅ Empty state and error handling

#### ✅ **Technical Implementation Highlights**

- **Navigation Architecture**: ✅ Complete stack navigation with modal screens for snap workflow
- **State Management**: ✅ Comprehensive Zustand store for all snap-related functionality
- **Real-time Updates**: ✅ Firestore subscriptions for live snap updates
- **Gesture Handling**: ✅ react-native-gesture-handler integration for swipe controls
- **Memory Management**: ✅ Proper cleanup of timers and subscriptions
- **Error Recovery**: ✅ Graceful handling of deletion failures and network issues
- **TypeScript Safety**: ✅ Full type safety with proper navigation and component types

#### ✅ **User Experience**

- **Snapchat-like Behavior**: ✅ Ephemeral content that disappears after viewing
- **Professional UI/UX**: ✅ Dark theme, smooth animations, intuitive controls
- **Real-time Feedback**: ✅ Progress indicators, status updates, and loading states
- **Cross-platform**: ✅ Consistent experience on iOS and Android
- **Accessibility**: ✅ Proper touch targets and visual feedback

### ✅ **Previous Phase Achievements**

### ✅ Task 4.5: Comprehensive Image Compression & Optimization System - COMPLETED

**Major Achievement**: Professional-grade image processing system implemented with advanced features:

#### **Enhanced Image Utils (`src/utils/imageUtils.ts`)**

- **Progressive Quality Compression**: ✅ Automatic quality reduction until target file size achieved
- **Context-Aware Optimization**: ✅ Different strategies for `snap`, `story`, `avatar`, `thumbnail` contexts
- **Smart Resizing**: ✅ Maintains aspect ratio while fitting within constraints
- **Batch Processing**: ✅ Process multiple images with concurrency control and progress tracking
- **Advanced Transformations**: ✅ Rotate, flip, crop, and resize operations
- **Multiple Thumbnail Generation**: ✅ Create thumbnails in various sizes with smart cropping
- **Auto-Optimization**: ✅ Intelligent optimization based on file size and dimensions
- **Comprehensive Validation**: ✅ Enhanced size validation with detailed feedback
- **Utility Functions**: ✅ File size formatting, compression percentage calculation

#### **Enhanced Camera Service (`src/services/camera.service.ts`)**

- **Automatic Optimization**: ✅ Integrated optimization for both camera and gallery images
- **Context-Aware Processing**: ✅ Optimize images based on usage context
- **Compression Feedback**: ✅ Optional compression information alerts with statistics
- **Enhanced Result Interface**: ✅ Detailed optimization metadata in results
- **Validation Integration**: ✅ Image validation before processing
- **Fallback Handling**: ✅ Graceful degradation if optimization fails

#### **Enhanced Camera Screen (`src/screens/main/CameraScreen.tsx`)**

- **Optimization Controls**: ✅ Toggle auto-optimization on/off with visual indicators
- **Context Selection**: ✅ Choose optimization context (snap/story/avatar/thumbnail)
- **Compression Feedback**: ✅ Real-time compression statistics after capture/selection
- **Enhanced Metadata Display**: ✅ File size, dimensions, compression ratio display
- **Professional UI**: ✅ Integrated optimization controls in camera interface
- **Smart Feedback**: ✅ Compression percentage and file size reduction alerts

### ✅ Task 4.6: Image Preview and Editing Interface - COMPLETED

**Major Achievement**: Professional image editing interface with comprehensive editing capabilities:

#### **Enhanced ImageEditor Component (`src/components/media/ImageEditor.tsx`)**

- **Full-Screen Interface**: ✅ Professional editing interface with dark theme and intuitive controls
- **Tabbed Navigation**: ✅ Organized editing tools in Adjust, Filters, and Rotate tabs
- **Real-time Preview**: ✅ Live preview of edits with processing indicators
- **Professional UI**: ✅ Snapchat-style design with consistent branding

#### **Editing Capabilities**

- **Rotation Controls**: ✅ 90-degree left/right rotation with visual feedback
- **Flip Operations**: ✅ Horizontal and vertical flip with toggle states
- **Filter System**: ✅ Filter preview gallery with Original, Sepia, B&W, Chrome, Fade, Instant
- **State Management**: ✅ Track changes with reset functionality
- **Save/Cancel**: ✅ Save edited images or cancel with confirmation dialogs

#### **Enhanced CameraScreen Integration (`src/screens/main/CameraScreen.tsx`)**

- **Seamless Integration**: ✅ ImageEditor integrated into camera workflow
- **Edit Button**: ✅ Easy access to editing from image preview
- **State Preservation**: ✅ Maintain image metadata through editing process
- **Professional Feedback**: ✅ Success/error messages and user guidance
- **Delete Functionality**: ✅ Optional image deletion with confirmation

#### **Technical Implementation**

- **expo-image-manipulator**: ✅ Professional image manipulation with rotate and flip operations
- **Error Handling**: ✅ Comprehensive error management with user-friendly messages
- **Performance**: ✅ Efficient processing with loading indicators
- **TypeScript**: ✅ Full type safety with proper interfaces
- **Memory Management**: ✅ Proper cleanup and image URI management

### ✅ Task 4.7: Custom Camera Hook Implementation - COMPLETED

**Major Achievement**: Comprehensive custom hook that abstracts all camera functionality from components:

#### **useCamera Hook (`src/hooks/useCamera.ts`)**

- **Complete State Management**: ✅ All camera, permission, timer, image, and optimization states centralized
- **Comprehensive Actions**: ✅ Permission management, camera controls, image handling, optimization controls
- **TypeScript-First Design**: ✅ Full type safety with detailed interfaces and return types
- **Configurable Options**: ✅ Initialization options for auto-optimize, context, camera type, flash mode
- **Performance Optimized**: ✅ useCallback optimization for takePicture function with proper dependencies
- **Developer Experience**: ✅ Clean API with logical grouping and utility functions

#### **Hook Features**

- **Permission States**: ✅ Camera, media library, loading, requesting, error, availability tracking
- **Camera Controls**: ✅ Ready state, capturing, type toggle, flash modes, zoom adjustment, grid toggle
- **Timer Functionality**: ✅ 3s/10s timer modes with countdown and automatic capture
- **Image Management**: ✅ Captured photo, selected image, picking state, source tracking
- **Optimization Controls**: ✅ Auto-optimize toggle, context cycling, compression feedback
- **Utility Functions**: ✅ Flash mode icons/text, permission checks, camera/gallery availability

#### **Convenience Hooks**

- **useCameraPermissions**: ✅ Quick access to permission state
- **useIsCameraReady**: ✅ Combined camera availability and readiness check
- **useCapturedImage**: ✅ Direct access to selected image data

#### **Technical Excellence**

- **Memory Management**: ✅ Proper cleanup and effect dependencies
- **Error Handling**: ✅ Comprehensive error states and fallback strategies
- **Code Quality**: ✅ ESLint and Prettier compliant, TypeScript strict mode
- **Reusability**: ✅ Can be used across entire app for any camera functionality

### ✅ Task 4.4: Image Picker Integration - COMPLETED

- **Gallery Selection**: ✅ Full image picker integration with expo-image-picker
- **Permission Management**: ✅ Comprehensive gallery permission handling
- **Image Preview**: ✅ Full-screen preview for selected images with metadata
- **Source Tracking**: ✅ Visual indication of image source (camera vs gallery)
- **Multiple Workflows**: ✅ Three ways to get images (direct camera, gallery, source dialog)
- **Enhanced UI**: ✅ Seamless integration maintaining professional design

### ✅ Task 4.3: Enhanced Camera Controls - COMPLETED

- **Advanced Controls**: ✅ Zoom controls with visual feedback slider
- **Timer Functionality**: ✅ 3s and 10s timer with countdown overlay
- **Grid Lines**: ✅ Composition grid overlay toggle
- **Enhanced Flash**: ✅ Visual icons and better UI for flash modes
- **Professional Layout**: ✅ Reorganized control bars with logical grouping
- **Real-time Feedback**: ✅ Status indicators and settings display

### ✅ Phase 4: Camera Integration & Image Handling - COMPLETED (7/8 tasks completed)

- **Task 4.1**: ✅ Camera permissions configuration and access service implemented
- **Task 4.2**: ✅ Full camera screen with photo capture functionality implemented
- **Task 4.3**: ✅ Enhanced camera controls with zoom, timer, grid, flash improvements
- **Task 4.4**: ✅ Image picker integration with gallery selection and preview
- **Task 4.5**: ✅ Comprehensive image compression and optimization utilities
- **Task 4.6**: ✅ Create image preview and editing interface (COMPLETE)
- **Task 4.7**: ✅ Build custom hook for camera functionality and permissions (COMPLETE)
- **Task 4.8**: Test camera functionality on both iOS and Android devices

### ✅ Camera Implementation Highlights

- **Professional Camera Interface**: ✅ Snapchat-style UI with advanced controls
- **Image Optimization System**: ✅ Production-ready compression and optimization
- **Gallery Integration**: ✅ Seamless camera and gallery selection workflow
- **Context-Aware Processing**: ✅ Smart optimization based on image usage
- **Real-time Feedback**: ✅ Compression statistics and optimization results
- **Cross-platform Compatibility**: ✅ Works on both iOS and Android
- **Error Handling**: ✅ Comprehensive error management and fallback strategies
- **Performance Optimized**: ✅ Efficient image processing with batch capabilities

### ✅ Phase 3: Core Navigation & UI Framework - COMPLETE (8/8 tasks completed)

- **Task 3.1**: ✅ React Navigation with native stack and tab navigators configured
- **Task 3.2**: ✅ Main app navigation structure with tab navigation created
- **Task 3.3**: ✅ Authentication navigation stack implemented
- **Task 3.4**: ✅ Complete reusable UI component library built (Button, Input, LoadingSpinner, Modal)
- **Task 3.5**: ✅ TailwindCSS styling system configured with Snapchat theme
- **Task 3.6**: ✅ ErrorBoundary component for error handling created and integrated
- **Task 3.7**: ✅ Protected route logic based on authentication state implemented
- **Task 3.8**: ✅ Navigation flow between all screens tested and working

### ✅ Phase 2: Authentication System Implementation - COMPLETE (8/8 tasks completed)

- **Task 2.1**: ✅ Firebase Auth service with email/password authentication methods implemented
- **Task 2.2**: ✅ Zustand store for authentication state management created
- **Task 2.3**: ✅ useAuth custom hook for authentication logic and state built
- **Task 2.4**: ✅ Login screen with email/password inputs and validation completed
- **Task 2.5**: ✅ Registration screen with form validation and error handling created
- **Task 2.6**: ✅ Authentication loading screen and state management implemented
- **Task 2.7**: ✅ Authentication navigation flow and protected routes set up
- **Task 2.8**: ✅ Complete authentication flow tested (register, login, logout)

### ✅ Phase 1: Foundation Setup - COMPLETE

- **Firebase Project**: ✅ Created 'snapchat-clone-mvp' with all required services
- **Firebase Services**: ✅ Auth, Firestore, Realtime DB, and Storage configured
- **Security Rules**: ✅ Comprehensive rules deployed for all services
- **Firebase Configuration**: ✅ Proper React Native integration with AsyncStorage persistence
- **Code Quality Tools**: ✅ ESLint v9, Prettier, and TypeScript checking configured
- **Development Workflow**: ✅ Professional-grade linting and formatting established
- **Dependencies**: ✅ All packages installed and configured correctly
- **Project Structure**: ✅ Complete src/ folder organization with types, utils, services, components
- **Type System**: ✅ Comprehensive TypeScript definitions for all app interfaces
- **Utility Functions**: ✅ Advanced image processing, validation, and constants established
- **TailwindCSS + NativeWind**: ✅ Complete styling system with Snapchat theme

## Active Considerations

- **Image Preview Interface**: Task 4.6 is next - need full-screen image preview with editing capabilities
- **Camera Hook Abstraction**: Task 4.7 - create reusable custom hook for camera functionality
- **Cross-platform Testing**: Task 4.8 - ensure camera and optimization work consistently
- **Performance Monitoring**: Monitor image processing performance on various devices
- **Memory Management**: Ensure proper cleanup of processed images

## Next Steps (Phase 6 - Stories Feature)

With Phase 5 fully complete, the immediate focus shifts to Phase 6 – Stories implementation. Key upcoming tasks:

1. **Task 6.1**: Create Firestore data model and collection for stories with 24-hour expiration
2. **Task 6.2**: Implement story posting functionality from camera or gallery
3. **Task 6.3**: Build story feed interface with story rings and user avatars
4. **Task 6.4**: Create full-screen story viewer with swipe navigation
5. **Task 6.5**: Implement automatic story expiration and cleanup service

## Current Challenges

- **Firebase Storage Integration**: Need to implement secure image upload with progress tracking
- **Snap Data Modeling**: Design efficient Firestore structure for ephemeral messaging
- **Real-time Snap Delivery**: Implement instant snap notifications and delivery
- **Automatic Cleanup**: Build system for automatic snap deletion after viewing

## Development Environment Status

- **Node.js**: ✅ v20.11.1 installed and verified
- **Expo CLI**: ✅ v0.24.15 installed and working
- **Firebase CLI**: ✅ v14.8.0 installed and configured
- **React Navigation**: ✅ v6 with native stack and tab navigators installed
- **Expo Project**: ✅ Running successfully with Firebase, NativeWind, Navigation, Camera, and Image Optimization
- **Firebase Project**: ✅ 'snapchat-clone-mvp' fully configured and operational
- **Code Quality**: ✅ Complete pipeline working without issues
- **Development Device**: ✅ App tested and working with advanced camera and optimization features

## Code Quality Workflow

- **Linting**: `npm run lint` - ESLint with TypeScript support ✅
- **Formatting**: `npm run format` - Prettier code formatting ✅
- **Type Checking**: `npm run type-check` - TypeScript validation ✅
- **Complete Check**: `npm run check-all` - All quality checks ✅
- **Auto-fix**: `npm run lint:fix` - Automatic issue resolution ✅

## Success Indicators for Phase 4 (IN PROGRESS - 5/8 completed)

- [x] Camera permissions properly implemented
- [x] Camera screen with photo capture functionality
- [x] Enhanced camera controls (zoom, timer, grid, flash)
- [x] Image picker integration complete
- [x] Comprehensive image compression and optimization utilities
- [ ] Image preview and editing interface
- [ ] Custom camera hook implementation
- [ ] Cross-platform camera testing complete

## Risk Mitigation

- **Code Quality**: Professional linting and formatting prevent technical debt ✅
- **Firebase Security**: Comprehensive security rules protect user data ✅
- **Documentation**: Memory bank maintains project context and decisions ✅
- **Testing Strategy**: Authentication and camera flows tested and working ✅
- **Architecture**: Clean separation of concerns for scalable development ✅
- **Navigation**: Proper React Navigation implementation with TypeScript ✅
- **Camera Implementation**: Professional-grade camera with optimization system ✅
- **Image Processing**: Production-ready compression and optimization pipeline ✅

## Communication Notes

- Phase 4 Camera Integration & Image Handling significantly advanced with Task 4.5 completion
- Professional image optimization system now rivals commercial applications
- Ready to proceed with image preview and editing interface (Task 4.6)

### ✅ **Critical Fixes (2025-06-25)**

1. **React Infinite Loop Resolved**
   - Removed `chatStore` object from several `useEffect` dependency arrays in `ChatScreen.tsx`.
   - Chat no longer triggers "Maximum update depth exceeded"; performance normal.

2. **Keyboard & Layout Polishing**
   - Added `useHeaderHeight` + `useSafeAreaInsets` to compute accurate `keyboardVerticalOffset`.
   - Text input + send button stay visible when keyboard opens.

3. **Gesture Handler Foundation**
   - Added global import `'react-native-gesture-handler'` in `index.ts`.
   - Wrapped root app with `GestureHandlerRootView` in `App.tsx`.

4. **Reanimated Version Alignment**
   - Locked `react-native-reanimated` to `3.17.4` (native match for Expo SDK 53).
   - Added Babel plugin `react-native-reanimated/plugin`.
   - Eliminated JS/native version mismatch & `makeMutable` undefined error during snap sending.

### 🔒 **Security Rule Update (2025-06-25)**

FireStore rule for `/stories/{storyId}` updated: any authenticated user can append their UID to `viewedBy`, while only the owner may create/delete; prevents permission-denied during view tracking.

### 👫 **CONTACTS & SOCIAL INTEGRATION (2025-06-25)**
- Implemented full friends system:
  - Added `addContact`, `removeContact`, `getContacts`, `subscribeToContacts` to **FirestoreService**
  - Extended **userStore** with real-time contacts state & actions
  - Added **Add / Remove Friend** button on `UserProfileScreen`
  - Profile screen now lists "My Friends" with navigation
- Social features now respect friends list:
  - Snap recipient picker shows only contacts
  - Story feed filters to friends + self
  - New chat creation limited to contacts
- Firestore security rule `/users/{uid}/contacts/{contactId}` added
- Lint passes with no errors
