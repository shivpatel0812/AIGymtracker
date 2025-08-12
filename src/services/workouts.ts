import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  where,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Workout, ExerciseState, DayTypeState } from "../types";

export const saveWorkout = async (workout: Workout): Promise<string> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    console.log("Original workout data:", JSON.stringify(workout, null, 2));

    // Validate that no undefined values exist
    validateWorkoutData(workout);

    // Clean the workout data by removing undefined values
    const cleanWorkoutData = cleanWorkoutForFirestore(workout);
    console.log(
      "Cleaned workout data:",
      JSON.stringify(cleanWorkoutData, null, 2)
    );

    const workoutData = { ...cleanWorkoutData };
    delete workoutData.id;

    const docRef = await addDoc(
      collection(db, `users/${uid}/workouts`),
      workoutData
    );

    // Update exercise states and day type state in parallel
    await Promise.all([
      updateExerciseStates(uid, workout),
      updateDayTypeState(uid, workout),
    ]);

    return docRef.id;
  } catch (error) {
    console.error("Error saving workout:", error);
    throw new Error(
      "Failed to save workout. Please check your connection and try again."
    );
  }
};

// Helper function to clean workout data for Firestore
const cleanWorkoutForFirestore = (workout: any): any => {
  if (workout === null || workout === undefined) {
    return null;
  }

  if (Array.isArray(workout)) {
    return workout.map((item) => cleanWorkoutForFirestore(item));
  }

  if (typeof workout === "object") {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(workout)) {
      if (value !== undefined) {
        cleaned[key] = cleanWorkoutForFirestore(value);
      }
    }
    return cleaned;
  }

  return workout;
};

// Additional validation to ensure no undefined values exist
const validateWorkoutData = (workout: any): void => {
  const checkForUndefined = (obj: any, path: string = ""): void => {
    if (obj === undefined) {
      throw new Error(`Undefined value found at ${path}`);
    }

    if (obj === null) {
      return; // null is allowed
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        checkForUndefined(item, `${path}[${index}]`);
      });
    } else if (typeof obj === "object") {
      for (const [key, value] of Object.entries(obj)) {
        checkForUndefined(value, path ? `${path}.${key}` : key);
      }
    }
  };

  checkForUndefined(workout, "workout");

  // Validate required fields
  if (!workout.dateISO) {
    throw new Error("Workout dateISO is required");
  }
  if (!workout.dayType) {
    throw new Error("Workout dayType is required");
  }
  if (!Array.isArray(workout.exercises)) {
    throw new Error("Workout exercises must be an array");
  }
  if (workout.exercises.length === 0) {
    throw new Error("Workout must have at least one exercise");
  }

  // Validate optional fields if they exist
  if (
    workout.notes !== undefined &&
    workout.notes !== null &&
    typeof workout.notes !== "string"
  ) {
    throw new Error("Workout notes must be a string or null");
  }

  // Validate each exercise
  workout.exercises.forEach((exercise: any, index: number) => {
    if (!exercise.exerciseId) {
      throw new Error(`Exercise ${index}: exerciseId is required`);
    }
    if (!exercise.name) {
      throw new Error(`Exercise ${index}: name is required`);
    }
    if (!Array.isArray(exercise.sets)) {
      throw new Error(`Exercise ${index}: sets must be an array`);
    }
    if (exercise.sets.length === 0) {
      throw new Error(`Exercise ${index}: must have at least one set`);
    }

    // Validate optional fields if they exist
    if (
      exercise.variant !== undefined &&
      exercise.variant !== null &&
      typeof exercise.variant !== "string"
    ) {
      throw new Error(`Exercise ${index}: variant must be a string or null`);
    }

    // Validate each set
    exercise.sets.forEach((set: any, setIndex: number) => {
      if (typeof set.index !== "number") {
        throw new Error(
          `Exercise ${index}, Set ${setIndex}: index must be a number`
        );
      }
      if (typeof set.weight !== "number") {
        throw new Error(
          `Exercise ${index}, Set ${setIndex}: weight must be a number`
        );
      }
      if (typeof set.reps !== "number") {
        throw new Error(
          `Exercise ${index}, Set ${setIndex}: reps must be a number`
        );
      }
      if (typeof set.isWarmup !== "boolean") {
        throw new Error(
          `Exercise ${index}, Set ${setIndex}: isWarmup must be a boolean`
        );
      }

      // Validate optional fields if they exist
      if (
        set.rpe !== undefined &&
        set.rpe !== null &&
        typeof set.rpe !== "number"
      ) {
        throw new Error(
          `Exercise ${index}, Set ${setIndex}: rpe must be a number or null`
        );
      }
      if (
        set.note !== undefined &&
        set.note !== null &&
        typeof set.note !== "string"
      ) {
        throw new Error(
          `Exercise ${index}, Set ${setIndex}: note must be a string or null`
        );
      }
    });
  });

  // Additional validation for exercise state and day type state
  if (!workout.dateISO || typeof workout.dateISO !== "string") {
    throw new Error("Workout dateISO must be a valid string");
  }
  if (!workout.dayType || typeof workout.dayType !== "string") {
    throw new Error("Workout dayType must be a valid string");
  }

  // Validate that dateISO is a valid ISO date string
  try {
    const date = new Date(workout.dateISO);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date format");
    }
  } catch (dateError) {
    throw new Error("Workout dateISO must be a valid ISO date string");
  }

  // Validate that dayType is one of the allowed values
  const allowedDayTypes = ["Push", "Pull", "Legs", "Upper", "Lower", "Full"];
  if (!allowedDayTypes.includes(workout.dayType)) {
    throw new Error(
      `Workout dayType must be one of: ${allowedDayTypes.join(", ")}`
    );
  }
};

