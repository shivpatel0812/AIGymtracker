# GymApp

A comprehensive fitness tracking application with React Native frontend, Spring Boot API, Python AI backend, and Firebase integration.

## 🏗️ Architecture

- **Frontend**: React Native with Expo
- **API Layer**: Spring Boot REST API
- **AI Backend**: Python-based workout analysis
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth

## ✨ Features

- **Workout Tracking**: Log exercises with sets, reps, and weights
- **Split Management**: Choose from predefined workout splits (PPL, Upper/Lower, Full Body) or create custom ones
- **Progress History**: View and analyze your workout history
- **Nutrition Tracking**: Log food entries with macro tracking
- **Health Metrics**: Monitor hydration, stress, and sleep
- **AI-Powered Analysis**: Get insights from your workout data
- **Firebase Authentication**: Secure user accounts with email/password authentication
- **User Profiles**: Manage your account and view workout statistics

## 🚀 Quick Start

### Frontend Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `env.example` to `.env` and fill in your Firebase configuration
4. Start the development server: `npm start`

### Backend Setup

1. **Spring Boot API**:

   ```bash
   cd spring-api
   ./mvnw spring-boot:run
   ```

2. **Python AI Backend**:
   ```bash
   cd backend
   export OPENAI_API_KEY="your-key"
   python main.py
   ```

### Test Data Setup

1. Update `TEST_USER_ID` in `test-data-uploader.js`
2. Add your Firebase service account key
3. Run: `./upload-test-data.sh`

## 🔧 Configuration

### Firebase

- Enable Authentication with Email/Password
- Set up Firestore database
- Configure service account for backend access

### Environment Variables

- `OPENAI_API_KEY`: Required for AI analysis
- Firebase config in frontend `.env`

## 📁 Project Structure

```
gymapp/
├── src/                          # React Native frontend
│   ├── components/               # Reusable UI components
│   ├── config/                   # Environment and configuration
│   ├── contexts/                 # React contexts (Auth, etc.)
│   ├── screens/                  # App screens
│   ├── services/                 # Firebase and API services
│   ├── store/                    # State management
│   └── types/                    # TypeScript type definitions
├── spring-api/                   # Spring Boot REST API
│   ├── src/main/java/           # Java source code
│   └── pom.xml                  # Maven dependencies
├── backend/                      # Python AI backend
│   ├── core/                    # Core functionality
│   ├── data/                    # Data handling
│   ├── metrics/                 # Analytics and metrics
│   ├── config/                  # Configuration
│   └── main.py                  # Main application driver
├── test-data-uploader.js        # Firebase test data uploader
└── README-test-data.md          # Test data documentation
```

## 🔌 API Endpoints

### Spring Boot API (`localhost:8080`)

- `POST /api/analysis/test-formatted-data` - Get formatted test data
- `POST /api/analysis/comprehensive` - Run full AI analysis

### Python Backend

- Workout analysis and metrics calculation
- AI-powered insights and recommendations

## 📊 Test Data

The app includes comprehensive test data for development:

- **Nutrition**: 15-day vegetarian meal plan
- **Workouts**: 3-week PPL++ schedule
- **Health**: Hydration, stress, and sleep tracking

See [README-test-data.md](README-test-data.md) for detailed setup instructions.

## 🧪 Testing

1. **Frontend**: Test with uploaded Firebase data
2. **API Integration**: Verify data flow between components
3. **AI Pipeline**: Test workout analysis with real data

## 📚 Dependencies

### Frontend

- React Native with Expo
- Firebase (Authentication, Firestore)
- React Navigation
- React Native Paper
- Zustand for state management

### Backend

- Spring Boot
- Python 3.x
- OpenAI API
- Firebase Admin SDK

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
