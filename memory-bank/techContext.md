# Tech Context

## Frontend
- **Framework**: React Native (Expo SDK 50)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 via NativeWind 2.x
- **Navigation**: react-navigation 7
- **State Management**: Zustand + React Context where needed
- **Form Handling**: react-hook-form + zod for validation
- **Media**: expo-camera, expo-image-picker, expo-av
- **Testing**: Jest + @testing-library/react-native (to be configured)

## Backend
- **Firebase**: Auth, Firestore, Storage, Realtime Database
- **Cloud Functions**: TypeScript (Node 20), organized per feature, using modular SDK v11
- **Hosting**: Firebase Hosting (for AI model endpoints if needed)
- **AI Services**: OpenAI GPT-4o via secure callable functions

## Dev Tooling
- **Linting**: eslint + @typescript-eslint + prettier
- **Bundler**: Metro (Expo Managed)
- **CI/CD**: GitHub Actions + EAS Build/Submit (planned)

## Environment Configuration
- Sample Firebase config in `firebase.config.example.js` (must copy to `.env` or `.env.local`).
- Tailwind theme defined in `tailwind.config.js`.
- Local emulators supported via `firebase.json`.

## Constraints
- Keep bundle size < 10 MB for first install.
- Support iOS 15+ and Android 10+.
- Use serverless patterns; avoid dedicated backend servers.

---
Generated automatically by Cursor AI to bootstrap the Memory Bank. 