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
