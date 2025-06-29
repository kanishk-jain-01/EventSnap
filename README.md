# EventSnap 📸🎉

**EventSnap** is a cross-platform mobile app that blends Snapchat-style ephemeral media with event-centric social features and an AI-powered RAG (Retrieval-Augmented Generation) chat assistant. Built entirely with React Native and Firebase, EventSnap lets communities capture moments, share disappearing stories, and get intelligent answers about event documents through AI.

---

## ✨ Key Features

| Category | Highlights |
|----------|------------|
| **Authentication** | Email/Password sign-up & login powered by Firebase Auth, session persistence, profile setup |
| **Camera-First UX** | Instant camera launch, photo/video capture, media editing & compression, gallery import |
| **Ephemeral Snaps & Stories** | 1-to-1 snaps and 24-hour stories with auto-deletion & screenshot detection |
| **Event Layer** | Create & join events with dedicated story feeds and group chat channels |
| **Real-Time Chat** | 1-to-1 & group messaging (Firestore / Realtime DB), typing indicators, read receipts |
| **AI Document Assistant** | RAG-powered chat that answers questions about uploaded event documents (PDFs, images) |
| **Document Management** | Upload, browse, and view event documents with full PDF and image support |
| **Smart Citations** | AI responses include clickable citations that navigate to specific document sections |
| **Cloud Functions** | Serverless business logic, automated document processing, AI embedding ingestion |
| **Theming & Dark Mode** | NativeWind + Tailwind CSS-v4 design system |

---

## 🛠 Tech Stack

### Frontend

- **React Native (Expo SDK 53)**  
- **TypeScript** end-to-end  
- **NativeWind** (Tailwind CSS v4) for styling  
- **React Navigation 7** (stack/tab)  
- **Zustand** for lightweight state management  
- **Expo Camera, Image Picker, Document Picker** for media handling

### Backend / Infrastructure

- **Firebase** (Auth, Firestore, Realtime Database, Storage, Cloud Functions)  
- **Cloud Functions (Node 20 + TS)** for serverless logic & AI integrations  
- **OpenAI GPT-4o** for AI chat responses
- **Pinecone** for vector embeddings and semantic search
- **Google Cloud Vision API** for OCR processing of images
- **Expo Notifications + FCM** (push, coming soon)

---

## 🚀 Getting Started

### Prerequisites

1. **Node 20+** & **npm 9+**  
2. **Expo CLI** – `npm i -g @expo/cli`  
3. **Firebase CLI** – `npm i -g firebase-tools`  
4. iOS Simulator (macOS) or Android Emulator / physical device
5. **Firebase Project** with the following services enabled:
   - Authentication (Email/Password)
   - Firestore Database
   - Realtime Database
   - Cloud Storage
   - Cloud Functions
6. **Third-party API Keys** (for AI features):
   - OpenAI API key
   - Pinecone API key
   - Google Cloud Vision API key (optional, for image OCR)

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repo-url> eventsnap && cd eventsnap

# Install main app dependencies
npm install

# Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

### 2. Configure Firebase

#### 2.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable the following services:
   - **Authentication** → Sign-in method → Email/Password
   - **Firestore Database** → Create database in production mode
   - **Realtime Database** → Create database
   - **Storage** → Get started
   - **Functions** → Get started

#### 2.2 Set up Firebase Configuration
1. In your Firebase project, go to Project Settings → General → Your apps
2. Add a web app and copy the configuration object
3. Copy the example config file and add your credentials:

```bash
cp firebase.config.example.js firebase.config.js
```

4. Edit `firebase.config.js` and replace the placeholder values with your actual Firebase project configuration:

```javascript
const firebaseConfig = {
  apiKey: 'your-actual-api-key',
  authDomain: 'your-project-id.firebaseapp.com',
  databaseURL: 'https://your-project-id-default-rtdb.firebaseio.com',
  projectId: 'your-actual-project-id',
  storageBucket: 'your-project-id.firebasestorage.app',
  messagingSenderId: 'your-actual-sender-id',
  appId: 'your-actual-app-id',
};
```

### 3. Configure Cloud Functions Environment Variables

The AI features require several API keys that need to be configured as environment variables for Firebase Functions.

#### 3.1 Create Environment File
Create a `.env` file in the `functions/` directory:

```bash
cd functions
touch .env
```

#### 3.2 Add Required Environment Variables
Edit `functions/.env` and add the following variables:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone Configuration  
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX=your_pinecone_index_name

# Google Cloud Vision (optional, for image OCR)
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
```

#### 3.3 Set Firebase Functions Environment Variables
You can deploy these environment variables to Firebase Functions using the Firebase CLI:

```bash
# Set environment variables for production
firebase functions:config:set openai.api_key="your_openai_api_key"
firebase functions:config:set pinecone.api_key="your_pinecone_api_key"  
firebase functions:config:set pinecone.index="your_pinecone_index_name"

# Deploy the configuration
firebase deploy --only functions:config
```

#### 3.4 Local Development with Emulators
For local development, the `.env` file will be automatically loaded when using Firebase emulators:

```bash
# Start Firebase emulators (includes Functions, Firestore, Storage)
firebase emulators:start

