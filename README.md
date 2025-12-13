# Virtual Physics Lab

A cross-platform (iOS, Android, Web) physics education application built with React Native and Expo.

## Features

### Virtual Lab - Physics Simulations

- **GLB (Uniform Linear Motion)** - Constant velocity simulation
- **GLBB (Uniformly Accelerated Motion)** - Acceleration/deceleration simulation
- **Vertical Motion** - Free fall and upward throw simulation
- **Projectile Motion** - 2D parabolic trajectory simulation
- Real-time analysis panel showing Time, Position (X/Y), and Velocity (X/Y)

###  Learning Materials
- Interactive expandable cards for each physics topic
- Formulas and key concepts
- Clear explanations in English

###  Interactive Quizzes
- 10 questions per topic (40 total)
- Multiple choice format
- Score calculation and result display
- Local score history with AsyncStorage

###  User Profile
- Quiz history and statistics
- Average score tracking

## Tech Stack

- **Framework**: React Native with Expo (SDK 54)
- **Navigation**: Expo Router (File-based routing)
- **Animations**: React Native Reanimated
- **Storage**: AsyncStorage (local persistence)
- **Styling**: Neumorphism design system

## Getting Started


### Installation

```bash
cd frontend
npm install
```

### Running the App

```bash
# Start development server
npx expo start

# Run on specific platform
npx expo start --web
npx expo start --ios
npx expo start --android
```

## Project Structure

```
frontend/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Authentication screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/             # Main app tabs
│   │   ├── main.tsx        # Dashboard with top navigation
│   │   ├── materials.tsx   # Learning materials
│   │   ├── quiz.tsx        # Interactive quizzes
│   │   ├── profile.tsx     # User profile
│   │   └── index.tsx       # Lab simulations
│   └── _layout.tsx         # Root layout
├── components/
│   ├── simulation/         # Physics simulation components
│   │   ├── GLBSimulation.tsx
│   │   ├── GLBBSimulation.tsx
│   │   ├── VerticalMotionSimulation.tsx
│   │   ├── ProjectileMotionSimulation.tsx
│   │   └── AnalysisPanel.tsx
│   └── ui/                 # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── icon-symbol.tsx
├── constants/
│   ├── theme.ts            # Design tokens & colors
│   └── quizData.ts         # Quiz questions database
└── assets/                 # Images, fonts, etc.

backend/
├── src/
│   ├── config/             # DB and app config
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth & validation middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes definition
│   ├── services/           # Business logic
│   ├── utils/              # Helper functions
│   └── app.ts              # App entry point
├── dist/                   # Compiled JS code
├── .env                    # Environment variables
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript config
```

