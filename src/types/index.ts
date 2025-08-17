export type WorkoutSplit = "PPL" | "UL" | "FB" | "Custom";
export type DayType = "Push" | "Pull" | "Legs" | "Upper" | "Lower" | "Full";

export interface UserProfile {
  split: WorkoutSplit;
  dayOrder?: string[];
}

export interface SetEntry {
  index: number;
  weight: number;
  reps: number;
  rpe?: number | null;
  isWarmup?: boolean;
  note?: string | null;
}

export interface ExerciseEntry {
  exerciseId: string;
  name: string;
  variant?: string | null;
  sets: SetEntry[];
}

export interface Workout {
  id?: string;
  dateISO: string;
  dayType: DayType;
  notes?: string | null;
  exercises: ExerciseEntry[];
}

export interface ExerciseState {
  lastSession: {
    dateISO: string;
    dayType: string;
    sets: Array<{
      index: number;
      weight: number;
      reps: number;
      rpe?: number | null;
    }>;
  };
  recentDates?: string[];
  adaptiveRecommendations?: {
    suggestedWeight: number;
    suggestedReps: number;
    confidence: number;
    reasoning: string;
  };
}

export interface DayTypeState {
  lastWorkout: {
    dateISO: string;
    totalExercises: number;
    totalWorkingSets: number;
  };
}

export interface ExerciseCatalogItem {
  id: string;
  name: string;
  category: string;
}

export interface FoodEntry {
  id?: string;
  createdAtISO: string;
  imageUrl: string;
  imageStoragePath: string;
  description?: string | null;
  macros: {
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
  };
}

export interface HydrationEntry {
  id?: string;
  date: string;
  water_intake: number;
  hydration_quality: number;
}

export interface StressEntry {
  id?: string;
  date: string;
  stress_level: number;
  stress_factors?: string | null;
}

export interface MacroEntry {
  id?: string;
  date: string;
  foods: Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
}

export interface ConversationEntry {
  id?: string;
  timestamp: string;
  userMessage: string;
  aiResponse: string;
  context: {
    screenContext?: string;
    dataContext?: any;
    actionTaken?: string;
  };
}

export interface UserPreferences {
  id?: string;
  communicationStyle: 'motivational' | 'analytical' | 'casual';
  notificationPreferences: {
    workoutReminders: boolean;
    motivationalMessages: boolean;
    progressUpdates: boolean;
    frequency: 'daily' | 'weekly' | 'custom';
  };
  fitnessGoals: {
    primaryGoal: 'lose_weight' | 'gain_muscle' | 'maintain' | 'strength' | 'endurance';
    targetWeight?: number;
    targetBodyFat?: number;
    timeframe?: string;
    description?: string;
    setAt?: string;
  };
  preferredWorkoutTimes: string[];
  dietaryRestrictions: string[];
  injuryHistory: string[];
}

export interface ComprehensiveUserProfile {
  id?: string;
  basicInfo: {
    age?: number;
    height?: number;
    currentWeight?: number;
    activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
    fitnessExperience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    trainingYears?: number;
  };
  fitnessGoals: {
    primaryGoal: 'lose_weight' | 'gain_muscle' | 'maintain' | 'strength' | 'endurance' | 'body_recomposition';
    specificTargets: {
      targetWeight?: number;
      targetBodyFat?: number;
      strengthGoals?: {
        benchPress?: number;
        squat?: number;
        deadlift?: number;
        overheadPress?: number;
      };
      timeframe?: string;
    };
    description?: string;
    setAt?: string;
  };
  exerciseInsights: {
    favoriteExercises: string[];
    leastFavoriteExercises: string[];
    exerciseResponses: Array<{
      exercise: string;
      response: string;
      effectiveness: 'very_effective' | 'effective' | 'somewhat_effective' | 'not_effective';
      notes?: string;
    }>;
    workoutPreferences: {
      preferredSplit: 'PPL' | 'UL' | 'FB' | 'Bro_Split' | 'Custom';
      sessionDuration: '30min' | '45min' | '60min' | '90min' | 'flexible';
      intensityPreference: 'low' | 'moderate' | 'high' | 'variable';
      equipmentAccess: string[];
    };
    injuryHistory: Array<{
      injury: string;
      date?: string;
      affectedExercises: string[];
      currentStatus: 'fully_healed' | 'managing' | 'ongoing_issue';
      modifications: string[];
    }>;
  };
  nutritionInsights: {
    dietaryRestrictions: string[];
    allergies: string[];
    foodSensitivities: Array<{
      food: string;
      reaction: string;
      severity: 'mild' | 'moderate' | 'severe';
    }>;
    nutritionPreferences: {
      mealFrequency: '2_meals' | '3_meals' | '4_meals' | '5_plus_meals' | 'flexible';
      cookingLevel: 'minimal' | 'basic' | 'intermediate' | 'advanced';
      budgetLevel: 'tight' | 'moderate' | 'flexible' | 'unlimited';
      supplementUsage: string[];
    };
    dietHistory: Array<{
      dietType: string;
      duration: string;
      results: string;
      whatWorked: string;
      whatDidntWork: string;
    }>;
  };
  personalInsights: {
    motivationTriggers: string[];
    stressFactors: string[];
    lifeCircumstances: {
      workSchedule: 'regular_9_5' | 'shift_work' | 'irregular' | 'flexible' | 'unemployed';
      sleepSchedule: 'early_bird' | 'night_owl' | 'irregular' | 'variable';
      familyCommitments: 'none' | 'minimal' | 'moderate' | 'significant';
      travelFrequency: 'never' | 'occasional' | 'frequent' | 'constant';
    };
    growthPatterns: Array<{
      area: string;
      observation: string;
      timeframe: string;
      factors: string[];
    }>;
    mentalAspects: {
      relationshipWithFood: string;
      relationshipWithExercise: string;
      stressEating: boolean;
      emotionalTriggers: string[];
      copingMechanisms: string[];
    };
  };
  preferences: {
    communicationStyle: 'motivational' | 'analytical' | 'casual' | 'scientific';
    feedbackStyle: 'direct' | 'gentle' | 'detailed' | 'concise';
    coachingApproach: 'strict' | 'flexible' | 'supportive' | 'challenging';
    dataTracking: 'minimal' | 'moderate' | 'detailed' | 'obsessive';
  };
  brainDumpSections: {
    workoutExperiences: string;
    nutritionExperiences: string;
    bodyChangesObservations: string;
    whatWorksForMe: string;
    whatDoesntWork: string;
    uniqueCircumstances: string;
    personalTheories: string;
    questionsForCoach: string;
  };
  profileCompleteness: {
    lastUpdated: string;
    sectionsCompleted: string[];
    overallCompleteness: number;
  };
}

export interface ProgressTracking {
  id?: string;
  date: string;
  metrics: {
    weight?: number;
    bodyFat?: number;
    muscleGain?: number;
    strengthMetrics?: {
      benchPress?: number;
      squat?: number;
      deadlift?: number;
    };
  };
  adherenceScore: number;
  userFeedback?: {
    energy: number;
    motivation: number;
    satisfaction: number;
    notes?: string;
  };
}

export interface AgentMemory {
  userId: string;
  conversationHistory: ConversationEntry[];
  userPreferences: UserPreferences;
  progressHistory: ProgressTracking[];
  patterns: {
    bestWorkoutTimes: string[];
    consistencyScore: number;
    responseToAdvice: 'follows' | 'ignores' | 'partial';
    motivationTriggers: string[];
  };
  lastUpdated: string;
}