export const getWorkouts = async (): Promise<Workout[]> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  const q = query(
    collection(db, `users/${uid}/workouts`),
    orderBy("dateISO", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Workout));
};

export const getWorkoutById = async (id: string): Promise<Workout | null> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  const docRef = doc(db, `users/${uid}/workouts`, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Workout;
  }
  return null;
};

export const updateWorkout = async (workout: Workout): Promise<void> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");
  if (!workout.id) throw new Error("Workout id is required for update");

  // Validate and clean like saveWorkout
  validateWorkoutData(workout as any);
  const cleanWorkoutData = cleanWorkoutForFirestore(workout);

  const { id, ...rest } = cleanWorkoutData as any;
  const workoutRef = doc(db, `users/${uid}/workouts`, workout.id);
  await updateDoc(workoutRef, rest);

  // Keep auxiliary states in sync
  await Promise.all([
    updateExerciseStates(uid, workout),
    updateDayTypeState(uid, workout),
  ]);
};

export const getUserProfile = async (): Promise<any> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  const profileRef = doc(db, `users/${uid}/profile`, "default");
  const profileSnap = await getDoc(profileRef);

  if (profileSnap.exists()) {
    return profileSnap.data();
  }
  return null;
};

export const saveUserProfile = async (profile: any): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const uid = currentUser.uid;

  // Check if user token is still valid
  try {
    await currentUser.getIdToken(true);
  } catch (tokenError) {
    console.error("Token refresh error:", tokenError);
    throw new Error("Authentication token expired. Please sign in again.");
  }

  // Simple Firestore connectivity test
  try {
    console.log("Testing basic Firestore connectivity...");
    const testRef = doc(db, "users", uid);
    console.log("Basic document reference created successfully");
  } catch (testError) {
    console.error("Basic Firestore test failed:", testError);
    throw new Error(
      "Firestore connection failed. Please check your configuration."
    );
  }

  // Log Firestore configuration details for debugging
  console.log("Firestore database type:", db.type);
  console.log("Firestore app name:", db.app.name);
  console.log("Firestore project ID:", db.app.options.projectId);

  // Clean the profile data to remove any undefined values and ensure proper types
  const cleanProfile = {
    split: profile.split,
    dayOrder: profile.dayOrder || [],
  };

  // Validate that the data can be serialized to JSON (Firestore requirement)
  try {
    JSON.stringify(cleanProfile);
  } catch (serializeError) {
    console.error("Data serialization error:", serializeError);
    throw new Error("Invalid data format that cannot be saved to database");
  }

  // Deep validation of the data structure
  const validateData = (obj: any, path: string = ""): void => {
    if (obj === null || obj === undefined) {
      throw new Error(`Invalid value at ${path}: ${obj}`);
    }

    if (typeof obj === "object") {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        validateData(value, currentPath);
      }
    }
  };

  try {
    validateData(cleanProfile);
    console.log("Data structure validation passed");
  } catch (validationError) {
    console.error("Data structure validation failed:", validationError);
    throw new Error(
      `Data validation failed: ${(validationError as Error).message}`
    );
  }

  console.log("Saving clean profile:", cleanProfile);
  console.log(
    "Profile type check - split:",
    typeof cleanProfile.split,
    "dayOrder:",
    Array.isArray(cleanProfile.dayOrder)
  );

  // Additional validation and error handling
  if (!cleanProfile.split) {
    throw new Error("Split is required");
  }

  if (!Array.isArray(cleanProfile.dayOrder)) {
    throw new Error("Day order must be an array");
  }

  try {
    // Ensure uid is valid
    if (!uid || typeof uid !== "string" || uid.trim() === "") {
      throw new Error("Invalid user ID");
    }

    // Validate the document path
    const documentPath = `users/${uid}/profile`;
    if (documentPath.includes("undefined") || documentPath.includes("null")) {
      throw new Error("Invalid document path generated");
    }

    const profileRef = doc(db, documentPath, "default");
    console.log(
      "Attempting to save to Firestore at path:",
      `users/${uid}/profile/default`
    );
    console.log("User ID:", uid);
    console.log("Profile data being saved:", JSON.stringify(cleanProfile));
    console.log("Firestore app:", db.app.name);
    console.log("Firestore database:", db.type);

    // Try to read from the collection first to ensure it exists and we have permissions
    try {
      const testQuery = query(collection(db, `users/${uid}/profile`), limit(1));
      await getDocs(testQuery);
      console.log("Collection access verified");
    } catch (readError) {
      console.error("Collection read test failed:", readError);
      console.error(
        "Read error details:",
        (readError as any).code,
        (readError as any).message
      );
      throw new Error(
        "Cannot access user profile collection. Please check permissions."
      );
    }

    await setDoc(profileRef, cleanProfile);
    console.log("Profile saved successfully");
  } catch (error) {
    console.error("Firestore error details:", error);
    console.error("Error code:", (error as any).code);
    console.error("Error message:", (error as any).message);
    console.error("Error stack:", (error as any).stack);

    // Handle specific Firestore error codes
    const errorCode = (error as any).code;
    switch (errorCode) {
      case "permission-denied":
        throw new Error("Permission denied. Please check your authentication.");
      case "unauthenticated":
        throw new Error("User not authenticated. Please sign in again.");
      case "invalid-argument":
        throw new Error("Invalid data format. Please check your input.");
      case "not-found":
        throw new Error(
          "Collection not found. Please check your configuration."
        );
      case "already-exists":
        throw new Error("Profile already exists. Please try updating instead.");
      default:
        throw new Error(
          `Firestore error: ${
            (error as any).message || "Unknown error occurred"
          }`
        );
    }
  }
};

