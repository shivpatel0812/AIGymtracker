import React, { useState, useEffect } from "react";
import { SafeAreaView, View, StyleSheet, FlatList } from "react-native";
import { Text, Card, Button, Chip, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { getWorkouts } from "../services/workouts";
import { signOutUser } from "../services/auth";
import { Workout } from "../types";

export const HistoryScreen: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigation = useNavigation();
  const theme = useTheme();

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const workoutList = await getWorkouts();
      setWorkouts(workoutList);
    } catch (error) {
      console.error("Error loading workouts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadWorkouts();
    setIsRefreshing(false);
  };

  const handleWorkoutPress = (workout: Workout) => {
    (navigation as any).navigate("WorkoutDetail", { workout });
  };

  const handleWorkoutEdit = (workout: Workout) => {
    (navigation as any).navigate("LogWorkout", { workout, mode: "edit" });
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const formatDate = (dateISO: string): string => {
    const date = new Date(dateISO);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTotalSets = (workout: Workout): number => {
    return workout.exercises.reduce(
      (total, exercise) => total + exercise.sets.length,
      0
    );
  };

  const getWorkingSets = (workout: Workout): number => {
    return workout.exercises.reduce(
      (total, exercise) =>
        total + exercise.sets.filter((set) => !set.isWarmup).length,
      0
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text>Loading workout history...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={workouts}
        keyExtractor={(workout, index) => workout.id || String(index)}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        scrollEnabled
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View
            style={[styles.header, { borderBottomColor: theme.colors.outline }]}
          >
            <Text variant="headlineMedium">Workout History</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {workouts.length} workouts completed
            </Text>
            <View style={styles.headerActions}>
              <Button
                mode="outlined"
                onPress={() => (navigation as any).navigate("Calendar")}
                icon="calendar"
              >
                Calendar
              </Button>
            </View>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footerActions}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate("DayPicker" as never)}
              style={styles.newWorkout}
              icon="plus"
            >
              New Workout
            </Button>
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.logoutButton}
              icon="logout"
            >
              Sign Out
            </Button>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No workouts yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              Complete your first workout to see it here
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate("DayPicker" as never)}
              style={styles.startWorkoutButton}
            >
              Start Your First Workout
            </Button>
          </View>
        }
        renderItem={({ item: workout }) => (
          <View style={styles.workoutsList}>
            <Card
              style={styles.workoutCard}
              onPress={() => handleWorkoutPress(workout)}
            >
              <Card.Content>
                <View style={styles.workoutHeader}>
                  <View style={styles.workoutInfo}>
                    <Text variant="titleMedium">{workout.dayType}</Text>
                    <Text variant="bodyMedium" style={styles.date}>
                      {formatDate(workout.dateISO)}
                    </Text>
                  </View>
                  <View style={styles.workoutStats}>
                    <Chip icon="dumbbell" style={styles.statChip}>
                      {workout.exercises.length}
                    </Chip>
                    <Chip icon="repeat" style={styles.statChip}>
                      {getWorkingSets(workout)}
                    </Chip>
                    <Button
                      mode="outlined"
                      onPress={() => handleWorkoutEdit(workout)}
                      compact
                      style={{ marginLeft: 8 }}
                    >
                      Edit
                    </Button>
                  </View>
                </View>
                {workout.notes && (
                  <Text variant="bodySmall" style={styles.notes}>
                    {workout.notes}
                  </Text>
                )}
                <View style={styles.exercisePreview}>
                  <Text variant="bodySmall" style={styles.previewTitle}>
                    Exercises:
                  </Text>
                  {workout.exercises.slice(0, 3).map((exercise, idx) => (
                    <Text
                      key={idx}
                      variant="bodySmall"
                      style={styles.exerciseName}
                    >
                      • {exercise.name}
                      {exercise.variant && ` (${exercise.variant})`}
                    </Text>
                  ))}
                  {workout.exercises.length > 3 && (
                    <Text variant="bodySmall" style={styles.moreExercises}>
                      +{workout.exercises.length - 3} more
                    </Text>
                  )}
                </View>
              </Card.Content>
            </Card>
          </View>
        )}
        showsVerticalScrollIndicator
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerActions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  footerActions: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 12,
  },
  subtitle: {
    marginTop: 4,
    color: "#B0B0B0",
  },
  scrollContent: {
    paddingBottom: 120,
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    marginBottom: 8,
    color: "#B0B0B0",
  },
  emptySubtitle: {
    textAlign: "center",
    marginBottom: 24,
    color: "#999",
    lineHeight: 20,
  },
  startWorkoutButton: {
    paddingHorizontal: 24,
  },
  workoutsList: {
    padding: 20,
  },
  workoutCard: {
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.05)",
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  date: {
    color: "#B0B0B0",
    marginTop: 4,
  },
  workoutStats: {
    flexDirection: "row",
    gap: 8,
  },
  statChip: {
    height: 32,
  },
  notes: {
    fontStyle: "italic",
    color: "#B0B0B0",
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.05)",
  },
  exercisePreview: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.05)",
  },
  previewTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  exerciseName: {
    marginBottom: 4,
    color: "#B0B0B0",
  },
  moreExercises: {
    fontStyle: "italic",
    color: "#999",
    marginTop: 4,
  },
  newWorkout: {
    paddingVertical: 8,
  },
  logoutButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
});
