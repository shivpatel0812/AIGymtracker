# GymApp

A React Native fitness tracking application built with Expo and Firebase.

## Features

- **Workout Tracking**: Log exercises with sets, reps, and weights
- **Split Management**: Choose from predefined workout splits (PPL, Upper/Lower, Full Body) or create custom ones
- **Progress History**: View and analyze your workout history
- **Firebase Authentication**: Secure user accounts with email/password authentication
- **User Profiles**: Manage your account and view workout statistics

## Firebase Authentication

The app now includes Firebase Authentication with the following features:

- **Sign Up**: Create new accounts with email, password, and display name
- **Sign In**: Authenticate existing users
- **Password Reset**: Reset forgotten passwords via email
- **User Profiles**: View account information and manage settings
- **Sign Out**: Secure logout functionality

### Authentication Flow

1. **Login Screen**: Users can switch between Sign In, Sign Up, and Password Reset modes
2. **Account Access**: Click the account icon in any screen header to access your profile
3. **Profile Management**: View account details, app settings, and sign out
4. **Secure Navigation**: All workout screens are protected behind authentication

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `env.example` to `.env` and fill in your Firebase configuration
4. Start the development server: `npm start`

## Firebase Configuration

Ensure your Firebase project has Authentication enabled with Email/Password sign-in method. The app will automatically use the configuration from your environment variables.

## Dependencies

- React Native with Expo
- Firebase (Authentication, Firestore)
- React Navigation
- React Native Paper
- Zustand for state management
- AsyncStorage for local persistence

## Project Structure

```
src/
├── components/          # Reusable UI components
├── config/             # Environment and configuration
├── contexts/           # React contexts (Auth, etc.)
├── screens/            # App screens
├── services/           # Firebase and API services
├── store/              # State management
└── types/              # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
