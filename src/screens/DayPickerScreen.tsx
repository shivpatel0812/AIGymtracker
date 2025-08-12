import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Text, Card, Button, Chip, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { getUserProfile } from "../services/workouts";
import { getDayTypeState } from "../services/snapshots";
import { useWorkoutDraft } from "../store/useWorkoutDraft";
import { Workout, DayType } from "../types";

export const DayPickerScreen: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [dayStates, setDayStates] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();
  const { setCurrentWorkout } = useWorkoutDraft();
  const theme = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProfile();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await getUserProfile();
      setProfile(userProfile);

      if (userProfile?.dayOrder) {
        const states: Record<string, any> = {};
        for (const dayType of userProfile.dayOrder) {
          try {
            const state = await getDayTypeState(dayType);
            if (state) {
              states[dayType] = state;
            }
          } catch (error) {
            console.error(`Error loading state for ${dayType}:`, error);
            states[dayType] = null;
          }
        }
        setDayStates(states);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      if ((error as Error).message.includes("token expired")) {
        Alert.alert("Authentication Error", "Please sign in again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDaySelect = (dayType: DayType) => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const workout: Workout = {
      dateISO: today.toISOString(),
      dayType,
      exercises: [],
      notes: "",
    };

    setCurrentWorkout(workout);
    navigation.navigate("LogWorkout" as never);
  };

  const getDayOrder = (): string[] => {
    if (!profile) return [];

    switch (profile.split) {
      case "PPL":
        return ["Push", "Pull", "Legs"];
      case "UL":
        return ["Upper", "Lower"];
      case "FB":
        return ["Full Body"];
      case "Custom":
        return profile.dayOrder || [];
      default:
        return [];
    }
  };

  const formatDate = (dateISO: string): string => {
    const date = new Date(dateISO);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text>No profile found. Please set up your split first.</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium">Today's Workout</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Choose which day type to train
        </Text>
      </View>

      <View style={styles.daysContainer}>
        {getDayOrder().map((dayType) => {
          const lastWorkout = dayStates[dayType]?.lastWorkout;

          return (
            <Card
              key={dayType}
              style={styles.dayCard}
              onPress={() => handleDaySelect(dayType as DayType)}
            >
              <Card.Content>
                <View style={styles.dayHeader}>
                  <Text variant="titleLarge">{dayType}</Text>
                  <Button mode="contained" compact>
                    Start Workout
                  </Button>
                </View>

                {lastWorkout ? (
                  <View style={styles.lastWorkoutInfo}>
                    <Chip icon="calendar" style={styles.chip}>
                      Last: {formatDate(lastWorkout.dateISO)}
                    </Chip>
                    <Chip icon="dumbbell" style={styles.chip}>
                      {lastWorkout.totalExercises} exercises
                    </Chip>
                    <Chip icon="repeat" style={styles.chip}>
                      {lastWorkout.totalWorkingSets} sets
                    </Chip>
                  </View>
                ) : (
                  <Text style={styles.noHistory}>No previous workouts</Text>
                )}
              </Card.Content>
            </Card>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate("History" as never)}
          style={styles.historyButton}
        >
          View History
        </Button>
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
    alignItems: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 8,
    color: "#B0B0B0",
  },
  daysContainer: {
    padding: 20,
  },
  dayCard: {
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.05)",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  lastWorkoutInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  noHistory: {
    fontStyle: "italic",
    color: "#B0B0B0",
  },
  actions: {
    padding: 20,
  },
  historyButton: {
    marginBottom: 20,
  },
});
