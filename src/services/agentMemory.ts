import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { 
  ConversationEntry, 
  UserPreferences, 
  ProgressTracking, 
  AgentMemory 
} from "../types";
import { cleanForFirestore } from "../utils/firestore";

export const saveConversationEntry = async (
  entry: Omit<ConversationEntry, 'id'>
): Promise<string> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    // Clean the entry to remove undefined values
    const cleanEntry = cleanForFirestore(entry);
    
    const docRef = await addDoc(
      collection(db, `users/${uid}/conversations`),
      cleanEntry
    );
    return docRef.id;
  } catch (error) {
    console.error("Error saving conversation entry:", error);
    throw error;
  }
};

export const getConversationHistory = async (
  limitCount: number = 50
): Promise<ConversationEntry[]> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const q = query(
      collection(db, `users/${uid}/conversations`),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConversationEntry[];
  } catch (error) {
    console.error("Error getting conversation history:", error);
    throw error;
  }
};

export const saveUserPreferences = async (
  preferences: UserPreferences
): Promise<void> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const cleanPreferences = cleanForFirestore(preferences);
    const docRef = doc(db, `users/${uid}/preferences`, "current");
    await setDoc(docRef, cleanPreferences);
  } catch (error) {
    console.error("Error saving user preferences:", error);
    throw error;
  }
};

export const getUserPreferences = async (): Promise<UserPreferences | null> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const docRef = doc(db, `users/${uid}/preferences`, "current");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserPreferences;
    }
    return null;
  } catch (error) {
    console.error("Error getting user preferences:", error);
    throw error;
  }
};

export const saveProgressTracking = async (
  progress: Omit<ProgressTracking, 'id'>
): Promise<string> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const cleanProgress = cleanForFirestore(progress);
    const docRef = doc(db, `users/${uid}/progress`, progress.date);
    await setDoc(docRef, cleanProgress);
    return docRef.id;
  } catch (error) {
    console.error("Error saving progress tracking:", error);
    throw error;
  }
};

export const getProgressHistory = async (
  limitCount: number = 30
): Promise<ProgressTracking[]> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const q = query(
      collection(db, `users/${uid}/progress`),
      orderBy("date", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ProgressTracking[];
  } catch (error) {
    console.error("Error getting progress history:", error);
    throw error;
  }
};

export const updateAgentMemory = async (
  memory: Partial<AgentMemory>
): Promise<void> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const cleanMemory = cleanForFirestore({
      ...memory,
      lastUpdated: new Date().toISOString(),
    });
    const docRef = doc(db, `users/${uid}/agent`, "memory");
    await updateDoc(docRef, cleanMemory);
  } catch (error) {
    console.error("Error updating agent memory:", error);
    throw error;
  }
};

export const getAgentMemory = async (): Promise<AgentMemory | null> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const docRef = doc(db, `users/${uid}/agent`, "memory");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as AgentMemory;
    }
    return null;
  } catch (error) {
    console.error("Error getting agent memory:", error);
    throw error;
  }
};

export const analyzeUserPatterns = async (): Promise<AgentMemory['patterns']> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const [workouts, conversations, progress] = await Promise.all([
      getDocs(query(collection(db, `users/${uid}/workouts`), orderBy("dateISO", "desc"), limit(30))),
      getConversationHistory(30),
      getProgressHistory(30)
    ]);

    const workoutTimes = workouts.docs.map(doc => {
      const data = doc.data();
      return new Date(data.dateISO).getHours();
    });

    const consistencyScore = calculateConsistencyScore(workouts.docs);
    const responseToAdvice = analyzeAdviceResponse(conversations);
    const motivationTriggers = extractMotivationTriggers(conversations);

    return {
      bestWorkoutTimes: findBestWorkoutTimes(workoutTimes),
      consistencyScore,
      responseToAdvice,
      motivationTriggers
    };
  } catch (error) {
    console.error("Error analyzing user patterns:", error);
    throw error;
  }
};

const calculateConsistencyScore = (workouts: any[]): number => {
  if (workouts.length === 0) return 0;
  
  const dates = workouts.map(w => new Date(w.data().dateISO).toDateString());
  const uniqueDates = new Set(dates);
  const daysWithWorkouts = uniqueDates.size;
  const totalDays = Math.min(30, workouts.length);
  
  return Math.round((daysWithWorkouts / totalDays) * 100);
};

const analyzeAdviceResponse = (conversations: ConversationEntry[]): 'follows' | 'ignores' | 'partial' => {
  return 'partial';
};

const extractMotivationTriggers = (conversations: ConversationEntry[]): string[] => {
  return ['progress_visualization', 'goal_reminders', 'streak_tracking'];
};

const findBestWorkoutTimes = (hours: number[]): string[] => {
  const timeMap = new Map<number, number>();
  hours.forEach(hour => {
    timeMap.set(hour, (timeMap.get(hour) || 0) + 1);
  });
  
  const sortedTimes = Array.from(timeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`);
    
  return sortedTimes;
};