# Or start only specific emulators
firebase emulators:start --only functions,firestore,storage
```

### 4. Set up Third-Party Services

#### 4.1 OpenAI Setup
1. Create an account at [OpenAI](https://platform.openai.com/)
2. Generate an API key
3. Add the key to your environment variables (see step 3.2)

#### 4.2 Pinecone Setup
1. Create an account at [Pinecone](https://www.pinecone.io/)
2. Create a new index with the following settings:
   - **Dimensions**: 1536 (for OpenAI text-embedding-3-small)
   - **Metric**: cosine
   - **Pod Type**: s1.x1 (starter)
3. Get your API key and index name
4. Add them to your environment variables (see step 3.2)

### 5. Deploy Firebase Security Rules & Functions

```bash
# Login to Firebase (if not already logged in)
firebase login

# Select your project
firebase use your-project-id

# Deploy Firestore rules, Storage rules, and Cloud Functions
firebase deploy --only firestore:rules,storage:rules,functions
```

### 6. Run the App

```bash
# Start the Expo development server
npm start

# Or run on specific platforms
npm run ios      # iOS (macOS only)
npm run android  # Android
```

The Expo Dev Tools will provide QR codes for testing on physical devices.

---

## 📂 Project Structure

```
├── App.tsx                 # Root component with navigation setup
├── src/
│   ├── components/
│   │   ├── features/       # Feature-specific UI components
│   │   │   ├── chat/       # AI chat components (AIMessageBubble)
│   │   │   └── documents/  # Document components (CitationLink)
│   │   ├── media/          # Camera and image handling components
│   │   ├── social/         # Story and social feature components
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── navigation/         # App navigation structure
│   ├── screens/            # Screen components organized by feature
│   │   ├── auth/           # Authentication screens
│   │   ├── main/           # Main app screens including AI chat
│   │   └── organizer/      # Event organizer screens
│   ├── services/           # Firebase service abstractions
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── functions/              # Firebase Cloud Functions
│   ├── ragAnswer/          # AI chat RAG endpoint
│   ├── ingestPDFEmbeddings/ # PDF processing pipeline
│   ├── ingestImageEmbeddings/ # Image OCR processing
│   └── endEvent/           # Event cleanup functions
├── memory-bank/            # Project documentation for AI context
└── tasks/                  # Development task lists and PRDs
```

---

## 🤖 AI Features Deep Dive

### Document Intelligence System
EventSnap includes a sophisticated AI system that can answer questions about uploaded event documents:

1. **Document Upload**: Event hosts upload PDFs or images
2. **Automatic Processing**: Cloud Functions extract text and generate embeddings
3. **Vector Storage**: Embeddings stored in Pinecone with event-specific namespaces
4. **Intelligent Q&A**: Users ask questions in natural language
5. **Contextual Answers**: AI provides answers with citations to source documents

### Supported Document Types
- **PDFs**: Full text extraction and processing
- **Images**: OCR text extraction using Google Cloud Vision
- **Future**: Word docs, spreadsheets, presentations

### AI Chat Capabilities
- Event-scoped document search
- Semantic similarity matching
- Citation-backed responses
- Error handling and retry logic
- Real-time loading states

---

## 🧪 Development Scripts

```bash
# Main app
npm start           # Start Expo dev server
npm run ios         # Run on iOS simulator
npm run android     # Run on Android emulator
npm run lint        # ESLint check
npm run lint:fix    # ESLint auto-fix
npm run type-check  # TypeScript validation
npm run format      # Prettier formatting

# Cloud Functions (run from functions/ directory)
cd functions
npm run build       # Compile TypeScript
npm run serve       # Start local emulator
npm run deploy      # Deploy to Firebase
```

---

## 🔒 Security & Privacy

- **Firebase Security Rules** for Firestore, Realtime Database & Storage  
- **Per-user data isolation** with UID-scoped documents & files  
- **Event-scoped access control** for documents and AI features
- **Automatic media cleanup** every 24 hours via Cloud Functions  
- **Environment variables** excluded from version control
- **API key protection** through Firebase Functions configuration

---

## 🚨 Troubleshooting

### Common Setup Issues

#### Firebase Configuration
- Ensure all Firebase services are enabled in your project
- Verify `firebase.config.js` has correct project credentials
- Check that Security Rules are deployed: `firebase deploy --only firestore:rules,storage:rules`

#### Cloud Functions Environment Variables
- Verify `.env` file exists in `functions/` directory
- For production: Use `firebase functions:config:set` to deploy environment variables
- For local development: Ensure emulators can read the `.env` file

#### AI Features Not Working
- Check OpenAI API key is valid and has sufficient credits
- Verify Pinecone index exists with correct dimensions (1536)
- Ensure Cloud Functions have proper IAM permissions
- Check Cloud Function logs: `firebase functions:log`

#### Build/Runtime Errors
- Clear Metro cache: `npx expo start --clear`
- Reset node modules: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run type-check`

---

## 📄 Related Documentation

- [Product Brief](./memory-bank/projectbrief.md) - Project overview and goals
- [Tech Context](./memory-bank/techContext.md) - Technical architecture details  
- [System Patterns](./memory-bank/systemPatterns.md) - Design patterns and structure
- [Progress Board](./memory-bank/progress.md) - Current implementation status
- [Task Lists](./tasks/) - Development roadmap and PRDs

---

## 🤝 Contributing

This repository is currently private/internal. For contributors:

1. Follow the existing code style and TypeScript patterns
2. Run `npm run check-all` before committing
3. Update relevant documentation in `memory-bank/` for significant changes
4. Test both local emulators and production deployments

---

## 🪪 License

Internal prototype for educational & demo purposes only. Not affiliated with Snap Inc.

---

*Crafted with ❤️ by the EventSnap team.*
