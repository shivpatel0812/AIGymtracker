import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Text, Card, Button, TextInput, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { WorkoutSplit, UserProfile } from "../types";
import { saveUserProfile } from "../services/workouts";
import { useAuth } from "../contexts/AuthContext";

const SPLITS = [
  {
    id: "PPL",
    name: "Push/Pull/Legs",
    description: "3-day split focusing on push, pull, and leg movements",
  },
  {
    id: "UL",
    name: "Upper/Lower",
    description: "4-day split alternating upper and lower body",
  },
  {
    id: "FB",
    name: "Full Body",
    description: "3-day split working entire body each session",
  },
  { id: "Custom", name: "Custom", description: "Create your own split" },
];

export const SplitSetupScreen: React.FC = () => {
  const [selectedSplit, setSelectedSplit] = useState<WorkoutSplit>("PPL");
  const [customDays, setCustomDays] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    console.log("SplitSetupScreen mounted, user:", user?.uid);
  }, [user]);

  const handleSave = async () => {
    console.log("handleSave called with selectedSplit:", selectedSplit);
    console.log("Current user:", user?.uid);
    setIsLoading(true);
    try {
      if (!selectedSplit) {
        throw new Error("Please select a workout split");
      }

      const dayOrder = getDayOrder(selectedSplit);

      if (!Array.isArray(dayOrder) || dayOrder.length === 0) {
        throw new Error("Invalid day order generated");
      }

      const profile: UserProfile = {
        split: selectedSplit,
        dayOrder: dayOrder,
      };

      await saveUserProfile(profile);
      navigation.navigate("DayPicker" as never);
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getDayOrder = (split: WorkoutSplit): string[] => {
    switch (split) {
      case "PPL":
        return ["Push", "Pull", "Legs"];
      case "UL":
        return ["Upper", "Lower"];
      case "FB":
        return ["Full Body"];
      case "Custom":
        return customDays
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean);
      default:
        return ["Push", "Pull", "Legs"]; // fallback
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium">Choose Your Workout Split</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Select a split that fits your schedule and goals
        </Text>
      </View>

      <View style={styles.splitsContainer}>
        {SPLITS.map((split) => (
          <Card
            key={split.id}
            style={[
              styles.splitCard,
              selectedSplit === split.id && styles.selectedCard,
            ]}
            onPress={() => setSelectedSplit(split.id as WorkoutSplit)}
          >
            <Card.Content>
              <Text variant="titleMedium">{split.name}</Text>
              <Text variant="bodySmall" style={styles.description}>
                {split.description}
              </Text>
              {selectedSplit === split.id && (
                <View style={styles.dayOrder}>
                  <Text variant="bodySmall" style={styles.dayOrderLabel}>
                    Days: {getDayOrder(split.id as WorkoutSplit).join(" • ")}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        ))}
      </View>

      {selectedSplit === "Custom" && (
        <View style={styles.customSection}>
          <Text variant="titleMedium">Custom Split</Text>
          <TextInput
            mode="outlined"
            label="Enter day names (comma-separated)"
            value={customDays}
            onChangeText={setCustomDays}
            placeholder="e.g., Push, Pull, Legs, Rest"
            style={styles.customInput}
          />
        </View>
      )}

      <Button
        mode="contained"
        onPress={handleSave}
        loading={isLoading}
        disabled={selectedSplit === "Custom" && !customDays.trim()}
        style={styles.saveButton}
      >
        Continue
      </Button>
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
  splitsContainer: {
    padding: 20,
  },
  splitCard: {
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 18,
  },
  selectedCard: {
    borderColor: "#00E5FF",
    backgroundColor: "rgba(0,229,255,0.06)",
  },
  description: {
    marginTop: 8,
    color: "#B0B0B0",
  },
  dayOrder: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.05)",
  },
  dayOrderLabel: {
    fontWeight: "bold",
    color: "#00E5FF",
  },
  customSection: {
    padding: 20,
  },
  customInput: {
    marginTop: 8,
  },
  saveButton: {
    margin: 20,
  },
});
