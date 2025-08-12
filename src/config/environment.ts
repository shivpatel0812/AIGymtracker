export const ENV = {
  // Firebase Configuration
  FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  FIREBASE_AUTH_DOMAIN:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  FIREBASE_PROJECT_ID:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  FIREBASE_STORAGE_BUCKET:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  FIREBASE_MESSAGING_SENDER_ID:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "your-messaging-sender-id",
  FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "your-app-id",

  // App Configuration
  APP_NAME: "GymApp",
  APP_VERSION: "1.0.0",

  // Feature Flags
  ENABLE_ANONYMOUS_AUTH: true,
  ENABLE_OFFLINE_CACHE: true,
  ENABLE_PUSH_NOTIFICATIONS: false,
};

// Debug: Log environment loading
console.log("Environment variables loaded:", {
  FIREBASE_PROJECT_ID: ENV.FIREBASE_PROJECT_ID,
  FIREBASE_AUTH_DOMAIN: ENV.FIREBASE_AUTH_DOMAIN,
  FIREBASE_STORAGE_BUCKET: ENV.FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: ENV.FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: ENV.FIREBASE_APP_ID,
});
