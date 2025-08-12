# GymApp Analysis API

Spring Boot REST API that integrates your React Native frontend with your Python AI pipeline backend.

## Setup Instructions

### 1. Firebase Configuration

1. Get your Firebase service account key JSON file
2. Place it in `src/main/resources/firebase-service-account.json`
3. Update `application.properties` if you use a different filename

### 2. Configuration

Update `src/main/resources/application.properties`:

```properties
# Server configuration
server.port=8080

# Firebase configuration
firebase.service-account-key=firebase-service-account.json

# AI Pipeline configuration (update with your Python backend URL)
ai.pipeline.url=http://localhost:8000
```

### 3. Build and Run

```bash
# Build the project
mvn clean package

# Run the application
mvn spring-boot:run

# Or run the JAR directly
java -jar target/analysis-api-0.0.1-SNAPSHOT.jar
```

### 4. Test the API

```bash
# Health check
curl http://localhost:8080/api/analysis/health

# Test data retrieval
curl -X POST http://localhost:8080/api/analysis/test-data \
  -H "Content-Type: application/json" \
  -d '{"userId": "your-user-id", "dateRange": "30days"}'

# Run analysis
curl -X POST http://localhost:8080/api/analysis/comprehensive \
  -H "Content-Type: application/json" \
  -d '{"userId": "your-user-id", "dateRange": "30days"}'
```

## API Endpoints

### GET `/api/analysis/health`
- Health check endpoint

### POST `/api/analysis/comprehensive`
- Runs comprehensive analysis on all user data
- Body: `{"userId": "string", "dateRange": "7days|30days|90days|all"}`

### POST `/api/analysis/nutrition`
- Runs nutrition-specific analysis
- Body: `{"userId": "string", "dateRange": "7days|30days|90days|all"}`

### POST `/api/analysis/workout`
- Runs workout-specific analysis
- Body: `{"userId": "string", "dateRange": "7days|30days|90days|all"}`

### POST `/api/analysis/test-data`
- Returns raw Firebase data without AI analysis (for testing)
- Body: `{"userId": "string", "dateRange": "7days|30days|90days|all"}`

## Data Flow

1. **Frontend** → `"Get Analysis"` button pressed
2. **Spring API** → Retrieves user data from Firebase
3. **Spring API** → Sends data to Python AI Pipeline
4. **Python AI** → Processes data and returns analysis
5. **Spring API** → Returns analysis to frontend
6. **Frontend** → Displays results in AnalysisResultScreen

## Integration with Python Backend

The Spring Boot API formats data to match your test JSON files exactly:

### Comprehensive Analysis Endpoint
```python
POST /analyze
{
  "user_id": "string",
  "nutrition": [
    {
      "date": "2025-08-11",
      "foods": [
        {
          "name": "Chicken breast with rice",
          "calories": 450,
          "protein": 35,
          "carbs": 40,
          "fat": 8
        }
      ]
    }
  ],
  "workouts": [
    {
      "date": "2025-08-11",
      "workout_type": "Push",
      "exercises": [
        {
          "name": "Bench Press",
          "weight": 70.0,
          "sets": [
            {"set": 1, "reps": 12},
            {"set": 2, "reps": 10}
          ]
        }
      ]
    }
  ],
  "hydration": [
    {
      "date": "2025-08-11",
      "water_intake": 2.6,
      "hydration_quality": 8
    }
  ],
  "stress": [
    {
      "date": "2025-08-11",
      "stress_level": 6,
      "stress_factors": "Workload"
    }
  ]
}
```

This matches exactly the structure of your test files:
- `vegetarian_15_day_nutrition.json`
- `3_week_pplpp_schedule.json` 
- `hydration_data_15_days.json`
- `stress_data_15_days.json`

### Specialized Analysis Endpoints
```python
# Nutrition analysis
POST /nutrition/analyze
{
  "user_id": "string",
  "nutrition": [...]  # Same format as above
}

# Workout analysis  
POST /workout/analyze
{
  "user_id": "string", 
  "workouts": [...]   # Same format as above
}
```

## Frontend Integration

The React Native app now includes:
- Analysis service (`src/services/analysis.ts`)
- Analysis buttons on Dashboard
- AnalysisResultScreen for displaying results
- Navigation setup for analysis flow