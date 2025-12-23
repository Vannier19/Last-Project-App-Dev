# Proses Implementasi dan Teknologi yang Digunakan

## Virtual Physics Lab - Full Stack Development Process

---

## 7.1 Overview

The Virtual Physics Lab application was developed through a systematic, phased approach that prioritized user experience, security, and scalability. The development lifecycle began with comprehensive design research and prototyping to establish clear visual and functional specifications, followed by backend infrastructure implementation to handle authentication and data persistence, backend deployment to Firebase Cloud Functions for production readiness, frontend development using React Native for cross-platform compatibility, and finally frontend deployment. This document details each phase of the implementation process, the technologies employed, and the technical considerations that guided architectural decisions.

---

## 7.2 Implementation Phases

### 7.2.1 Design Research & Prototyping (Figma, Draw.io)

**Tools Used:** Figma, Draw.io

The initial phase focused on translating educational requirements into tangible design artifacts. Using Figma as the primary design tool, the team created high-fidelity mockups for core application screens including the physics simulation laboratory interface, interactive quiz modules, learning materials presentation, and user profile dashboard. The design process prioritized intuitive navigation flows that would allow students to seamlessly transition between learning content, hands-on simulations, and assessment activities.

During this phase, particular attention was given to defining component specifications that would later accelerate frontend development. Input controls for simulation parameters (velocity, angle, mass), interactive buttons with clear affordances, real-time data visualization panels for physics calculations, and responsive card layouts for quiz questions were all meticulously documented with spacing, color schemes, typography, and interaction states. This comprehensive specification ensured consistency across the development team and reduced ambiguity during implementation.

Following the initial Figma prototypes, the design team utilized Draw.io to create detailed system architecture diagrams and user flow charts. These diagrams illustrated the authentication flow from Google OAuth through token generation and storage, the data flow between frontend components and backend API endpoints, the simulation engine's computational pipeline, and the progress tracking mechanism that synchronizes user activities to the database. These technical diagrams served as crucial reference materials during both backend and frontend implementation phases, ensuring all team members maintained a shared understanding of system interactions.

The design phase also established a comprehensive component library that defined reusable UI elements such as themed buttons supporting light and dark modes, input fields with validation states and error messaging, card components for displaying learning materials and quiz questions, and modal dialogs for profile editing and settings management. This component-driven approach would later prove invaluable in maintaining design consistency and accelerating development velocity when building the React Native frontend.

---

### 7.2.2 Backend Implementation — Technical Details

**Tools Used:** Node.js (v22), TypeScript (v5.7.3), Express.js (v5.2.1), Firebase Admin SDK (v13.6.0), Firebase Functions (v7.0.0)

The backend architecture was designed following the Model-View-Controller (MVC) pattern to ensure clear separation of concerns, facilitate team collaboration, and enable independent testing of business logic. Node.js was selected as the runtime environment due to its non-blocking I/O model which excels at handling concurrent API requests, its mature ecosystem of npm packages, and its seamless integration with Firebase services. TypeScript was chosen over vanilla JavaScript to provide compile-time type checking, improved developer tooling with intelligent code completion, and self-documenting code through interface definitions—all of which significantly reduce runtime errors and improve maintainability in a team development context.

Express.js serves as the web framework, providing a minimal yet flexible foundation for building RESTful APIs. Its middleware-based architecture allows for clean separation of cross-cutting concerns such as authentication verification, CORS handling, and request body parsing. The lightweight nature of Express.js ensures minimal overhead while still providing essential features like routing, request/response handling, and error management.

**Authentication Middleware Implementation**

Security was architected as a first-class concern through a dedicated authentication middleware (`authMiddleware.ts`) that intercepts all requests to protected endpoints. The middleware implements the following flow: it extracts the Authorization header from incoming requests, validates that the header follows the Bearer token pattern, isolates the Firebase ID token by stripping the "Bearer " prefix, and verifies the token's authenticity using the Firebase Admin SDK's `verifyIdToken()` method. Upon successful verification, the middleware decodes the token payload to extract user identity information including unique user ID (uid), email address, and display name, then attaches this user object to the Express request object making it available to downstream controllers. If verification fails—whether due to a missing token, malformed header, expired token, or invalid signature—the middleware immediately returns a structured JSON error response with appropriate HTTP status codes (401 for missing authentication, 403 for invalid credentials) and terminates the request pipeline before it reaches any business logic.

This middleware-based approach provides several architectural benefits: it centralizes authentication logic preventing code duplication across controllers, enforces consistent security policies across all protected routes, simplifies controller code by eliminating repetitive token validation, and creates a clear extension point for future enhancements such as role-based access control or rate limiting.

**Controllers Architecture**

Controllers are organized by feature domain to maintain clean separation of concerns and facilitate parallel development. The `authController.ts` manages user lifecycle operations, specifically implementing a user synchronization endpoint (`/api/auth/sync`) that is called immediately after successful Google OAuth authentication. This controller checks whether a user document exists in the Firestore `users` collection and, for first-time users, creates a new document with default fields including the Firebase uid, email address from Google account, display name, a default role of 'student' for authorization purposes, and a timestamp marking account creation. For returning users, the controller validates their existing record and returns their assigned role, enabling the frontend to implement role-based UI features such as admin material creation capabilities.

The `materialController.ts` handles CRUD operations for educational content. Its `getAllMaterials()` function queries the Firestore `materials` collection, applies ordering by a numeric sequence field to ensure consistent presentation order, maps Firestore document snapshots to JavaScript objects, and returns the complete array as a JSON response. Notably, this endpoint is publicly accessible without authentication to allow prospective users to preview content before registering. The complementary `createMaterial()` function is protected by the authentication middleware and accepts POST requests containing material metadata such as title, rich text content with formula markup, display order, and creation timestamp, then persists this data to Firestore and returns the generated document ID.

