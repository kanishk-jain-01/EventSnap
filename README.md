# Snapchat Clone MVP 📸

A full-featured Snapchat clone mobile application built with React Native and Firebase, featuring ephemeral photo messaging, stories, real-time chat, and user authentication.

## 🚀 Features

### ✅ Implemented Features

- **🔐 Authentication System**
  - Email/password registration and login
  - Secure session management with Firebase Auth
  - Protected routes and authentication flow

- **📷 Advanced Camera System**
  - Real-time camera preview with front/back toggle
  - Professional photo capture with quality control
  - Gallery image selection with permissions
  - Advanced camera controls (zoom, timer, grid, flash)
  - Smart image compression and optimization
  - Context-aware processing (snap/story/avatar/thumbnail)

- **📱 Core Navigation & UI**
  - Tab-based navigation with authentication flow
  - Dark theme following Snapchat's aesthetic
  - Reusable UI components (Button, Input, Modal, LoadingSpinner)
  - Error boundary for graceful error handling

- **💾 Firebase Storage Integration**
  - Secure image upload with progress tracking
  - User-based folder isolation
  - Automatic file organization and naming

- **📬 Snap System**
  - Send and receive disappearing photo messages
  - Recipient selection with search functionality
  - Snap viewing with automatic deletion
  - Comprehensive snap metadata tracking

- **💬 Real-time Chat System** (In Progress)
  - Text messaging between users
  - Real-time message synchronization
  - Conversation history preservation

### 🔄 In Development

- **📚 Stories Feature**
  - 24-hour ephemeral story posting
  - Story viewing from contacts
  - Automatic story expiration

## 🛠 Tech Stack

### Frontend

- **React Native** with Expo SDK ~53.0
- **TypeScript** for type safety
- **TailwindCSS** with NativeWind for styling
- **Zustand** for state management
- **React Navigation** for navigation

### Backend (Firebase)

- **Firebase Authentication** (Email/Password)
- **Firestore** for structured data (users, stories, snap metadata)
- **Realtime Database** for real-time chat messages
- **Firebase Storage** for image uploads
- **Security Rules** for data protection

### Key Dependencies

- `expo-camera` - Camera functionality
- `expo-image-picker` - Gallery selection
- `expo-image-manipulator` - Image processing
- `firebase` - Backend services
- `react-navigation` - Navigation system

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Expo CLI (`npm install -g @expo/cli`)
- Firebase CLI (`npm install -g firebase-tools`)
- iOS Simulator (Mac) or Android Emulator
- Firebase project with enabled services

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd snapchat-clone
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password provider)
   - Create Firestore database
   - Create Realtime Database
   - Enable Storage
   - Copy your Firebase config and create `firebase.config.js` (see setup guide below)

4. **Configure Firebase**
   Create `firebase.config.js` in the root directory:

   ```javascript
   import { initializeApp } from 'firebase/app';
   import { getAuth } from 'firebase/auth';
   import { getFirestore } from 'firebase/firestore';
   import { getDatabase } from 'firebase/database';
   import { getStorage } from 'firebase/storage';

   const firebaseConfig = {
     apiKey: 'your-api-key',
     authDomain: 'your-project.firebaseapp.com',
     databaseURL: 'https://your-project-rtdb.firebaseio.com',
     projectId: 'your-project-id',
     storageBucket: 'your-project.firebasestorage.app',
     messagingSenderId: 'your-sender-id',
     appId: 'your-app-id',
   };

   const app = initializeApp(firebaseConfig);
   export const auth = getAuth(app);
   export const firestore = getFirestore(app);
   export const realtimeDb = getDatabase(app);
   export const storage = getStorage(app);
   export default app;
   ```

5. **Deploy Firebase Security Rules**

   ```bash
   firebase deploy --only firestore:rules,database:rules,storage:rules
   ```

6. **Start the development server**

   ```bash
   npm start
   ```

7. **Run on device/simulator**
   ```bash
   npm run ios    # for iOS
   npm run android # for Android
   ```

## 📱 Usage

1. **Registration/Login**: Create an account or sign in with existing credentials
2. **Camera**: Tap the camera button to capture photos or select from gallery
3. **Send Snaps**: Choose recipients and send disappearing photos
4. **View Snaps**: Tap on received snaps to view (they disappear after viewing)
5. **Chat**: Navigate to chat tab for real-time messaging
6. **Stories**: Post and view 24-hour stories (coming soon)

## 🏗 Project Structure

```
src/
├── components/
│   ├── common/           # Shared components
│   ├── features/         # Feature-specific components
│   │   ├── auth/         # Authentication components
│   │   ├── camera/       # Camera-related components
│   │   ├── chat/         # Chat components
│   │   └── stories/      # Stories components
│   ├── media/            # Media handling components
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
├── navigation/           # Navigation configuration
├── screens/              # Screen components
│   ├── auth/             # Authentication screens
│   └── main/             # Main app screens
├── services/             # Firebase and API services
├── store/                # Zustand state management
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## 🔒 Security Features

- **Firebase Security Rules** for Firestore, Realtime Database, and Storage
- **User-based access control** for all data and files
- **Input validation** and sanitization
- **Protected routes** requiring authentication
- **Secure image upload** with file type and size validation

## 🧪 Development Scripts

```bash
npm start          # Start Expo development server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in web browser
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
npm run type-check # Run TypeScript type checking
npm run format     # Format code with Prettier
npm run check-all  # Run all checks (types, lint, format)
```

## 📋 Current Development Status

**Phase 7: Real-time Chat System** (3/8 tasks completed)

- ✅ Authentication System (100% complete)
- ✅ Core Navigation & UI Framework (100% complete)
- ✅ Advanced Camera Integration (87% complete)
- ✅ Firebase Storage & Snap System (62% complete)
- 🔄 Real-time Chat System (37% complete)
- ⏳ Stories Feature (pending)
- ⏳ UI Polish & Testing (pending)
- ⏳ Security Hardening (pending)

## 🐛 Known Issues

- Camera functionality testing needed on physical devices
- Stories feature implementation in progress
- Push notifications not yet implemented
- Advanced privacy settings pending

## 🤝 Contributing

This is an internal testing project. For development:

1. Follow the existing code structure and patterns
2. Run `npm run check-all` before committing
3. Update documentation for new features
4. Test on both iOS and Android when possible

## 📄 License

This project is for internal testing and learning purposes only.

## 🔗 Related Documentation

- [Product Requirements Document](./memory-bank/productContext.md)
- [Technical Architecture](./memory-bank/techContext.md)
- [Development Progress](./memory-bank/progress.md)
- [Task List](./tasks/tasks-snapchat-clone-mvp.md)

## 📞 Support

For questions or issues, refer to the memory bank documentation or create an issue in the repository.

---

**Built with ❤️ using React Native, Expo, and Firebase**
