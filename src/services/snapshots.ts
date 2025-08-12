import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import { ExerciseState, DayTypeState } from "../types";

export const getExerciseState = async (
  exerciseId: string
): Promise<ExerciseState | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const uid = currentUser.uid;

  try {
    await currentUser.getIdToken(true);
  } catch (tokenError) {
    console.error("Token refresh error:", tokenError);
    throw new Error("Authentication token expired. Please sign in again.");
  }

  try {
    const path = `users/${uid}/exercise_state`;
    console.log(`Reading from path: ${path}/${exerciseId}`);
    console.log("User ID:", uid);
    console.log("Exercise ID:", exerciseId);
    const docRef = doc(db, path, exerciseId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as ExerciseState;
    }
    return null;
  } catch (error) {
    console.error(`Error reading exercise state for ${exerciseId}:`, error);
    console.error(
      "Error details:",
      (error as any).code,
      (error as any).message
    );

    if (
      (error as any).code === "permission-denied" ||
      (error as any).code === "unauthenticated"
    ) {
      throw new Error("Authentication error. Please sign in again.");
    }

    return null;
  }
};

export const getDayTypeState = async (
  dayType: string
): Promise<DayTypeState | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const uid = currentUser.uid;

  try {
    await currentUser.getIdToken(true);
  } catch (tokenError) {
    console.error("Token refresh error:", tokenError);
    throw new Error("Authentication token expired. Please sign in again.");
  }

  try {
    const path = `users/${uid}/daytype_state`;
    console.log(`Reading from path: ${path}/${dayType}`);
    console.log("User ID:", uid);
    console.log("Day type:", dayType);
    const docRef = doc(db, path, dayType);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as DayTypeState;
    }
    return null;
  } catch (error) {
    console.error(`Error reading day type state for ${dayType}:`, error);
    console.error(
      "Error details:",
      (error as any).code,
      (error as any).message
    );

    if (
      (error as any).code === "permission-denied" ||
      (error as any).code === "unauthenticated"
    ) {
      throw new Error("Authentication error. Please sign in again.");
    }

    return null;
  }
};

export const setExerciseState = async (
  exerciseId: string,
  state: ExerciseState
): Promise<void> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  const docRef = doc(db, `users/${uid}/exercise_state`, exerciseId);
  await setDoc(docRef, state);
};

export const setDayTypeState = async (
  dayType: string,
  state: DayTypeState
): Promise<void> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  const docRef = doc(db, `users/${uid}/daytype_state`, dayType);
  await setDoc(docRef, state);
};