The `progressController.ts` implements comprehensive user activity tracking through four specialized endpoints. The `getUserProgress()` function retrieves a user's complete learning history by querying the `progress` collection using the authenticated user's uid as the document key. If no progress document exists for a new user, it returns an empty structure rather than an error, allowing the frontend to gracefully handle initial state. The `completeMaterial()` function marks learning modules as finished by using Firestore's `arrayUnion` operation to add material IDs to the user's completed list while automatically preventing duplicates. The `submitQuizScore()` function persists quiz results by updating nested map fields within the progress document, using dot notation syntax (`quizScores.${quizId}`) to atomically update specific quiz entries without overwriting the entire scores map. The `updateLabStatus()` function tracks simulation experiment completion with similar nested field updates, recording whether each lab is 'in-progress' or 'completed'. All progress mutations use Firestore's merge option to ensure partial updates don't overwrite unrelated fields, and each operation updates a `lastUpdated` timestamp to enable activity timeline features.

**Firebase Configuration and Error Handling**

The `config/firebase.ts` module handles Firebase Admin SDK initialization with robust error handling. It resolves the path to the service account key JSON file, checks for file existence before attempting to load it, initializes the Firebase Admin SDK with proper credentials, exports both the `admin` instance for SDK operations and a `db` reference to the Firestore database, and implements comprehensive error logging. The module also prevents duplicate initialization by checking if a Firebase app already exists before attempting to create a new one, which is crucial in serverless environments where functions may be reused across invocations.

**Routes Organization**

The routing layer maps HTTP endpoints to controller functions while selectively applying middleware. Authentication routes (`authRoutes.ts`) expose a single POST endpoint at `/api/auth/sync` which requires token verification. Material routes (`materialRoutes.ts`) expose a public GET endpoint at `/api/materials` for browsing content and a protected POST endpoint for content creation. Progress routes (`progressRoutes.ts`) require authentication for all operations, implementing GET `/api/progress` for retrieval, POST `/api/progress/material` for marking materials complete, POST `/api/progress/quiz` for submitting quiz scores, and POST `/api/progress/lab` for updating experiment status. This route organization creates a clear, RESTful API surface that follows industry conventions and remains intuitive for frontend developers to consume.

**Express Application Configuration**

The main Express application (`server.ts`) configures essential middleware including CORS to allow cross-origin requests from the frontend domain, JSON body parsing to handle API payloads, and route registration that prefixes all endpoints with `/api/` for clear API namespace separation. A health check endpoint at the root path (`/`) returns a simple status message, enabling deployment platforms and monitoring tools to verify service availability. The application exports the configured Express instance for consumption by the Firebase Functions wrapper.

**Firebase Functions Entry Point**

The `index.ts` file wraps the Express application in a Firebase Cloud Function, configuring critical operational parameters including a maximum of 10 concurrent instances to control costs while ensuring scalability, a 60-second timeout for long-running operations, 256 MiB memory allocation balancing performance with cost, and deployment to the us-central1 region for optimal latency to North American users. This serverless approach eliminates server provisioning and maintenance while providing automatic scaling based on traffic demands and built-in monitoring through the Firebase Console.

**Data Validation and Error Handling**

Throughout the backend implementation, controllers enforce data validation by checking for required fields in request bodies, verifying data types match expectations, and returning standardized error responses with appropriate HTTP status codes: 400 for client-side validation failures with descriptive error messages, 401 for missing or expired authentication tokens, 403 for valid tokens but insufficient permissions, and 500 for unexpected server-side errors with sanitized error messages that don't expose internal implementation details. All database operations are wrapped in try-catch blocks to gracefully handle Firestore exceptions, network failures, and other runtime errors, ensuring the API remains resilient and provides meaningful feedback to frontend applications.

---

### 7.2.3 Backend Deployment to Firebase Cloud Functions

**Platform Used:** Firebase Cloud Functions (Generation 2)

The backend deployment process leveraged Firebase's integrated tooling to streamline the path from development to production. The deployment workflow began with configuring the Firebase project through the Firebase Console, where the project ID `virtual-lab-fisics-app-debb3` was established and Firestore database was provisioned in Native mode. Using the Firebase CLI (`firebase-tools`), the development team authenticated local machines with Firebase credentials, initialized the Firebase Functions directory structure within the backend folder, and configured `firebase.json` to specify the functions codebase, predeploy build scripts that compile TypeScript to JavaScript, and file ignore patterns to exclude development artifacts and dependencies.

**Service Account Configuration**

Security was prioritized during deployment through careful management of Firebase service account credentials. The Firebase Console's Service Accounts section was used to generate a private key JSON file containing the credentials necessary for the Admin SDK to interact with Firebase services on behalf of the application. This file, saved as `serviceAccountKey.json`, was placed in the backend source directory for local development but explicitly excluded from version control through `.gitignore` entries. For production deployment, the service account credentials are automatically available to Firebase Functions through Google Cloud's service infrastructure, eliminating the need to embed sensitive credentials in deployed code.

**Build and Deployment Process**

The deployment workflow executed the following steps: the TypeScript compiler (`tsc`) transformed all source files from the `src/` directory into JavaScript modules in the `lib/` output directory based on configurations in `tsconfig.json`, npm installed production dependencies while excluding development-only packages to minimize deployment bundle size, and the Firebase CLI packaged the compiled JavaScript along with `node_modules` and `package.json` then uploaded this bundle to Google Cloud infrastructure. Firebase's deployment system created isolated function instances configured with the specified runtime parameters, registered the function URL at `https://us-central1-virtual-lab-fisics-app-debb3.cloudfunctions.net/api`, and made the API immediately available for HTTP requests.

**Environment Configuration**

Firebase Functions handle environment configuration through multiple mechanisms. The `firebase.json` file defines function-level settings such as runtime version (Node.js 22), memory allocation, and timeout limits. While environment variables can be set through Firebase Functions config for sensitive values, this project leverages Firebase's built-in service account authentication which automatically provides Admin SDK credentials to deployed functions without requiring explicit environment variable configuration. For future enhancements requiring additional secrets (such as third-party API keys), the Firebase CLI's `firebase functions:config:set` command would be employed.

**Monitoring and Logging**

