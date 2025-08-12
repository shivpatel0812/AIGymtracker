const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Initialize Firebase Admin (you'll need to update the path to your service account key)
const serviceAccount = require("/Users/shivpatel/Downloads/gymapp-5cb9b-firebase-adminsdk-fbsvc-754b066dc1.json"); // Update this path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Test user ID - change this to your actual user ID for testing
const TEST_USER_ID = "HFDRdOwFJZS1Pn7Yct1FoCcGGeV2"; // UPDATE THIS WITH YOUR ACTUAL USER ID

async function uploadNutritionData() {
  console.log("📊 Uploading nutrition data...");

  const nutritionPath = "./backend/vegetarian_15_day_nutrition.json";
  const nutritionData = JSON.parse(fs.readFileSync(nutritionPath, "utf8"));

  const batch = db.batch();

  for (const dayData of nutritionData) {
    for (let i = 0; i < dayData.foods.length; i++) {
      const food = dayData.foods[i];

      // Create FoodEntry in Firebase format
      const foodEntryRef = db
        .collection(`users/${TEST_USER_ID}/foodEntries`)
        .doc();

      // Convert date to ISO timestamp (add random time within the day)
      const randomHour = Math.floor(Math.random() * 14) + 7; // 7AM to 9PM
      const randomMinute = Math.floor(Math.random() * 60);
      const createdAtISO = `${dayData.date}T${randomHour
        .toString()
        .padStart(2, "0")}:${randomMinute.toString().padStart(2, "0")}:00.000Z`;

      const foodEntry = {
        createdAtISO: createdAtISO,
        imageUrl: `https://example.com/food-images/food-${Date.now()}-${i}.jpg`, // Dummy image URL
        imageStoragePath: `users/${TEST_USER_ID}/food/food-${Date.now()}-${i}.jpg`,
        description: food.name,
        macros: {
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
        },
      };

      batch.set(foodEntryRef, foodEntry);
    }
  }

  await batch.commit();
  console.log("✅ Nutrition data uploaded successfully!");
}

async function uploadWorkoutData() {
  console.log("🏋️ Uploading workout data...");

  const workoutPath = "./backend/3_week_pplpp_schedule.json";
  const workoutData = JSON.parse(fs.readFileSync(workoutPath, "utf8"));

  const batch = db.batch();

  for (const dayData of workoutData) {
    // Skip rest days or days without exercises
    if (
      dayData.workout_type === "Rest" ||
      !dayData.exercises ||
      dayData.exercises.length === 0
    ) {
      continue;
    }

    const workoutRef = db.collection(`users/${TEST_USER_ID}/workouts`).doc();

    // Convert exercises to Firebase format
    const exercises = dayData.exercises.map((exercise) => ({
      exerciseId: exercise.name.toLowerCase().replace(/\s+/g, "-"),
      name: exercise.name,
      variant: null,
      sets: exercise.sets.map((set, index) => ({
        index: index,
        weight: exercise.weight,
        reps: set.reps,
        rpe: null,
        isWarmup: false,
        note: null,
      })),
    }));

    const workout = {
      dateISO: dayData.date,
      dayType: dayData.workout_type,
      notes: null,
      exercises: exercises,
    };

    batch.set(workoutRef, workout);
  }

  await batch.commit();
  console.log("✅ Workout data uploaded successfully!");
}

async function uploadHydrationData() {
  console.log("💧 Uploading hydration data...");

  const hydrationPath = "./backend/hydration_data_15_days.json";
  const hydrationData = JSON.parse(fs.readFileSync(hydrationPath, "utf8"));

  const batch = db.batch();

  for (const dayData of hydrationData) {
    const hydrationRef = db
      .collection(`users/${TEST_USER_ID}/hydration`)
      .doc(dayData.date);

    const hydrationEntry = {
      date: dayData.date,
      water_intake: dayData.water_intake,
      hydration_quality: dayData.hydration_quality,
    };

    batch.set(hydrationRef, hydrationEntry);
  }

  await batch.commit();
  console.log("✅ Hydration data uploaded successfully!");
}

async function uploadStressData() {
  console.log("😰 Uploading stress data...");

  const stressPath = "./backend/stress_data_15_days.json";
  const stressData = JSON.parse(fs.readFileSync(stressPath, "utf8"));

  const batch = db.batch();

  for (const dayData of stressData) {
    const stressRef = db
      .collection(`users/${TEST_USER_ID}/stress`)
      .doc(dayData.date);

    const stressEntry = {
      date: dayData.date,
      stress_level: dayData.stress_level,
      stress_factors: dayData.stress_factors,
    };

    batch.set(stressRef, stressEntry);
  }

  await batch.commit();
  console.log("✅ Stress data uploaded successfully!");
}

async function uploadSleepData() {
  console.log("😴 Uploading sleep data...");

  const sleepPath = "./backend/sleep_data_15_days.json";
  const sleepData = JSON.parse(fs.readFileSync(sleepPath, "utf8"));

  // Note: Your current app doesn't have a sleep collection, but we'll add it for completeness
  const batch = db.batch();

  for (const dayData of sleepData) {
    const sleepRef = db
      .collection(`users/${TEST_USER_ID}/sleep`)
      .doc(dayData.date);

    const sleepEntry = {
      date: dayData.date,
      sleep_hours: dayData.sleep_hours,
      sleep_quality: dayData.sleep_quality,
    };

    batch.set(sleepRef, sleepEntry);
  }

  await batch.commit();
  console.log("✅ Sleep data uploaded successfully!");
}

async function clearTestData() {
  console.log("🧹 Clearing existing test data...");

  const collections = [
    "foodEntries",
    "workouts",
    "hydration",
    "stress",
    "sleep",
  ];

  for (const collection of collections) {
    const snapshot = await db
      .collection(`users/${TEST_USER_ID}/${collection}`)
      .get();
    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    if (!snapshot.empty) {
      await batch.commit();
    }
  }

  console.log("✅ Test data cleared!");
}

async function main() {
  try {
    console.log(`🚀 Starting test data upload for user: ${TEST_USER_ID}`);
    console.log(
      "Make sure to update TEST_USER_ID and Firebase service account path!"
    );

    // Clear existing test data first
    await clearTestData();

    // Upload all test data
    await uploadNutritionData();
    await uploadWorkoutData();
    await uploadHydrationData();
    await uploadStressData();
    await uploadSleepData();

    console.log("🎉 All test data uploaded successfully!");
    console.log(`You can now test the full flow with user ID: ${TEST_USER_ID}`);
  } catch (error) {
    console.error("❌ Error uploading test data:", error);
  } finally {
    // Close the Firebase connection
    admin.app().delete();
  }
}

// Run the upload
main();
