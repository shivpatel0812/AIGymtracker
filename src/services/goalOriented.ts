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
import { getUserPreferences, getProgressHistory, analyzeUserPatterns } from "./agentMemory";
import { getHydrationHistory } from "./hydration";
import { UserPreferences, ProgressTracking } from "../types";
import { cleanForFirestore } from "../utils/firestore";

export interface FitnessGoal {
  id?: string;
  type: 'lose_weight' | 'gain_muscle' | 'strength' | 'endurance' | 'maintain';
  target: number;
  current: number;
  deadline: string;
  milestones: Array<{
    value: number;
    deadline: string;
    achieved: boolean;
    achievedDate?: string;
  }>;
  strategy: string[];
  createdAt: string;
  status: 'active' | 'completed' | 'paused';
}

export interface ProactiveSuggestion {
  id?: string;
  type: 'workout_reminder' | 'rest_day' | 'nutrition_adjustment' | 'goal_check';
  priority: 'low' | 'medium' | 'high';
  message: string;
  actionButtons?: Array<{
    text: string;
    action: string;
  }>;
  triggerCondition: string;
  createdAt: string;
  dismissed?: boolean;
  actedUpon?: boolean;
}

export const createFitnessGoal = async (goal: Omit<FitnessGoal, 'id' | 'createdAt'>): Promise<string> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const goalWithTimestamp = cleanForFirestore({
      ...goal,
      createdAt: new Date().toISOString(),
    });

    const docRef = await addDoc(
      collection(db, `users/${uid}/goals`),
      goalWithTimestamp
    );
    return docRef.id;
  } catch (error) {
    console.error("Error creating fitness goal:", error);
    throw error;
  }
};

export const getFitnessGoals = async (): Promise<FitnessGoal[]> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    // Simplified query to avoid index requirement during development
    const q = query(
      collection(db, `users/${uid}/goals`),
      where("status", "==", "active")
      // Removed orderBy to avoid composite index requirement
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FitnessGoal[];
  } catch (error) {
    console.error("Error getting fitness goals:", error);
    throw error;
  }
};

export const generateProactiveSuggestions = async (): Promise<ProactiveSuggestion[]> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const [preferences, progress, patterns] = await Promise.all([
      getUserPreferences(),
      getProgressHistory(7),
      analyzeUserPatterns()
    ]);

    const suggestions: ProactiveSuggestion[] = [];

    if (patterns.consistencyScore < 70) {
      suggestions.push({
        type: 'workout_reminder',
        priority: 'medium',
        message: `I notice you've missed a few workouts lately. Your consistency is at ${patterns.consistencyScore}%. Would you like me to adjust your schedule or suggest easier alternatives?`,
        actionButtons: [
          { text: 'Adjust Schedule', action: 'adjust_schedule' },
          { text: 'Easier Workouts', action: 'easier_workouts' },
          { text: 'Not Now', action: 'dismiss' }
        ],
        triggerCondition: 'low_consistency',
        createdAt: new Date().toISOString()
      });
    }

    const recentWorkouts = await getRecentWorkouts(7);
    if (recentWorkouts.length === 0) {
      suggestions.push({
        type: 'workout_reminder',
        priority: 'high',
        message: "You haven't logged a workout in 7 days. Let's get back on track! Would you like a quick 15-minute session to restart your momentum?",
        actionButtons: [
          { text: 'Quick Workout', action: 'start_quick_workout' },
          { text: 'Schedule Later', action: 'schedule_workout' }
        ],
        triggerCondition: 'no_recent_workouts',
        createdAt: new Date().toISOString()
      });
    }

    const hydrationData = await getHydrationHistory(3);
    const avgHydration = hydrationData.reduce((sum, entry) => sum + entry.water_intake, 0) / hydrationData.length;
    if (avgHydration < 2000) {
      suggestions.push({
        type: 'nutrition_adjustment',
        priority: 'medium',
        message: `Your average water intake is ${Math.round(avgHydration)}ml. Proper hydration can improve your workout performance by up to 15%. Let's increase your daily target!`,
        actionButtons: [
          { text: 'Set Reminders', action: 'set_hydration_reminders' },
          { text: 'Track Progress', action: 'track_hydration' }
        ],
        triggerCondition: 'low_hydration',
        createdAt: new Date().toISOString()
      });
    }

    return suggestions;
  } catch (error) {
    console.error("Error generating proactive suggestions:", error);
    return [];
  }
};

export const saveProactiveSuggestion = async (
  suggestion: Omit<ProactiveSuggestion, 'id'>
): Promise<string> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const cleanSuggestion = cleanForFirestore(suggestion);
    const docRef = await addDoc(
      collection(db, `users/${uid}/suggestions`),
      cleanSuggestion
    );
    return docRef.id;
  } catch (error) {
    console.error("Error saving proactive suggestion:", error);
    throw error;
  }
};

export const getActiveSuggestions = async (): Promise<ProactiveSuggestion[]> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    // Simplified query to avoid index requirement during development
    const q = query(
      collection(db, `users/${uid}/suggestions`),
      where("dismissed", "==", false),
      limit(5)
      // Removed orderBy to avoid composite index requirement
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ProactiveSuggestion[];
  } catch (error) {
    console.error("Error getting active suggestions:", error);
    return [];
  }
};

export const dismissSuggestion = async (suggestionId: string): Promise<void> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const updateData = cleanForFirestore({
      dismissed: true,
      dismissedAt: new Date().toISOString()
    });
    const docRef = doc(db, `users/${uid}/suggestions`, suggestionId);
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error dismissing suggestion:", error);
    throw error;
  }
};

export const adaptWorkoutPlan = async (
  performanceData: {
    completedWorkouts: number;
    averageRpe: number;
    missedWorkouts: number;
    userFeedback: number;
  }
): Promise<{
  adjustments: string[];
  newSchedule?: any;
  reasoning: string;
}> => {
  const preferences = await getUserPreferences();
  
  const adjustments: string[] = [];
  let reasoning = "Based on your recent performance: ";

  if (performanceData.averageRpe > 8.5) {
    adjustments.push("Reduce training intensity by 10%");
    adjustments.push("Add extra rest day");
    reasoning += "Your RPE indicates overreaching. ";
  }

  if (performanceData.missedWorkouts > 2) {
    adjustments.push("Simplify workout structure");
    adjustments.push("Reduce session duration by 15 minutes");
    reasoning += "Missed workouts suggest time constraints. ";
  }

  if (performanceData.userFeedback < 3) {
    adjustments.push("Increase exercise variety");
    adjustments.push("Add preferred exercises");
    reasoning += "Low satisfaction requires program refresh. ";
  }

  return {
    adjustments,
    reasoning
  };
};

const getRecentWorkouts = async (days: number): Promise<any[]> => {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const q = query(
      collection(db, `users/${uid}/workouts`),
      where("dateISO", ">=", cutoffDate.toISOString()),
      orderBy("dateISO", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting recent workouts:", error);
    return [];
  }
};