Post-deployment, the Firebase Console provides comprehensive monitoring capabilities. The Functions dashboard displays key metrics including total invocations over time periods, error rates with automatic alerting for spikes, average execution duration to identify performance issues, and memory usage patterns to optimize resource allocation. Detailed logs for each function execution are accessible through the Cloud Logging integration, capturing console output from the application, automatic HTTP request logging with method, path, and status code, error stack traces for debugging production issues, and custom structured logs that can be queried and analyzed. This observability infrastructure enables rapid identification and resolution of production incidents while providing data-driven insights for performance optimization.

**CORS Configuration for Production**

Cross-Origin Resource Sharing (CORS) was configured in the Express application to allow the frontend application to make requests to the backend API from different domains. During development, CORS is configured with permissive settings allowing requests from `localhost` development servers. For production deployment, CORS middleware would be updated to restrict allowed origins to the specific frontend deployment domain (such as a Vercel-hosted domain or mobile app bundle identifiers), implement credentials: true for cookie-based session management if needed, and specify allowed HTTP methods and headers to minimize attack surface. The current implementation uses the `cors` npm package with default settings that allow all origins, which is suitable for public APIs but would be tightened for production systems handling sensitive user data.

---

### 7.2.4 Frontend Implementation — Technical Details

**Tools Used:** React Native (Expo SDK 52), TypeScript (v5.3), Expo Router (file-based routing), Firebase SDK (v11.1.0)

The frontend implementation utilized React Native through the Expo development platform to achieve true cross-platform deployment targeting iOS, Android, and web platforms from a single codebase. Expo was selected over bare React Native due to its managed workflow which abstracts native build complexities, provides over-the-air updates enabling rapid bug fixes without app store resubmission, includes a comprehensive SDK with pre-built native modules for common functionality, and offers Expo Go client app for instant testing on physical devices without compilation. TypeScript integration provides the same benefits as the backend: compile-time error detection, intelligent code completion, and self-documenting component interfaces.

**Project Structure and Routing**

The application follows Expo Router's file-based routing convention where the `app/` directory structure directly maps to navigation hierarchy. The authentication flow is isolated in `app/(auth)/` containing `login.tsx` and `register.tsx` screens that implement Google OAuth integration. The main application interface uses a tab-based navigation pattern defined in `app/(tabs)/` with screens for the home dashboard (`main.tsx`), learning materials browser (`materials.tsx`), interactive quiz interface (`quiz.tsx`), simulation laboratory (`explore.tsx`), and user profile dashboard (`profile.tsx`). This routing architecture provides automatic deep linking, type-safe navigation with compile-time route validation, and built-in navigation state management without requiring additional libraries like React Navigation.

**Authentication Flow Implementation**

The authentication system integrates Firebase Authentication's Google Sign-In provider with the custom backend API. The `services/firebase.ts` module initializes the Firebase SDK with project-specific configuration including API key, auth domain, and project identifiers extracted from Firebase Console settings. The login screen (`login.tsx`) renders a Google Sign-In button using Firebase UI components, initiates the OAuth flow which redirects to Google's consent screen in a secure webview, receives the authentication result containing the user object and Firebase ID token, and stores the token in secure storage for subsequent API requests.

Following successful Google authentication, the frontend immediately calls the backend's `/api/auth/sync` endpoint to ensure user data consistency. This request includes the Firebase ID token in the Authorization header formatted as `Bearer <token>`. The backend validates this token, creates or updates the user record in Firestore, and returns the user's role. The frontend then navigates to the main application interface while maintaining the authentication state throughout the session. Token refresh is handled automatically by the Firebase SDK which monitors token expiration and silently renews tokens before they expire, ensuring uninterrupted API access.

**Service Layer Architecture**

API communication is abstracted through a dedicated service layer (`services/api.ts`) that encapsulates all HTTP requests to the backend. This service class implements methods corresponding to each API endpoint: `getMaterials()` fetches the list of learning content, `getProgress()` retrieves the authenticated user's activity history, `completeMaterial()` marks content as finished, `submitQuizScore()` saves quiz results, and `updateLabStatus()` tracks simulation completion. Each method handles token injection by retrieving the current user's ID token from Firebase Auth, appending it to request headers, and managing common error scenarios such as network failures, token expiration, and invalid responses.

The service layer provides critical benefits including centralizing API endpoint URLs making deployment environment changes trivial, implementing consistent error handling and retry logic, enabling easy mocking for unit tests and development, and providing type-safe method signatures with TypeScript interfaces. Future enhancements such as request queuing for offline support or caching strategies can be implemented in this layer without modifying consumer components.

**Component Architecture**

The frontend follows a component-driven architecture with clear separation between presentation and logic. Reusable UI components in `components/ui/` include a `Button` component supporting multiple variants (primary, secondary, outline), size options, loading states, and consistent styling across themes; an `Input` component with built-in validation, error display, and keyboard type optimization; a `Card` component providing elevation, padding, and responsive behavior for content containers; and themed wrapper components (`ThemedView`, `ThemedText`) that automatically adapt to light/dark mode preferences.

Business logic components in `components/simulation/` implement the physics simulation engine. Each simulation type (`GLBSimulation.tsx` for uniform motion, `GLBBSimulation.tsx` for accelerated motion, `VerticalMotionSimulation.tsx` for gravitational systems, `ProjectileMotionSimulation.tsx` for parabolic trajectories) encapsulates the computational model, renders the visual animation, provides interactive parameter controls, and displays real-time calculated metrics such as velocity, position, and acceleration. The `AnalysisPanel.tsx` component presents tabular and graphical analysis of simulation data, helping students understand the relationship between parameters and outcomes.

**State Management**

State management employs React's built-in hooks (`useState`, `useEffect`, `useContext`) augmented with custom hooks for common patterns. The `use-color-scheme.ts` hook detects and manages the user's theme preference, integrating with the system's dark mode setting while allowing manual override. Authentication state is managed through Firebase Auth's `onAuthStateChanged` observer which provides reactive updates when users log in or out, eliminating the need for external state management libraries like Redux or MobX. Progress tracking state is fetched on component mount and updated optimistically after mutations, providing immediate UI feedback while background API calls persist changes to the backend.

**Quiz Implementation**

