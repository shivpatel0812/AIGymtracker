import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Card, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

export const WorkoutCompleteScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  const handleViewHistory = () => {
    navigation.navigate("History" as never);
  };

  const handleNewWorkout = () => {
    navigation.navigate("DayPicker" as never);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <Card style={styles.successCard}>
          <Card.Content style={styles.cardContent}>
            <Text variant="displaySmall" style={styles.successIcon}>
              🎉
            </Text>
            <Text variant="headlineMedium" style={styles.title}>
              Workout Complete!
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Great job! Your workout has been saved successfully.
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.statsContainer}>
          <Text variant="titleMedium" style={styles.statsTitle}>
            Keep up the momentum:
          </Text>
          <Text variant="bodyMedium" style={styles.statsText}>
            • Track your progress over time{"\n"}• Compare performance between
            sessions{"\n"}• Build consistency in your routine
          </Text>
        </View>
      </View>

      <View style={[styles.actions, { borderTopColor: theme.colors.outline }]}>
        <Button
          mode="contained"
          onPress={handleViewHistory}
          style={styles.historyButton}
          icon="history"
        >
          View History
        </Button>

        <Button
          mode="outlined"
          onPress={handleNewWorkout}
          style={styles.newWorkoutButton}
          icon="plus"
        >
          Start New Workout
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  successCard: {
    marginBottom: 32,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.05)",
  },
  cardContent: {
    alignItems: "center",
    padding: 32,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 12,
    color: "#00FF94",
  },
  subtitle: {
    textAlign: "center",
    color: "#B0B0B0",
    lineHeight: 24,
  },
  statsContainer: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 20,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.05)",
  },
  statsTitle: {
    marginBottom: 12,
  },
  statsText: {
    lineHeight: 24,
    color: "#B0B0B0",
  },
  actions: {
    padding: 20,
    borderTopWidth: 1,
  },
  historyButton: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  newWorkoutButton: {
    paddingVertical: 8,
  },
});
