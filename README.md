
## Virtual Physics Lab
A cross-platform (iOS, Android, Web) physics education application built with React Native and Expo.

### Virtual Lab - Physics Simulations
- **GLB (Uniform Linear Motion)** - Constant velocity simulation
- **GLBB (Uniformly Accelerated Motion)** - Acceleration/deceleration simulation
- **Vertical Motion** - Free fall and upward throw simulation
- **Projectile Motion** - 2D parabolic trajectory simulation
- **Real-time Analysis** - Interactive graphs and data panels

### Learning & Assessment
- **Interactive Modules** - Expandable learning cards with physics concepts
- **Adaptive Quizzes** - 40+ questions across multiple topics
- **Progress Tracking** - Detailed history and score analysis via User Profile

## Tech Stack

- **Frontend**: React Native, Expo (SDK 54), Reanimated, Expo Router
- **Backend**: Node.js (Express), Firebase Functions, Firestore
- **Deployment**: Vercel (Web), EAS (Mobile)

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
.
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers (MVC)
│   │   ├── models/         # Database models & types
│   │   ├── routes/         # API endpoints
│   └── ENV_SETUP.md        # Configuration guide
├── frontend/
│   ├── app/                # Expo Router screens
│   ├── components/
│   │   ├── simulation/     # Physics simulation modules
│   │   └── ui/             # Reusable UI components
│   └── services/           # API integration
├── docs/                   # UML Diagrams & Report
└── README.md
```