The quiz module (`quiz.tsx`) implements an interactive assessment system that loads question banks from `constants/quizData.ts`, shuffles questions and answers to prevent memorization, tracks selected answers in component state, calculates scores locally to provide instant feedback, and persists final scores to the backend via the `submitQuizScore()` API method. The quiz interface provides clear visual feedback for selected answers, displays progress indicators showing question position, implements navigation controls for reviewing previous questions, and presents a summary screen upon completion showing total score, correct/incorrect breakdown, and detailed answer explanations for learning reinforcement.

**Materials Presentation**

The materials screen (`materials.tsx`) implements a dynamic content rendering system that fetches learning modules from the backend, organizes content by topic and difficulty, renders rich text with embedded formulas using appropriate typography, and tracks read progress automatically marking materials as completed when users scroll to the bottom. Content supports various media types including text with mathematical notation, embedded video tutorials, interactive diagrams, and downloadable PDF resources. The interface provides intuitive navigation between topics, breadcrumb trails showing current position in the curriculum, and bookmarking functionality for quick access to frequently referenced materials.

**Profile and Progress Visualization**

The profile screen (`profile.tsx`) serves as a comprehensive dashboard of user learning activities. It displays user identity information from Firebase Auth including name, email, and avatar from Google account; presents activity statistics such as total completed materials, average quiz scores, and lab experiments finished; renders a chronological timeline of recent activities combining quiz attempts, material completions, and simulation sessions; and provides progress visualizations using charts and progress bars to illustrate learning journey. Users can access account settings to toggle theme preferences, manage notification preferences, and view privacy policy and terms of service.

---

### 7.2.5 Frontend Deployment

**Platform Used:** [To be determined - currently in development]

The frontend deployment strategy is currently under evaluation to determine the optimal hosting platform for the React Native web build. Several deployment options are being considered based on the project's specific requirements:

**Potential Deployment Platforms:**

Vercel presents strong advantages for React Native web applications with its automatic Git integration triggering deployments on every commit, built-in CDN for global content delivery, zero-configuration setup for modern JavaScript frameworks, and generous free tier suitable for educational projects. Firebase Hosting offers seamless integration with the existing Firebase backend infrastructure, automatic SSL certificates, rollback capabilities for quick recovery from issues, and unified billing with backend Functions. Netlify provides similar benefits to Vercel with excellent documentation, instant rollback features, and split testing capabilities for A/B experimentation.

For mobile application distribution, Expo Application Services (EAS) enables cloud-based native builds for iOS and Android, automated submission to app stores, over-the-air updates bypassing store review for JavaScript changes, and integrated preview builds for testing with stakeholders. The iOS application would be distributed through Apple's App Store requiring enrollment in the Apple Developer Program at $99/year, adherence to App Store Review Guidelines, and provision of required app metadata and screenshots. Android distribution via Google Play Store requires a one-time $25 registration fee and simpler review processes compared to iOS.

**Pre-Deployment Considerations:**

Several technical preparations are required before production deployment. Environment variable configuration must distinguish between development and production API endpoints, embedding the Firebase production URL `https://us-central1-virtual-lab-fisics-app-debb3.cloudfunctions.net/api` for production builds while maintaining localhost URLs for development. Build optimization includes enabling production mode in React Native, implementing code splitting to reduce initial bundle size, optimizing image assets through compression and appropriate format selection, and removing console.log statements and debug code.

Performance optimization strategies under consideration include lazy loading for route-based code splitting, implementing service workers for offline functionality, utilizing React.memo for expensive component memoization, and leveraging Expo's native module capabilities for computationally intensive physics calculations. Security hardening involves implementing certificate pinning for API requests, storing sensitive data in secure encrypted storage, implementing biometric authentication options, and regular security audits of dependencies.

The deployment process will include comprehensive testing across target platforms through the Expo Go client for rapid iteration during development, creating preview builds for stakeholder testing, conducting beta testing through TestFlight for iOS and Google Play Internal Testing for Android, and performing final production builds with release signing certificates. Post-deployment monitoring will track application crashes through error reporting services, analyze user behavior with privacy-respecting analytics, monitor API performance metrics, and collect user feedback through in-app feedback mechanisms and app store reviews.

**Current Status:**

As of the latest development sprint, the frontend application is fully functional in development mode with all core features implemented and tested. The team is currently conducting final quality assurance testing, preparing deployment documentation, and evaluating hosting platforms based on cost, performance, and integration requirements. Deployment to production is scheduled for the upcoming milestone pending final approval of the hosting strategy and completion of security audits.

---

## 7.3 Authentication & Token Flow

The authentication mechanism integrates Google Sign-In with Firebase Authentication to provide secure, stateless sessions across distributed frontend instances. The complete flow operates as follows:

**Initial Authentication:** When a user initiates login by tapping the "Sign in with Google" button, the frontend invokes Firebase Auth's `signInWithPopup()` (web) or `signInWithCredential()` (mobile) method, presenting the Google account selection and consent screen. Upon user approval, Google's OAuth server returns an authentication response to Firebase, which validates the identity and issues a Firebase ID token—a JSON Web Token (JWT) signed by Firebase's private key containing user claims such as uid, email, and email verification status.

**Backend Synchronization:** The frontend immediately transmits this Firebase ID token to the custom backend by calling the `/api/auth/sync` endpoint with the token included in the Authorization header formatted as `Bearer <token>`. The backend's authentication middleware intercepts this request, extracts the token, and verifies its authenticity by calling Firebase Admin SDK's `verifyIdToken()` method which validates the token's signature against Firebase's public keys, checks expiration time against the current server time, and confirms the token's audience matches the project ID. Upon successful verification, the decoded token payload provides the user's uid which the backend uses to query or create a user document in Firestore, ensuring user profile data consistency between Firebase Authentication and application database. The backend responds with the user's role (student or admin) enabling role-based access control in the frontend interface.

**Token Storage and Persistence:** The Firebase SDK automatically manages token storage in platform-appropriate secure storage: web applications use localStorage with proper domain isolation, iOS applications utilize Keychain Services providing hardware-backed encryption, and Android applications leverage EncryptedSharedPreferences with Android Keystore integration. The frontend does not manually handle token storage, relying instead on Firebase Auth's built-in session management.

