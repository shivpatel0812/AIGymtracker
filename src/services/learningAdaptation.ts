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
import { getProgressHistory, getUserPreferences } from "./agentMemory";
import { Workout, ProgressTracking } from "../types";

export interface OutcomeTracking {
  id?: string;
  goalId: string;
  predictionMade: {
    metric: string;
    predictedValue: number;
    predictedDate: string;
    confidence: number;
    methodology: string;
  };
  actualOutcome: {
    actualValue: number;
    actualDate: string;
    variance: number;
  };
  learningPoints: string[];
  accuracyScore: number;
  createdAt: string;
}

export interface FeedbackLoop {
  id?: string;
  type: 'workout_feedback' | 'nutrition_feedback' | 'progress_feedback';
  userRating: number;
  userComments?: string;
  context: {
    recommendation: string;
    followedAdvice: boolean;
    perceivedEffectiveness: number;
  };
  aiResponse: {
    adjustments: string[];
    reasoning: string;
  };
  timestamp: string;
}

export interface PatternRecognition {
  id?: string;
  userId: string;
  patterns: {
    workoutPreferences: {
      bestPerformanceDays: string[];
      preferredExerciseTypes: string[];
      optimalWorkoutDuration: number;
      recoveryPatterns: {
        averageRestBetweenSets: number;
        preferredRestDays: string[];
      };
    };
    nutritionPatterns: {
      macroPreferences: {
        proteinTiming: string[];
        carbPreferences: string[];
      };
      hydrationPatterns: {
        averageDailyIntake: number;
        bestPerformanceHydration: number;
      };
    };
    motivationPatterns: {
      peakMotivationTimes: string[];
      effectiveRewards: string[];
      plateauTriggers: string[];
    };
  };
  lastUpdated: string;
}

class LearningAdaptationService {
  async trackOutcome(outcome: Omit<OutcomeTracking, 'id' | 'createdAt'>): Promise<string> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated");

    try {
      const outcomeWithTimestamp = {
        ...outcome,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(
        collection(db, `users/${uid}/outcomes`),
        outcomeWithTimestamp
      );
      return docRef.id;
    } catch (error) {
      console.error("Error tracking outcome:", error);
      throw error;
    }
  }

  async processFeedback(feedback: Omit<FeedbackLoop, 'id' | 'aiResponse'>): Promise<FeedbackLoop> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated");

