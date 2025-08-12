import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Workout, ExerciseEntry, SetEntry, DayType } from "../types";

interface WorkoutDraftStore {
  currentWorkout: Workout | null;
  setCurrentWorkout: (workout: Workout) => void;
  addExercise: (exercise: ExerciseEntry) => void;
  removeExercise: (index: number) => void;
  updateExercise: (index: number, exercise: ExerciseEntry) => void;
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  updateSet: (
    exerciseIndex: number,
    setIndex: number,
    set: Partial<SetEntry>
  ) => void;
  clearDraft: () => void;
}

export const useWorkoutDraft = create(
  persist<WorkoutDraftStore>(
    (set, get) => ({
      currentWorkout: null,

      setCurrentWorkout: (workout: Workout) => {
        set({ currentWorkout: workout });
      },

      addExercise: (exercise: ExerciseEntry) => {
        const { currentWorkout } = get();
        if (!currentWorkout) return;

        const updatedWorkout = {
          ...currentWorkout,
          exercises: [...currentWorkout.exercises, exercise],
        };
        set({ currentWorkout: updatedWorkout });
      },

      removeExercise: (index: number) => {
        const { currentWorkout } = get();
        if (!currentWorkout) return;

        const updatedExercises = currentWorkout.exercises.filter(
          (_, i) => i !== index
        );
        const updatedWorkout = {
          ...currentWorkout,
          exercises: updatedExercises,
        };
        set({ currentWorkout: updatedWorkout });
      },

      updateExercise: (index: number, exercise: ExerciseEntry) => {
        const { currentWorkout } = get();
        if (!currentWorkout) return;

        const updatedExercises = [...currentWorkout.exercises];
        updatedExercises[index] = exercise;
        const updatedWorkout = {
          ...currentWorkout,
          exercises: updatedExercises,
        };
        set({ currentWorkout: updatedWorkout });
      },

      addSet: (exerciseIndex: number) => {
        const { currentWorkout } = get();
        if (!currentWorkout) return;

        const exercise = currentWorkout.exercises[exerciseIndex];
        if (!exercise) return;

        const newSet: SetEntry = {
          index: exercise.sets.length + 1,
          weight: 0,
          reps: 0,
          isWarmup: false,
        };

        const updatedExercise = {
          ...exercise,
          sets: [...exercise.sets, newSet],
        };

        get().updateExercise(exerciseIndex, updatedExercise);
      },

      removeSet: (exerciseIndex: number, setIndex: number) => {
        const { currentWorkout } = get();
        if (!currentWorkout) return;

        const exercise = currentWorkout.exercises[exerciseIndex];
        if (!exercise) return;

        const updatedSets = exercise.sets.filter((_, i) => i !== setIndex);
        const reindexedSets = updatedSets.map((set, i) => ({
          ...set,
          index: i + 1,
        }));

        const updatedExercise = {
          ...exercise,
          sets: reindexedSets,
        };

        get().updateExercise(exerciseIndex, updatedExercise);
      },

      updateSet: (
        exerciseIndex: number,
        setIndex: number,
        setUpdate: Partial<SetEntry>
      ) => {
        const { currentWorkout } = get();
        if (!currentWorkout) return;

        const exercise = currentWorkout.exercises[exerciseIndex];
        if (!exercise) return;

        const updatedSets = [...exercise.sets];
        updatedSets[setIndex] = { ...updatedSets[setIndex], ...setUpdate };

        const updatedExercise = {
          ...exercise,
          sets: updatedSets,
        };

        get().updateExercise(exerciseIndex, updatedExercise);
      },

      clearDraft: () => {
        set({ currentWorkout: null });
      },
    }),
    {
      name: "workout-draft-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