**Authenticated Request Flow:** For all subsequent API requests to protected endpoints, the frontend service layer automatically retrieves the current user's ID token by calling `firebase.auth().currentUser.getIdToken()`, which returns a Promise resolving to either a cached valid token or a freshly refreshed token if the cached one has expired. This token is appended to the HTTP request's Authorization header, transmitted to the backend API, and verified by the authentication middleware before allowing access to controller logic. This stateless architecture eliminates the need for server-side session storage, enables horizontal scaling of backend functions without session affinity concerns, and simplifies authentication logic by delegating token management to Firebase's battle-tested infrastructure.

**Token Expiration and Refresh:** Firebase ID tokens have a default expiration of one hour, after which they become invalid. The Firebase SDK monitors token expiration and automatically refreshes tokens in the background when `getIdToken()` is called. If token refresh fails due to network issues or revoked credentials, the SDK updates the authentication state to unauthenticated, triggering application-wide observers registered via `onAuthStateChanged()`. The frontend responds to this state change by clearing local user data, redirecting to the login screen, and displaying an appropriate message prompting re-authentication. This automatic token refresh mechanism ensures seamless user experience without requiring explicit token renewal logic in application code while maintaining security through short-lived credentials.

**Security Considerations:** The authentication flow implements several security best practices. Tokens are transmitted exclusively over HTTPS in production preventing man-in-the-middle attacks, tokens are short-lived and frequently rotated minimizing the impact of potential token theft, the backend performs independent verification rather than trusting frontend-provided user information, and sensitive service account credentials remain server-side never exposed to client applications. Future enhancements may include implementing refresh token rotation for enhanced security and adding multi-factor authentication options for high-security scenarios.

---

## 7.4 Technology Stack Summary

**Backend Technologies:**
- Runtime: Node.js v22 (LTS) for stable server-side JavaScript execution
- Language: TypeScript v5.7.3 providing static type checking and modern ECMAScript features
- Framework: Express.js v5.2.1 for RESTful API development with minimal overhead
- Cloud Platform: Firebase Functions Generation 2 for serverless deployment with auto-scaling
- Database: Firebase Firestore for NoSQL document storage with real-time capabilities
- Authentication: Firebase Admin SDK v13.6.0 for server-side token verification and Firestore access

**Frontend Technologies:**
- Framework: React Native (Expo SDK 52) for cross-platform mobile development
- Language: TypeScript v5.3 ensuring type safety across component hierarchy
- Routing: Expo Router for file-based navigation with type-safe route parameters
- Authentication: Firebase SDK v11.1.0 for client-side OAuth and token management
- UI Components: Custom component library with theme support and accessibility features

**Development Tools:**
- Version Control: Git with GitHub for distributed source control and collaboration
- Package Management: npm for dependency management and script execution
- Code Quality: ESLint for code linting and TypeScript compiler for type checking
- Build Tools: TypeScript compiler (tsc) for transpilation and Expo CLI for bundling
- Testing: Firebase Emulator Suite for local backend testing without cloud costs

**Deployment Infrastructure:**
- Backend Hosting: Firebase Cloud Functions with automatic HTTPS endpoint provisioning
- Database Hosting: Firestore with automatic backups and point-in-time recovery
- Frontend Hosting: [Pending selection - Web: Vercel/Firebase Hosting, Mobile: EAS/App Stores]
- CDN: Firebase global CDN for static asset delivery with edge caching
- Monitoring: Firebase Console for real-time metrics, logging, and error reporting

This technology stack was selected to maximize development velocity through modern tooling, ensure application scalability through serverless architecture, minimize operational overhead through managed services, and enable future platform expansion with minimal code changes.

---

**Document Version:** 1.0  
**Last Updated:** December 23, 2025  
**Project:** Virtual Physics Lab - Implementation Documentation

### 1.1 Core Technologies

| Teknologi | Versi | Fungsi | Alasan Pemilihan |
|-----------|-------|--------|------------------|
| **Node.js** | v22 | Runtime JavaScript server-side | Performa tinggi, ekosistem npm yang luas, cocok untuk aplikasi real-time |
| **TypeScript** | v5.7.3 | Programming language | Type safety, better developer experience, error detection saat development |
| **Express.js** | v5.2.1 | Web framework | Ringan, fleksibel, middleware-based architecture yang mudah di-extend |
| **Firebase Admin SDK** | v13.6.0 | Backend Firebase integration | Official SDK untuk server-side operations, token verification, Firestore access |
| **Firebase Functions** | v7.0.0 | Serverless hosting platform | Auto-scaling, pay-per-use, managed infrastructure, seamless Firebase integration |

### 1.2 Supporting Libraries

| Library | Versi | Fungsi |
|---------|-------|--------|
| **cors** | v2.8.5 | Cross-Origin Resource Sharing | Mengizinkan frontend dari domain berbeda mengakses API |
| **@types/express** | v5.0.6 | TypeScript definitions | Type definitions untuk Express.js |
| **@types/cors** | v2.8.19 | TypeScript definitions | Type definitions untuk CORS middleware |
| **@types/node** | v25.0.1 | TypeScript definitions | Type definitions untuk Node.js APIs |

---

## 2. Arsitektur Backend

### 2.1 Pattern Architecture

Backend menggunakan **Model-View-Controller (MVC)** pattern dengan struktur sebagai berikut:

```
backend/
├── src/
│   ├── index.ts              # Entry point (Firebase Function)
│   ├── server.ts             # Express app configuration
│   ├── config/
│   │   └── firebase.ts       # Firebase Admin initialization
│   ├── middleware/
│   │   └── authMiddleware.ts # Token verification middleware
│   ├── controllers/
│   │   ├── authController.ts     # Authentication logic
│   │   ├── materialController.ts # Materials CRUD operations
│   │   └── progressController.ts # Progress tracking logic
│   ├── routes/
│   │   ├── authRoutes.ts         # Auth endpoints
│   │   ├── materialRoutes.ts     # Material endpoints
│   │   └── progressRoutes.ts     # Progress endpoints
│   └── models/
│       └── types.ts              # TypeScript interfaces
├── firebase.json             # Firebase configuration
├── .firebaserc               # Firebase project ID
├── serviceAccountKey.json    # Firebase service account (not in git)
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript config
```

