import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  Button,
  TextInput,
  Chip,
  Portal,
  Modal,
  useTheme,
  FAB,
} from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useWorkoutDraft } from "../store/useWorkoutDraft";
import { ExerciseCard } from "../components/ExerciseCard";
import { ExerciseEntry, DayType, Workout } from "../types";
import { saveWorkout, updateWorkout } from "../services/workouts";
import { getDayTypeState } from "../services/snapshots";
import { colors } from "../config/theme";
import { useAgent } from "../hooks/useAgent";
import { AgentInterface } from "../components/AgentInterface";

const EXERCISE_CATALOG = [
  { id: "press_bench_incline_db", name: "Incline DB Bench", category: "Push" },
  { id: "press_bench_flat", name: "Flat Bench Press", category: "Push" },
  { id: "press_shoulder_ohp", name: "Overhead Press", category: "Push" },
  { id: "pull_row_barbell", name: "Barbell Row", category: "Pull" },
  { id: "pull_pulldown", name: "Lat Pulldown", category: "Pull" },
  { id: "legs_squat", name: "Squat", category: "Legs" },
  { id: "legs_deadlift", name: "Deadlift", category: "Legs" },
  { id: "legs_lunge", name: "Lunge", category: "Legs" },
];

export const LogWorkoutScreen: React.FC = () => {
  const [isExerciseModalVisible, setIsExerciseModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [exerciseVariant, setExerciseVariant] = useState("");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [lastDayTypeSummary, setLastDayTypeSummary] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAgentVisible, setIsAgentVisible] = useState(false);
  
  const { 
    isInitialized, 
    requestWorkoutSuggestion,
    celebrateAchievement,
    handleEmergency,
    updateContext 
  } = useAgent({ currentScreen: 'LogWorkout' });

  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as any;
  const isEditMode = !!(params?.mode === "edit" && params?.workout);
  const { currentWorkout, addExercise, clearDraft, setCurrentWorkout } =
    useWorkoutDraft();

  useEffect(() => {
    if (isEditMode) {
      const workoutToEdit: Workout = params.workout as Workout;
      setCurrentWorkout(workoutToEdit);
      setWorkoutNotes(workoutToEdit.notes || "");
    }
    loadLastDayTypeSummary();
    
    updateContext({
      currentScreen: 'LogWorkout',
      sessionData: { 
        currentWorkout, 
        isEditMode, 
        exerciseCount: currentWorkout?.exercises.length || 0 
      }
    });
  }, [currentWorkout]);

  const loadLastDayTypeSummary = async () => {
    if (!currentWorkout?.dayType) return;

    try {
      const state = await getDayTypeState(currentWorkout.dayType);
      if (state?.lastWorkout) {
        setLastDayTypeSummary(state.lastWorkout);
      }
    } catch (error) {
      console.error("Error loading day type summary:", error);
    }
  };

  const handleAddExercise = () => {
    setIsExerciseModalVisible(true);
  };

  const handleConfirmAddExercise = () => {
    if (!selectedExercise) return;

    const exercise: ExerciseEntry = {
      exerciseId: selectedExercise.id,
      name: selectedExercise.name,
      variant: exerciseVariant.trim() || null,
      sets: [
        {
          index: 1,
          weight: 0,
          reps: 0,
          isWarmup: false,
        },
      ],
    };

    addExercise(exercise);
    setSelectedExercise(null);
    setExerciseVariant("");
    setIsExerciseModalVisible(false);
  };

  const handleSaveWorkout = async () => {
    if (!currentWorkout || currentWorkout.exercises.length === 0) {
      Alert.alert("Error", "Please add at least one exercise before saving.");
      return;
    }

    const hasWorkingSets = currentWorkout.exercises.some((exercise) =>
      exercise.sets.some(
        (set) => !set.isWarmup && set.weight > 0 && set.reps > 0
      )
    );

    if (!hasWorkingSets) {
      Alert.alert(
        "Error",
        "Please log at least one working set before saving."
      );
      return;
    }

    setIsSaving(true);
    try {
      const workoutToPersist: Workout = {
        ...(currentWorkout as Workout),
        notes: workoutNotes.trim() || null,
      };

      if (isEditMode) {
        await updateWorkout(workoutToPersist);
        clearDraft();
        (navigation as any).navigate("WorkoutDetail", {
          workout: workoutToPersist,
        });
      } else {
        const cleanWorkout = JSON.parse(JSON.stringify(workoutToPersist));
        await saveWorkout(cleanWorkout);
        clearDraft();
        
        // Celebrate workout completion
        if (isInitialized) {
          await celebrateAchievement({
            type: 'personal_best',
            value: `${workoutToPersist.exercises.length} exercises completed`,
            context: { workoutType: workoutToPersist.dayType }
          });
        }
        
        navigation.navigate("WorkoutComplete" as never);
      }
    } catch (error) {
      console.error("Error saving workout:", error);
      Alert.alert("Error", "Failed to save workout. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateISO: string): string => {
    const date = new Date(dateISO);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!currentWorkout) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text>No workout in progress. Please select a day type first.</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        alwaysBounceVertical
      >
        <View
          style={[styles.header, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineMedium">Today: {currentWorkout.dayType}</Text>

          {lastDayTypeSummary && (
            <View style={styles.lastWorkoutSummary}>
              <Chip icon="calendar" style={styles.summaryChip}>
                Last {currentWorkout.dayType}:{" "}
                {formatDate(lastDayTypeSummary.dateISO)}
              </Chip>
              <Chip icon="dumbbell" style={styles.summaryChip}>
                {lastDayTypeSummary.totalExercises} exercises
              </Chip>
              <Chip icon="repeat" style={styles.summaryChip}>
                {lastDayTypeSummary.totalWorkingSets} sets
              </Chip>
            </View>
          )}
        </View>

        <View style={styles.notesSection}>
          <TextInput
            mode="outlined"
            label="Workout Notes"
            value={workoutNotes}
            onChangeText={setWorkoutNotes}
            placeholder="How did you feel today?"
            multiline
            numberOfLines={2}
          />

          <View style={styles.inlineActions}>
            <Button
              mode="contained"
              onPress={handleSaveWorkout}
              loading={isSaving}
              disabled={isSaving}
              style={styles.actionButton}
            >
              {isEditMode ? "Save Changes" : "Save Workout"}
            </Button>

            <Button
              mode="outlined"
              onPress={handleAddExercise}
              style={styles.actionButton}
              icon="plus"
            >
              Add Exercise
            </Button>
            
            <Button
              mode="outlined"
              onPress={async () => {
                if (!isInitialized) return;
                try {
                  await requestWorkoutSuggestion({
                    availableTime: 60,
                    equipment: ['barbell', 'dumbbell'],
                    goals: [currentWorkout?.dayType.toLowerCase() || 'general']
                  });
                  setIsAgentVisible(true);
                } catch (error) {
                  console.error('Error requesting workout suggestion:', error);
                }
              }}
              style={styles.actionButton}
              icon="lightbulb"
              disabled={!isInitialized}
            >
              Get AI Help
            </Button>
          </View>
        </View>

        <View style={styles.exercisesSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Exercises ({currentWorkout.exercises.length})
          </Text>

          {currentWorkout.exercises.map((exercise, index) => (
            <ExerciseCard
              key={index}
              exercise={exercise}
              index={index}
              onRemove={() => {
                const { removeExercise } = useWorkoutDraft.getState();
                removeExercise(index);
              }}
            />
          ))}

          {currentWorkout.exercises.length === 0 && (
            <Text style={styles.noExercises}>
              No exercises added yet. Use Add Exercise above to get started.
            </Text>
          )}
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={isExerciseModalVisible}
          onDismiss={() => setIsExerciseModalVisible(false)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Add Exercise
          </Text>

          <ScrollView style={styles.exerciseList}>
            {EXERCISE_CATALOG.map((exercise) => (
              <Button
                key={exercise.id}
                mode={
                  selectedExercise?.id === exercise.id
                    ? "contained"
                    : "outlined"
                }
                onPress={() => setSelectedExercise(exercise)}
                style={styles.exerciseButton}
              >
                {exercise.name}
              </Button>
            ))}
          </ScrollView>

          {selectedExercise && (
            <View style={styles.variantSection}>
              <TextInput
                mode="outlined"
                label="Variant (optional)"
                value={exerciseVariant}
                onChangeText={setExerciseVariant}
                placeholder="e.g., neutral grip, wide stance"
              />
            </View>
          )}

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setIsExerciseModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirmAddExercise}
              disabled={!selectedExercise}
              style={styles.modalButton}
            >
              Add Exercise
            </Button>
          </View>
        </Modal>
      </Portal>
      
      <FAB
        icon="robot"
        style={styles.fab}
        onPress={() => setIsAgentVisible(true)}
        disabled={!isInitialized}
        size="small"
      />
      
      <AgentInterface
        visible={isAgentVisible}
        onDismiss={() => setIsAgentVisible(false)}
        currentScreen="LogWorkout"
        contextData={{ 
          currentWorkout, 
          exerciseCount: currentWorkout?.exercises.length || 0,
          dayType: currentWorkout?.dayType,
          isEditMode 
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    // no fixed height; allow flex layout from parent
  },
  scrollContent: {
    paddingBottom: 200,
  },
  header: {
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  lastWorkoutSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
  },
  summaryChip: {
    marginRight: 8,
  },
  notesSection: {
    padding: 20,
  },
  inlineActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
  },
  exercisesSection: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  noExercises: {
    textAlign: "center",
    fontStyle: "italic",
    color: "#B0B0B0",
    marginTop: 40,
  },
  modalContent: {
    margin: 20,
    padding: 20,
    borderRadius: 18,
    maxHeight: "80%",
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 20,
  },
  exerciseList: {
    maxHeight: 300,
  },
  exerciseButton: {
    marginBottom: 8,
  },
  variantSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    top: 100,
    backgroundColor: colors.neonCyan,
  },
});
