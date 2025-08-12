import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Card,
  Chip,
  Divider,
  Button,
  useTheme,
} from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Workout } from "../types";

interface RouteParams {
  workout: Workout;
}

export const WorkoutDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const theme = useTheme();
  const { workout } = route.params as RouteParams;

  const formatDate = (dateISO: string): string => {
    const date = new Date(dateISO);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getWorkingSets = (): number => {
    return workout.exercises.reduce(
      (total, exercise) =>
        total + exercise.sets.filter((set) => !set.isWarmup).length,
      0
    );
  };

  const getTotalSets = (): number => {
    return workout.exercises.reduce(
      (total, exercise) => total + exercise.sets.length,
      0
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    >
      <View
        style={[styles.header, { borderBottomColor: theme.colors.outline }]}
      >
        <Text variant="headlineMedium">{workout.dayType} Workout</Text>
        <Text variant="bodyLarge" style={styles.date}>
          {formatDate(workout.dateISO)}
        </Text>

        <View style={styles.statsRow}>
          <Chip icon="dumbbell" style={styles.statChip}>
            {workout.exercises.length} exercises
          </Chip>
          <Chip icon="repeat" style={styles.statChip}>
            {getWorkingSets()} working sets
          </Chip>
          <Chip icon="layers" style={styles.statChip}>
            {getTotalSets()} total sets
          </Chip>
        </View>

        <Button
          mode="contained"
          onPress={() =>
            (navigation as any).navigate("LogWorkout", {
              workout,
              mode: "edit",
            })
          }
          style={{ marginTop: 12 }}
        >
          Edit Workout
        </Button>
      </View>

      {workout.notes && (
        <Card style={styles.notesCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.notesTitle}>
              Notes
            </Text>
            <Text variant="bodyMedium" style={styles.notesText}>
              {workout.notes}
            </Text>
          </Card.Content>
        </Card>
      )}

      <View style={styles.exercisesSection}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Exercises
        </Text>

        {workout.exercises.map((exercise, exerciseIndex) => (
          <Card key={exerciseIndex} style={styles.exerciseCard}>
            <Card.Content>
              <View style={styles.exerciseHeader}>
                <Text variant="titleMedium">{exercise.name}</Text>
                {exercise.variant && (
                  <Chip mode="outlined" style={styles.variantChip}>
                    {exercise.variant}
                  </Chip>
                )}
              </View>

              <View style={styles.setsContainer}>
                {exercise.sets.map((set, setIndex) => (
                  <View key={setIndex} style={styles.setRow}>
                    <View style={styles.setInfo}>
                      <Text variant="bodyMedium" style={styles.setNumber}>
                        Set {set.index}
                      </Text>
                      <Text variant="bodyLarge" style={styles.setDetails}>
                        {set.weight} × {set.reps}
                      </Text>
                      {set.rpe && (
                        <Text variant="bodySmall" style={styles.rpe}>
                          RPE {set.rpe}
                        </Text>
                      )}
                    </View>

                    <View style={styles.setMeta}>
                      {set.isWarmup && (
                        <Chip mode="outlined" style={styles.warmupChip}>
                          Warmup
                        </Chip>
                      )}
                      {set.note && (
                        <Text variant="bodySmall" style={styles.setNote}>
                          {set.note}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
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
  date: {
    marginTop: 8,
    color: "#B0B0B0",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 8,
  },
  statChip: {
    marginRight: 8,
  },
  notesCard: {
    margin: 20,
    marginTop: 0,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.05)",
  },
  notesTitle: {
    marginBottom: 8,
  },
  notesText: {
    lineHeight: 20,
  },
  exercisesSection: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  exerciseCard: {
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.05)",
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  variantChip: {
    height: 28,
  },
  setsContainer: {
    gap: 12,
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.05)",
  },
  setInfo: {
    flex: 1,
  },
  setNumber: {
    color: "#B0B0B0",
    marginBottom: 4,
  },
  setDetails: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  rpe: {
    color: "#00E5FF",
    fontWeight: "500",
  },
  setMeta: {
    alignItems: "flex-end",
  },
  warmupChip: {
    marginBottom: 4,
  },
  setNote: {
    color: "#B0B0B0",
    fontStyle: "italic",
    textAlign: "right",
    maxWidth: 120,
  },
});