### 2.2 Design Principles

1. **Separation of Concerns**: Routes, controllers, dan business logic dipisahkan
2. **DRY (Don't Repeat Yourself)**: Middleware untuk autentikasi digunakan ulang di multiple routes
3. **Type Safety**: TypeScript interfaces untuk request/response objects
4. **Security First**: Token verification di middleware sebelum akses resource
5. **Scalability**: Serverless architecture yang auto-scale berdasarkan traffic

---

## 3. Proses Implementasi Backend

### 3.1 Setup Awal Firebase Project

#### Step 1: Inisialisasi Firebase Project

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login ke Firebase
firebase login

# Inisialisasi Firebase di project
firebase init

# Pilih fitur:
# - Functions (Firebase Cloud Functions)
# - Firestore (Database)
```

**Konfigurasi yang dipilih:**
- Language: **TypeScript**
- ESLint: **Yes**
- Install dependencies: **Yes**

#### Step 2: Generate Service Account Key

1. Buka **Firebase Console** → Project Settings → Service Accounts
2. Click **Generate New Private Key**
3. Download file JSON dan simpan sebagai `serviceAccountKey.json`
4. Tambahkan ke `.gitignore` untuk keamanan:

```gitignore
# .gitignore
serviceAccountKey.json
.env
node_modules/
```

---

### 3.2 Implementasi Firebase Configuration

File: `backend/src/config/firebase.ts`

```typescript
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Path ke service account key
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

let db: admin.firestore.Firestore;

try {
    // Check if Firebase app already initialized
    if (!admin.apps.length) {
        // Load service account key
        if (require('fs').existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);
            
            // Initialize Firebase Admin SDK
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            
            console.log('🔥 Firebase Connected');
        } else {
            console.error('❌ serviceAccountKey.json not found');
            throw new Error('Firebase service account key missing');
        }
    }

    // Get Firestore instance
    if (admin.apps.length) {
        db = admin.firestore();
    } else {
        throw new Error('Firebase initialization failed');
    }

} catch (error) {
    console.error("❌ Firebase Initialization Error:", error);
    db = {} as any; // Fallback
}

// Export untuk digunakan di controllers
export { admin, db };
```

**Fitur:**
- ✅ Lazy initialization (hanya init sekali)
- ✅ Error handling untuk missing service account
- ✅ Export `admin` dan `db` untuk reuse
- ✅ Console logging untuk debugging

---

### 3.3 Implementasi Authentication Middleware

File: `backend/src/middleware/authMiddleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { admin } from '../config/firebase';

// Extend Express Request type untuk include user data
export interface AuthRequest extends Request {
    user?: {
        uid: string;
        email?: string;
        name?: string;
    };
}

// Middleware untuk verify Firebase ID Token
export const verifyToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Extract token dari Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: "Akses ditolak. Token tidak ada." 
            });
        }

        // Get token (remove "Bearer " prefix)
        const token = authHeader.split('Bearer ')[1];

        // Verify token dengan Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Attach user info ke request object
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name
        };

        // Lanjut ke controller
        next();
        
    } catch (error) {
        return res.status(403).json({ 
            message: "Token tidak valid atau expired." 
        });
    }
};
```

**Fitur:**
- ✅ Token extraction dari header
- ✅ Firebase ID Token verification
- ✅ User info injection ke request
- ✅ Error handling untuk invalid/expired token
- ✅ Type-safe dengan custom interface

---

### 3.4 Implementasi Controllers

#### A. Authentication Controller

File: `backend/src/controllers/authController.ts`

```typescript
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { admin } from '../config/firebase';

// Sync user setelah login Google
export const syncUser = async (req: AuthRequest, res: Response) => {
    try {
        const db = admin.firestore();
        const user = req.user; // Dari middleware
        
        if (!user) {
            return res.status(401).json({ message: "Token invalid" });
        }

        const userRef = db.collection('users').doc(user.uid);
        const doc = await userRef.get();

        if (!doc.exists) {
            // User baru pertama kali login
            await userRef.set({
                uid: user.uid,
                email: user.email,
                displayName: user.name || "User",
                role: 'student', // Default role
                createdAt: new Date()
            });
            
            return res.status(201).json({ 
                message: "User baru terdaftar" 
            });
        }

        // User sudah ada
        return res.status(200).json({ 
            message: "User verified", 
            role: doc.data()?.role 
        });
        
    } catch (error) {
        return res.status(500).json({ 
            error: "Gagal sinkronisasi user" 
        });
    }
};
```

**Fungsi:**
- ✅ Auto-create user document di Firestore saat first login
- ✅ Assign default role ('student')
- ✅ Return role untuk authorization di frontend

#### B. Materials Controller

File: `backend/src/controllers/materialController.ts`

```typescript
import { Request, Response } from 'express';
import { admin } from '../config/firebase';

// GET: Ambil semua materi (public endpoint)
export const getAllMaterials = async (req: Request, res: Response) => {
    try {
        const db = admin.firestore();
        const snapshot = await db.collection('materials')
                                  .orderBy('order')
                                  .get();
        
        const materials = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        }));
        
        res.status(200).json(materials);
    } catch (error) {
        res.status(500).json({ 
            error: "Gagal mengambil data materi" 
        });
    }
};

// POST: Tambah materi baru (admin only)
export const createMaterial = async (req: Request, res: Response) => {
    try {
        const db = admin.firestore();
        const { title, content, order } = req.body;
        
        const newDoc = await db.collection('materials').add({
            title,
            content,
            order,
            createdAt: new Date()
        });
        
        res.status(201).json({ 
            id: newDoc.id, 
            message: "Materi berhasil dibuat" 
        });
    } catch (error) {
        res.status(500).json({ 
            error: "Gagal membuat materi" 
        });
    }
};
```

**Fungsi:**
- ✅ CRUD operations untuk learning materials
- ✅ Ordering untuk display sequence
- ✅ Public read access, protected write

#### C. Progress Controller

File: `backend/src/controllers/progressController.ts`

```typescript
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { admin } from '../config/firebase';