const updateExerciseStates = async (
  uid: string,
  workout: Workout
): Promise<void> => {
  console.log("Updating exercise states for workout:", workout.dateISO);

  for (const exercise of workout.exercises) {
    const workingSets = exercise.sets.filter((set) => !set.isWarmup);
    if (workingSets.length === 0) continue;

    const exerciseState: ExerciseState = {
      lastSession: {
        dateISO: workout.dateISO,
        dayType: workout.dayType,
        sets: workingSets.map((set) => ({
          index: set.index,
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe || null,
        })),
      },
    };

    console.log(`Exercise state for ${exercise.exerciseId}:`, exerciseState);

    // Validate the exercise state data
    try {
      validateWorkoutData(exerciseState);
    } catch (validationError) {
      console.error(
        `Validation failed for exercise ${exercise.exerciseId}:`,
        validationError
      );
      throw new Error(
        `Exercise state validation failed: ${
          (validationError as Error).message
        }`
      );
    }

    // Additional validation for exercise state specific fields
    if (
      !exerciseState.lastSession.dateISO ||
      typeof exerciseState.lastSession.dateISO !== "string"
    ) {
      throw new Error(
        `Exercise ${exercise.exerciseId}: lastSession.dateISO must be a valid string`
      );
    }
    if (
      !exerciseState.lastSession.dayType ||
      typeof exerciseState.lastSession.dayType !== "string"
    ) {
      throw new Error(
        `Exercise ${exercise.exerciseId}: lastSession.dayType must be a valid string`
      );
    }
    if (!Array.isArray(exerciseState.lastSession.sets)) {
      throw new Error(
        `Exercise ${exercise.exerciseId}: lastSession.sets must be an array`
      );
    }
    if (exerciseState.lastSession.sets.length === 0) {
      throw new Error(
        `Exercise ${exercise.exerciseId}: lastSession.sets must have at least one set`
      );
    }

    // Validate that dateISO is a valid ISO date string
    try {
      const date = new Date(exerciseState.lastSession.dateISO);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
      }
    } catch (dateError) {
      throw new Error(
        `Exercise ${exercise.exerciseId}: lastSession.dateISO must be a valid ISO date string`
      );
    }

    // Validate that dayType is one of the allowed values
    const allowedDayTypes = ["Push", "Pull", "Legs", "Upper", "Lower", "Full"];
    if (!allowedDayTypes.includes(exerciseState.lastSession.dayType)) {
      throw new Error(
        `Exercise ${
          exercise.exerciseId
        }: lastSession.dayType must be one of: ${allowedDayTypes.join(", ")}`
      );
    }

    // Validate each set in the exercise state
    exerciseState.lastSession.sets.forEach((set: any, setIndex: number) => {
      if (typeof set.index !== "number") {
        throw new Error(
          `Exercise ${exercise.exerciseId}, Set ${setIndex}: index must be a number`
        );
      }
      if (typeof set.weight !== "number") {
        throw new Error(
          `Exercise ${exercise.exerciseId}, Set ${setIndex}: weight must be a number`
        );
      }
      if (typeof set.reps !== "number") {
        throw new Error(
          `Exercise ${exercise.exerciseId}, Set ${setIndex}: reps must be a number`
        );
      }
      if (
        set.rpe !== undefined &&
        set.rpe !== null &&
        typeof set.rpe !== "number"
      ) {
        throw new Error(
          `Exercise ${exercise.exerciseId}, Set ${setIndex}: rpe must be a number or null`
        );
      }
    });

    // Clean the exercise state data before saving
    const cleanExerciseState = cleanWorkoutForFirestore(exerciseState);
    console.log(
      `Cleaned exercise state for ${exercise.exerciseId}:`,
      cleanExerciseState
    );

    const exerciseStateRef = doc(
      db,
      `users/${uid}/exercise_state`,
      exercise.exerciseId
    );
    await setDoc(exerciseStateRef, cleanExerciseState);
    console.log(`Exercise state updated for ${exercise.exerciseId}`);
  }
};

