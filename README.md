# EventSnap 📸🎉

**EventSnap** is a cross-platform mobile app that blends Snapchat-style ephemeral media with event-centric social features and an AI-powered chat assistant. Built entirely with React Native and Firebase, EventSnap lets communities capture moments, share disappearing stories, and converse in real-time around live events.

---

## ✨ Key Features

| Category | Highlights |
|----------|------------|
| **Authentication** | Email/Password sign-up & login powered by Firebase Auth, session persistence, profile setup |
| **Camera-First UX** | Instant camera launch, photo/video capture, media editing & compression, gallery import |
| **Ephemeral Snaps & Stories** | 1-to-1 snaps and 24-hour stories with auto-deletion & screenshot detection |
| **Event Layer** | Create & join events with dedicated story feeds and group chat channels |
| **Real-Time Chat** | 1-to-1 & group messaging (Firestore / Realtime DB), typing indicators, read receipts |
| **AI Assistant** | Retrieval-Augmented Generation (RAG) chat for quick answers & content suggestions |
| **Cloud Functions** | Serverless business logic, scheduled cleanup of expired media, AI embedding ingestion |
| **Theming & Dark Mode** | NativeWind + Tailwind CSS-v4 design system |

---

## 🛠 Tech Stack

### Frontend

- **React Native (Expo SDK 50)**  
- **TypeScript** end-to-end  
- **NativeWind** (Tailwind CSS v4) for styling  
- **React Navigation 7** (stack/tab)  
- **Zustand** for lightweight state management  
- **react-hook-form + zod** for forms & validation

### Backend / Infrastructure

- **Firebase** (Auth, Firestore, Realtime Database, Storage, Cloud Functions)  
- **Cloud Functions (Node 20 + TS)** for serverless logic & AI integrations  
- **OpenAI GPT-4o** via callable functions for AI chat  
- **Expo Notifications + FCM** (push, coming soon)

---

## 🚀 Getting Started Locally

### Prerequisites

1. **Node 20+** & **npm 9+**  
2. **Expo CLI** – `npm i -g expo-cli`  
3. **Firebase CLI** – `npm i -g firebase-tools`  
4. iOS Simulator (macOS) or Android Emulator / physical device

### 1. Clone & Install

```bash
# Clone
git clone <repo-url> eventsnap && cd eventsnap

# Install deps
npm install
```

### 2. Configure Firebase

1. Create a new Firebase project in the console.  
2. Enable **Auth → Email/Password**, **Firestore**, **Realtime DB**, **Storage**.  
3. Copy your web app config and duplicate `firebase.config.example.js` → `firebase.config.js`, then paste your keys.
4. (Optional) Start local emulators:

```bash
firebase init emulators
firebase emulators:start
```

### 3. Run the App

```bash
# Start Metro bundler
npm start        # or: expo start

# In a separate terminal, for iOS / Android shortcuts
npm run ios      # macOS only
npm run android  # Android emulator/device
```

The Expo Dev Tools UI will provide QR codes for physical devices.

### 4. Deploy Cloud Functions & Rules (optional)

```bash
# Log in & select project
firebase login
firebase deploy --only functions,firestore:rules,database:rules,storage:rules
```

---

## 📂 Project Structure (Simplified)

```
├── App.tsx                 # Root component
├── src/
│   ├── components/
│   │   ├── features/       # Feature-scoped UI
│   │   ├── ui/             # Atomic reusable components
│   │   └── common/         # Shared components
│   ├── hooks/              # Custom React hooks
│   ├── navigation/         # App, Auth, Main navigators
│   ├── screens/            # Screen components grouped by domain
│   ├── services/           # Firebase & AI service wrappers
│   ├── store/              # Zustand stores
│   └── utils/              # Pure utility methods
├── functions/              # Firebase Cloud Functions (TypeScript)
└── memory-bank/            # Project docs & context used by Cursor AI
```

> For a full directory tree, inspect the `project_layout` in this repo.

---

## 📐 Architectural Overview

EventSnap follows a **feature-modular architecture**:

1. **UI Layer** → React Native components & screens  
2. **State Layer** → Zustand stores & React context  
3. **Service Layer** → Firebase & AI abstractions  
4. **Backend** → Firebase services + Cloud Functions (cleanup, AI)  

Refer to `memory-bank/systemPatterns.md` for diagrams and deeper insights.

---

## 🧪 Useful NPM Scripts

```bash
npm start           # Expo dev server
npm run ios         # Run on iOS
npm run android     # Run on Android
npm run lint        # ESLint
npm run format      # Prettier
npm run type-check  # TypeScript check
npm run test        # Jest tests (coming soon)
```

---

## 🔒 Security & Privacy

- Firebase Security Rules for Firestore, Realtime DB & Storage  
- Per-user data isolation (UID-scoped documents & files)  
- Expiring media cleanup every 24 h via Cloud Functions  
- Environment variables excluded from version control

---

## 📄 Related Docs

- [Product Brief](./memory-bank/projectbrief.md)
- [Tech Context](./memory-bank/techContext.md)
- [System Patterns](./memory-bank/systemPatterns.md)
- [Progress Board](./memory-bank/progress.md)
- [PRD & Task Lists](./tasks)

---

## 🤝 Contributing

This repository is currently private/internal. PRs are welcome once the contribution guidelines are published.

---

## 🪪 License

Internal prototype for educational & demo purposes only. Not affiliated with Snap Inc.

---

Crafted with ❤️ by the EventSnap team.