    try {
      const aiResponse = await this.generateAIResponse(feedback);
      
      const completeFeedback: FeedbackLoop = {
        ...feedback,
        aiResponse,
        timestamp: new Date().toISOString()
      };

      const docRef = await addDoc(
        collection(db, `users/${uid}/feedback`),
        completeFeedback
      );

      await this.updateLearningModel(completeFeedback);
      
      return { id: docRef.id, ...completeFeedback };
    } catch (error) {
      console.error("Error processing feedback:", error);
      throw error;
    }
  }

  async recognizePatterns(): Promise<PatternRecognition> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated");

    try {
      const [workouts, feedback, progress] = await Promise.all([
        this.getRecentWorkouts(30),
        this.getRecentFeedback(30),
        getProgressHistory(30)
      ]);

      const patterns = {
        workoutPreferences: await this.analyzeWorkoutPatterns(workouts, feedback),
        nutritionPatterns: await this.analyzeNutritionPatterns(progress),
        motivationPatterns: await this.analyzeMotivationPatterns(feedback)
      };

      const patternRecognition: PatternRecognition = {
        userId: uid,
        patterns,
        lastUpdated: new Date().toISOString()
      };

      await setDoc(
        doc(db, `users/${uid}/patterns`, "current"),
        patternRecognition
      );

      return patternRecognition;
    } catch (error) {
      console.error("Error recognizing patterns:", error);
      throw error;
    }
  }

  async predictPerformance(
    exerciseType: string,
    contextFactors: {
      sleepHours: number;
      hydrationLevel: number;
      stressLevel: number;
      timeOfDay: string;
      daysSinceLastWorkout: number;
    }
  ): Promise<{
    predictedPerformance: number;
    confidence: number;
    factors: Array<{ factor: string; impact: number; reasoning: string }>;
  }> {
    try {
      const patterns = await this.getCurrentPatterns();
      const historical = await this.getHistoricalPerformance(exerciseType);
      
      let performanceScore = 100;
      const factors: Array<{ factor: string; impact: number; reasoning: string }> = [];

      if (contextFactors.sleepHours < 7) {
        const impact = (7 - contextFactors.sleepHours) * -10;
        performanceScore += impact;
        factors.push({
          factor: 'sleep',
          impact,
          reasoning: 'Insufficient sleep reduces strength and endurance performance'
        });
      }

      if (contextFactors.hydrationLevel < 80) {
        const impact = (contextFactors.hydrationLevel - 80) * 0.3;
        performanceScore += impact;
        factors.push({
          factor: 'hydration',
          impact,
          reasoning: 'Dehydration impairs muscle function and recovery'
        });
      }

      if (contextFactors.stressLevel > 7) {
        const impact = (contextFactors.stressLevel - 7) * -5;
        performanceScore += impact;
        factors.push({
          factor: 'stress',
          impact,
          reasoning: 'High stress elevates cortisol, reducing training capacity'
        });
      }

      const confidence = this.calculatePredictionConfidence(historical.length, patterns);

      return {
        predictedPerformance: Math.max(0, Math.min(100, performanceScore)),
        confidence,
        factors
      };
    } catch (error) {
      console.error("Error predicting performance:", error);
      return {
        predictedPerformance: 75,
        confidence: 0.5,
        factors: []
      };
    }
  }

  async adaptRecommendations(
    currentRecommendation: string,
    userResponse: 'positive' | 'negative' | 'neutral',
    context: any
  ): Promise<{
    adaptedRecommendation: string;
    reasoning: string;
    confidence: number;
  }> {
    try {
      const patterns = await this.getCurrentPatterns();
      const preferences = await getUserPreferences();
      
      let adaptedRecommendation = currentRecommendation;
      let reasoning = "";

      if (userResponse === 'negative') {
        if (context.type === 'workout' && patterns?.patterns.workoutPreferences) {
          const preferredTypes = patterns.patterns.workoutPreferences.preferredExerciseTypes;
          adaptedRecommendation = this.adjustWorkoutRecommendation(
            currentRecommendation, 
            preferredTypes
          );
          reasoning = "Adjusted based on your exercise preferences and past positive responses";
        }
      }

      if (userResponse === 'positive') {
        await this.reinforceLearning(currentRecommendation, context);
        reasoning = "Recommendation reinforced based on positive feedback";
      }

      return {
        adaptedRecommendation,
        reasoning,
        confidence: 0.8
      };
    } catch (error) {
      console.error("Error adapting recommendations:", error);
      return {
        adaptedRecommendation: currentRecommendation,
        reasoning: "Unable to adapt recommendation",
        confidence: 0.3
      };
    }
  }

  private async generateAIResponse(feedback: Omit<FeedbackLoop, 'id' | 'aiResponse'>): Promise<FeedbackLoop['aiResponse']> {
    const adjustments: string[] = [];
    let reasoning = "";

    if (feedback.userRating < 3) {
      adjustments.push("Reduce intensity by 15%");
      adjustments.push("Increase rest periods");
      reasoning = "Low rating suggests recommendation was too challenging";
    } else if (feedback.userRating > 4) {
      adjustments.push("Gradually increase challenge");
      adjustments.push("Add progression variants");
      reasoning = "High rating indicates room for advancement";
    }

    if (!feedback.context.followedAdvice) {
      adjustments.push("Simplify recommendations");
      adjustments.push("Provide more specific guidance");
      reasoning += ". Non-compliance suggests complexity issues";
    }

    return { adjustments, reasoning };
  }

  private async updateLearningModel(feedback: FeedbackLoop): Promise<void> {
    
  }

  private async analyzeWorkoutPatterns(workouts: any[], feedback: FeedbackLoop[]): Promise<PatternRecognition['patterns']['workoutPreferences']> {
    const workoutDays = workouts.map(w => new Date(w.dateISO).getDay());
    const durations = workouts.map(w => w.duration || 60);
    
    return {
      bestPerformanceDays: this.findMostFrequentDays(workoutDays),
      preferredExerciseTypes: this.extractPreferredExercises(workouts, feedback),
      optimalWorkoutDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      recoveryPatterns: {
        averageRestBetweenSets: 90,
        preferredRestDays: ['sunday']
      }
    };
  }

  private async analyzeNutritionPatterns(progress: ProgressTracking[]): Promise<PatternRecognition['patterns']['nutritionPatterns']> {
    return {
      macroPreferences: {
        proteinTiming: ['post-workout', 'breakfast'],
        carbPreferences: ['complex', 'whole-grains']
      },
      hydrationPatterns: {
        averageDailyIntake: 2500,
        bestPerformanceHydration: 3000
      }
    };
  }

  private async analyzeMotivationPatterns(feedback: FeedbackLoop[]): Promise<PatternRecognition['patterns']['motivationPatterns']> {
    return {
      peakMotivationTimes: ['morning', 'early-evening'],
      effectiveRewards: ['progress-visualization', 'achievement-badges'],
      plateauTriggers: ['routine-staleness', 'lack-of-progress-visibility']
    };
  }

  private async getRecentWorkouts(days: number): Promise<any[]> {
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
  }

  private async getRecentFeedback(days: number): Promise<FeedbackLoop[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const q = query(
        collection(db, `users/${uid}/feedback`),
        where("timestamp", ">=", cutoffDate.toISOString()),
        orderBy("timestamp", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FeedbackLoop[];
    } catch (error) {
      console.error("Error getting recent feedback:", error);
      return [];
    }
  }

  private async getCurrentPatterns(): Promise<PatternRecognition | null> {
    const uid = auth.currentUser?.uid;
    if (!uid) return null;

    try {
      const docRef = doc(db, `users/${uid}/patterns`, "current");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as PatternRecognition;
      }
      return null;
    } catch (error) {
      console.error("Error getting current patterns:", error);
      return null;
    }
  }

  private async getHistoricalPerformance(exerciseType: string): Promise<any[]> {
    return [];
  }

  private calculatePredictionConfidence(dataPoints: number, patterns: PatternRecognition | null): number {
    let confidence = Math.min(dataPoints / 10, 1) * 0.7;
    if (patterns) confidence += 0.2;
    return confidence;
  }

  private adjustWorkoutRecommendation(current: string, preferences: string[]): string {
    return current;
  }

  private async reinforceLearning(recommendation: string, context: any): Promise<void> {
    
  }

  private findMostFrequentDays(days: number[]): string[] {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const frequency = days.reduce((acc, day) => {
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day]) => dayNames[parseInt(day)]);
  }

  private extractPreferredExercises(workouts: any[], feedback: FeedbackLoop[]): string[] {
    return ['strength', 'compound', 'progressive'];
  }
}

export const learningAdaptationService = new LearningAdaptationService();