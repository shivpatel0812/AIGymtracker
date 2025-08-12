#!/bin/bash

echo "🚀 Firebase Test Data Uploader"
echo "=============================="
echo ""

# Check if Firebase service account key exists
if [ ! -f "firebase-service-account-key.json" ]; then
    echo "❌ Error: firebase-service-account-key.json not found"
    echo "Please download your Firebase service account key and place it in this directory"
    echo ""
    echo "To get your service account key:"
    echo "1. Go to Firebase Console → Project Settings → Service Accounts"
    echo "2. Click 'Generate new private key'"
    echo "3. Save it as 'firebase-service-account-key.json' in this directory"
    exit 1
fi

# Check if backend JSON files exist
if [ ! -f "backend/vegetarian_15_day_nutrition.json" ]; then
    echo "❌ Error: Backend test JSON files not found"
    echo "Make sure you have the backend directory with test JSON files"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install --prefix . firebase-admin

echo ""
echo "⚠️  IMPORTANT: Update TEST_USER_ID in test-data-uploader.js"
echo "Current user ID is set to 'test-user-123'"
echo "Change it to your actual user ID for testing"
echo ""

read -p "Press Enter to continue with upload (Ctrl+C to cancel)..."

echo ""
echo "🚀 Starting upload..."
node test-data-uploader.js

echo ""
echo "✅ Upload complete!"
echo ""
echo "📱 You can now:"
echo "1. Log into your app with the test user"
echo "2. View the food log, workout history, etc."
echo "3. Test the 'Get Analysis' button on the dashboard"
echo "4. See the Spring Boot API retrieve and format this data"