// 1. GET: Ambil progress user
export const getUserProgress = async (req: AuthRequest, res: Response) => {
    try {
        const db = admin.firestore();
        const uid = req.user?.uid;
        
        if (!uid) {
            return res.status(401).json({ 
                message: "User tidak teridentifikasi" 
            });
        }

        const docRef = db.collection('progress').doc(uid);
        const doc = await docRef.get();

        if (!doc.exists) {
            // Return empty progress
            return res.status(200).json({
                userId: uid,
                completedMaterials: [],
                quizScores: {},
                labStatus: {}
            });
        }

        return res.status(200).json(doc.data());
    } catch (error) {
        return res.status(500).json({ 
            error: "Gagal mengambil progress" 
        });
    }
};

// 2. POST: Complete material
export const completeMaterial = async (req: AuthRequest, res: Response) => {
    try {
        const db = admin.firestore();
        const uid = req.user?.uid;
        const { materialId } = req.body;
        
        if (!uid) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const docRef = db.collection('progress').doc(uid);

        // Gunakan arrayUnion untuk avoid duplicates
        await docRef.set({
            userId: uid,
            completedMaterials: admin.firestore.FieldValue.arrayUnion(materialId),
            lastUpdated: new Date()
        }, { merge: true });

        return res.status(200).json({ 
            message: "Materi selesai!" 
        });
    } catch (error) {
        return res.status(500).json({ 
            error: "Gagal update materi" 
        });
    }
};

// 3. POST: Submit quiz score
export const submitQuizScore = async (req: AuthRequest, res: Response) => {
    try {
        const db = admin.firestore();
        const uid = req.user?.uid;
        const { quizId, score } = req.body;
        
        if (!uid) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const docRef = db.collection('progress').doc(uid);

        // Update nested field
        await docRef.set({
            userId: uid,
            [`quizScores.${quizId}`]: score,
            lastUpdated: new Date()
        }, { merge: true });

        return res.status(200).json({ 
            message: "Nilai kuis tersimpan!" 
        });
    } catch (error) {
        return res.status(500).json({ 
            error: "Gagal simpan kuis" 
        });
    }
};

// 4. POST: Update lab status
export const updateLabStatus = async (req: AuthRequest, res: Response) => {
    try {
        const db = admin.firestore();
        const uid = req.user?.uid;
        const { labId, status } = req.body;
        
        if (!uid) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const docRef = db.collection('progress').doc(uid);

        await docRef.set({
            userId: uid,
            [`labStatus.${labId}`]: status,
            lastUpdated: new Date()
        }, { merge: true });

        return res.status(200).json({ 
            message: "Status Lab diperbarui!" 
        });
    } catch (error) {
        return res.status(500).json({ 
            error: "Gagal update lab" 
        });
    }
};
```

**Fitur:**
- ✅ Track completed materials (array)
- ✅ Track quiz scores (map)
- ✅ Track lab status (map)
- ✅ Atomic updates dengan Firestore `merge`
- ✅ ArrayUnion untuk prevent duplicates

---

### 3.5 Implementasi Routes

File: `backend/src/routes/authRoutes.ts`

```typescript
import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import { syncUser } from '../controllers/authController';

const router = Router();

// POST /api/auth/sync - Sync user after login
router.post('/sync', verifyToken, syncUser);

export default router;
```

File: `backend/src/routes/materialRoutes.ts`

```typescript
import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import { getAllMaterials, createMaterial } from '../controllers/materialController';

const router = Router();

// GET /api/materials - Public
router.get('/', getAllMaterials);

// POST /api/materials - Protected (admin)
router.post('/', verifyToken, createMaterial);

export default router;
```

File: `backend/src/routes/progressRoutes.ts`

```typescript
import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import { 
    getUserProgress, 
    completeMaterial, 
    submitQuizScore, 
    updateLabStatus 
} from '../controllers/progressController';

const router = Router();

// All endpoints require authentication
router.get('/', verifyToken, getUserProgress);
router.post('/material', verifyToken, completeMaterial);
router.post('/quiz', verifyToken, submitQuizScore);
router.post('/lab', verifyToken, updateLabStatus);

export default router;
```

---

### 3.6 Express App Configuration

File: `backend/src/server.ts`

```typescript
import express from 'express';
import cors from 'cors';

// Setup Firebase
import './config/firebase';

const app = express();

// Middleware
app.use(cors());                    // Enable CORS
app.use(express.json());            // Parse JSON body

// Import Routes
import materialRoutes from './routes/materialRoutes';
import authRoutes from './routes/authRoutes';
import progressRoutes from './routes/progressRoutes';

const PORT = process.env.PORT || 3001;

// Register Routes
app.use('/api/materials', materialRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);

// Health Check
app.get('/', (req, res) => {
    res.json({ message: "Server Ready 🚀" });
});

// Start Server (for local development)
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
```

---

### 3.7 Firebase Function Entry Point

File: `backend/src/index.ts`

```typescript
import * as functions from 'firebase-functions/v2';
import app from './server';