const updateDayTypeState = async (
  uid: string,
  workout: Workout
): Promise<void> => {
  console.log("Updating day type state for workout:", workout.dateISO);

  const workingSets = workout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.filter((set) => !set.isWarmup).length;
  }, 0);

  const exercisesWithWorkingSets = workout.exercises.filter((exercise) =>
    exercise.sets.some((set) => !set.isWarmup)
  ).length;

  const dayTypeState: DayTypeState = {
    lastWorkout: {
      dateISO: workout.dateISO,
      totalExercises: exercisesWithWorkingSets,
      totalWorkingSets: workingSets,
    },
  };

  console.log("Day type state:", dayTypeState);

  // Validate the day type state data
  try {
    validateWorkoutData(dayTypeState);
  } catch (validationError) {
    console.error("Day type state validation failed:", validationError);
    throw new Error(
      `Day type state validation failed: ${(validationError as Error).message}`
    );
  }

  // Additional validation for day type state specific fields
  if (
    !dayTypeState.lastWorkout.dateISO ||
    typeof dayTypeState.lastWorkout.dateISO !== "string"
  ) {
    throw new Error(
      "Day type state lastWorkout.dateISO must be a valid string"
    );
  }
  if (typeof dayTypeState.lastWorkout.totalExercises !== "number") {
    throw new Error(
      "Day type state lastWorkout.totalExercises must be a number"
    );
  }
  if (typeof dayTypeState.lastWorkout.totalWorkingSets !== "number") {
    throw new Error(
      "Day type state lastWorkout.totalWorkingSets must be a number"
    );
  }

  // Validate that dateISO is a valid ISO date string
  try {
    const date = new Date(dayTypeState.lastWorkout.dateISO);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date format");
    }
  } catch (dateError) {
    throw new Error(
      "Day type state lastWorkout.dateISO must be a valid ISO date string"
    );
  }

  // Validate that totalExercises and totalWorkingSets are non-negative
  if (dayTypeState.lastWorkout.totalExercises < 0) {
    throw new Error(
      "Day type state lastWorkout.totalExercises must be non-negative"
    );
  }
  if (dayTypeState.lastWorkout.totalWorkingSets < 0) {
    throw new Error(
      "Day type state lastWorkout.totalWorkingSets must be non-negative"
    );
  }

  // Clean the day type state data before saving
  const cleanDayTypeState = cleanWorkoutForFirestore(dayTypeState);
  console.log("Cleaned day type state:", cleanDayTypeState);

  const dayTypeStateRef = doc(
    db,
    `users/${uid}/daytype_state`,
    workout.dayType
  );
  await setDoc(dayTypeStateRef, cleanDayTypeState);
  console.log("Day type state updated successfully");
};
