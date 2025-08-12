import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import {
  Card,
  Title,
  Text,
  Button,
  IconButton,
  TextInput,
  useTheme,
} from "react-native-paper";
import { ExerciseEntry, SetEntry } from "../types";
import { SetRow } from "./SetRow";
import { getExerciseState } from "../services/snapshots";
import { useWorkoutDraft } from "../store/useWorkoutDraft";

interface ExerciseCardProps {
  exercise: ExerciseEntry;
  index: number;
  onRemove: () => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  index,
  onRemove,
}) => {
  const [lastSession, setLastSession] = useState<any>(null);
  const { updateExercise, addSet, removeSet, updateSet } = useWorkoutDraft();
  const theme = useTheme();

  useEffect(() => {
    const loadLastSession = async () => {
      try {
        const state = await getExerciseState(exercise.exerciseId);
        if (state?.lastSession) {
          setLastSession(state.lastSession);
        }
      } catch (error) {
        console.error("Error loading last session:", error);
      }
    };
    loadLastSession();
  }, [exercise.exerciseId]);

  const handleAddSet = () => {
    addSet(index);
  };

  const handleRemoveSet = (setIndex: number) => {
    removeSet(index, setIndex);
  };

  const handleUpdateSet = (setIndex: number, updates: Partial<SetEntry>) => {
    updateSet(index, setIndex, updates);
  };

  const handleCopyLast = () => {
    if (!lastSession?.sets) return;

    const updatedExercise = {
      ...exercise,
      sets: lastSession.sets.map((set: any, i: number) => ({
        index: i + 1,
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe || null,
        isWarmup: false,
        note: null,
      })),
    };

    updateExercise(index, updatedExercise);
  };

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Title>{exercise.name}</Title>
            {exercise.variant && (
              <Text style={styles.variant}>{exercise.variant}</Text>
            )}
          </View>
          <IconButton icon="delete" size={20} onPress={onRemove} />
        </View>

        {lastSession && (
          <View style={styles.lastSessionInfo}>
            <Text style={styles.lastSessionText}>
              Last {lastSession.dayType}: {lastSession.dateISO.split("T")[0]}
            </Text>
            <Button mode="text" onPress={handleCopyLast} compact>
              Copy Last
            </Button>
          </View>
        )}

        {exercise.sets.map((set, setIndex) => (
          <SetRow
            key={setIndex}
            set={set}
            index={set.index}
            lastSet={lastSession?.sets?.[setIndex]}
            onUpdate={(updates) => handleUpdateSet(setIndex, updates)}
            onRemove={() => handleRemoveSet(setIndex)}
          />
        ))}

        <Button
          mode="outlined"
          onPress={handleAddSet}
          style={styles.addSetButton}
        >
          Add Set
        </Button>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
  },
  variant: {
    fontSize: 14,
    color: "#B0B0B0",
    fontStyle: "italic",
  },
  lastSessionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,229,255,0.08)",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.05)",
  },
  lastSessionText: {
    fontSize: 12,
    color: "#00E5FF",
  },
  addSetButton: {
    marginTop: 8,
  },
});