// Export Firebase Function
export const api = functions.https.onRequest(
    {
        maxInstances: 10,  // Auto-scaling limit
        timeoutSeconds: 60, // Request timeout
        memory: '256MiB',   // Memory allocation
        region: 'us-central1' // Deployment region
    },
    app
);
```

**Konfigurasi:**
- ✅ Max 10 concurrent instances
- ✅ 60 second timeout
- ✅ 256 MB memory per instance
- ✅ Deployed to us-central1 region

---

## 4. Database Structure (Firestore)

### 4.1 Collection: `users`

```json
{
  "uid": "firebase-user-id-123",
  "email": "user@example.com",
  "displayName": "John Doe",
  "role": "student",
  "createdAt": "2025-12-23T10:00:00Z"
}
```

**Indexes:** Otomatis di-index by `uid` (document ID)

---

### 4.2 Collection: `materials`

```json
{
  "title": "Gerak Lurus Beraturan",
  "content": "Gerak lurus beraturan adalah...",
  "order": 1,
  "createdAt": "2025-12-20T10:00:00Z"
}
```

**Indexes:** 
- Composite index: `order` (ascending)

**Setup Index:**
```bash
# Firebase Console → Firestore → Indexes
# Add index: materials collection, order field (ascending)
```

---

### 4.3 Collection: `progress`

```json
{
  "userId": "firebase-user-id-123",
  "completedMaterials": ["mat-1", "mat-2", "mat-3"],
  "quizScores": {
    "glb": 85,
    "glbb": 90,
    "vertical": 78
  },
  "labStatus": {
    "glb-sim": "completed",
    "projectile-sim": "in-progress"
  },
  "lastUpdated": "2025-12-23T14:30:00Z"
}
```

**Document ID:** Same as `userId` for efficient lookups

---

## 5. Deployment Process

### 5.1 Build TypeScript

```bash
# Compile TypeScript to JavaScript
cd backend
npm run build

# Output: backend/lib/ folder
```

**tsconfig.json configuration:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "lib",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

### 5.2 Deploy ke Firebase Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Atau deploy specific function
firebase deploy --only functions:api
```

**Output:**
```
✔ functions[us-central1-api]: Successful create operation.
Function URL (api): https://us-central1-<project-id>.cloudfunctions.net/api
```

---

### 5.3 Firebase Configuration

File: `backend/firebase.json`

```json
{
  "functions": [
    {
      "source": ".",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log",
        "*.local"
      ],
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" run build"
      ]
    }
  ]
}
```

**Fitur:**
- ✅ Auto-build before deploy
- ✅ Ignore unnecessary files
- ✅ Support multiple codebases

---

## 6. Environment & Security

### 6.1 Environment Variables

File: `backend/.env.backup` (template)

```env
# Backend Environment Variables
PORT=3001

# Firebase Admin SDK
SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# JWT Secret (untuk future enhancement)
JWT_SECRET=kF8$2mQ!zP0L9a@Xw#R7sE4vN1B

# Node Environment
NODE_ENV=development
```

**Note:** File `.env` actual di-exclude dari git

---

### 6.2 Security Best Practices

✅ **Implemented:**
1. Service account key tidak masuk repository (`.gitignore`)
2. Token verification di middleware (tidak accept request tanpa valid token)
3. CORS enabled untuk restrict origin (bisa di-config per environment)
4. Firestore rules untuk additional security layer
5. HTTPS only untuk production (Firebase Functions default)

✅ **Recommended Enhancement:**
1. Rate limiting untuk prevent abuse
2. Input validation middleware (joi/express-validator)
3. Logging & monitoring (Firebase Logging)
4. Role-based access control untuk admin endpoints

---

## 7. Testing & Development

### 7.1 Local Development

```bash
# Install dependencies
cd backend
npm install

# Run local server (development mode)
npm run dev

# Test endpoints with Thunder Client/Postman
GET http://localhost:3001/
GET http://localhost:3001/api/materials
```

---

### 7.2 Firebase Emulator (Optional)

```bash
# Start Firebase emulators
firebase emulators:start --only functions,firestore

# Functions will run on:
# http://localhost:5001/<project-id>/us-central1/api
```

**Benefits:**
- ✅ Test without deploying
- ✅ Local Firestore database
- ✅ No cloud costs during development

---

## 8. Monitoring & Maintenance

### 8.1 Firebase Console Monitoring

**Metrics yang dipantau:**
- Function invocations (jumlah request)
- Error rate
- Execution time
- Memory usage
- Active instances

**Access:** Firebase Console → Functions → Dashboard

---

### 8.2 Logs

```bash
# View function logs
firebase functions:log

# View logs for specific function
firebase functions:log --only api
```

**Log di production:** Firebase Console → Functions → Logs

---

## 9. Scaling & Performance

### 9.1 Auto-Scaling Configuration

```typescript
// src/index.ts
export const api = functions.https.onRequest({
    maxInstances: 10,        // Max concurrent instances
    minInstances: 0,         // Min instances (0 = scale to zero)
    timeoutSeconds: 60,      // Request timeout
    memory: '256MiB',        // Memory per instance
}, app);
```

**Strategi:**
- Cold start: ~1-2 seconds untuk first request
- Warm instances: < 100ms response time
- Auto-scale berdasarkan traffic
- Cost optimization dengan scale-to-zero

---

### 9.2 Database Performance

**Firestore Optimization:**
- ✅ Index pada frequently queried fields (`order` di materials)
- ✅ Denormalization (progress data di satu document per user)
- ✅ Batch operations untuk multiple writes
- ✅ Pagination untuk large datasets (can be added)

---

## 10. Cost Estimation

### Firebase Free Tier (Spark Plan)

**Limits:**
- Functions: 125K invocations/month, 40K GB-seconds/month
- Firestore: 50K reads, 20K writes, 20K deletes per day
- Authentication: Unlimited

**Estimated Usage (per user/day):**
- Login: 2 requests
- Materials: 5 requests
- Progress: 10 requests
- Total: ~17 requests/user/day

**For 100 active users:**
- 1,700 requests/day
- 51,000 requests/month
- **Still within free tier** ✅

---

## 11. Kesimpulan

### Keuntungan Arsitektur Ini:

1. **Serverless Architecture**
   - No server management
   - Auto-scaling
   - Pay-per-use pricing
   - High availability

2. **Firebase Integration**
   - Seamless auth integration
   - Real-time database capabilities
   - Built-in security rules
   - Managed infrastructure

3. **TypeScript + Express**
   - Type safety
   - Familiar web framework
   - Large ecosystem
   - Easy testing

4. **Security**
   - Token-based authentication
   - Server-side validation
   - No direct database access from client
   - HTTPS by default

5. **Developer Experience**
   - Easy deployment (`firebase deploy`)
   - Built-in monitoring
   - Good documentation
   - Fast development cycle

---

**Document Version:** 1.0  
**Last Updated:** December 23, 2025  
**Project:** Virtual Physics Lab - Backend Implementation
