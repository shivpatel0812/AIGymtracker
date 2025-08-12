# Test Data Uploader

Upload your test JSON data to Firebase so you can test the entire application flow.

## 🚀 Quick Setup

1. **Get Firebase Service Account Key**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project → Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `firebase-service-account-key.json` in this directory

2. **Update User ID**
   - Open `test-data-uploader.js`
   - Change `TEST_USER_ID = 'test-user-123'` to your actual user ID
   - You can find your user ID in Firebase Authentication console

3. **Run Upload**
   ```bash
   ./upload-test-data.sh
   ```

## 📊 What Gets Uploaded

The script transforms your test JSON files into Firebase format:

### **Nutrition Data** → `users/{userId}/foodEntries`
- `vegetarian_15_day_nutrition.json` → Individual food entries with photos
- Each food item becomes a `FoodEntry` with macros, description, timestamps
- Random timestamps throughout each day for realistic data

### **Workout Data** → `users/{userId}/workouts` 
- `3_week_pplpp_schedule.json` → Workout sessions with exercises and sets
- Converts to your app's workout format with exercises, sets, weights, reps
- Skips rest days automatically

### **Health Data** → Various collections
- `hydration_data_15_days.json` → `users/{userId}/hydration`
- `stress_data_15_days.json` → `users/{userId}/stress`
- `sleep_data_15_days.json` → `users/{userId}/sleep`

## 🧪 Testing Flow

After uploading:

1. **Frontend Testing**
   - Log into your app with the test user ID
   - View Dashboard → See macro totals calculated from food entries
   - Check Food Log → See all uploaded food entries
   - Browse History → See workout data

2. **API Testing**
   ```bash
   # Test data retrieval
   curl -X POST http://localhost:8080/api/analysis/test-formatted-data \
     -H "Content-Type: application/json" \
     -d '{"userId": "your-test-user-id", "dateRange": "30days"}'

   # Test full analysis
   curl -X POST http://localhost:8080/api/analysis/comprehensive \
     -H "Content-Type: application/json" \
     -d '{"userId": "your-test-user-id", "dateRange": "30days"}'
   ```

3. **Full Integration Test**
   - Tap "Full Analysis" button on dashboard
   - Should retrieve all uploaded data
   - Format it exactly like your test JSON files  
   - Send to Python AI pipeline
   - Display results in the app

## 🧹 Cleanup

To remove test data:
```javascript
// The uploader script includes a clearTestData() function
// It runs automatically before uploading new data
```

## 📁 File Structure

```
gymapp/
├── test-data-uploader.js          # Main upload script
├── upload-test-data.sh            # Easy run script  
├── firebase-service-account-key.json  # Your Firebase key (add this)
└── backend/
    ├── vegetarian_15_day_nutrition.json
    ├── 3_week_pplpp_schedule.json  
    ├── hydration_data_15_days.json
    ├── stress_data_15_days.json
    └── sleep_data_15_days.json
```

This lets you test the complete flow: Frontend → Spring Boot API → Python AI Pipeline with real Firebase data that matches your test JSON structure exactly!