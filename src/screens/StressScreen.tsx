import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  Button,
  TextInput,
  Card,
  useTheme,
  Chip,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { StressEntry } from "../types";
import { saveStressEntry, getTodayStress } from "../services/stress";
import { colors } from "../config/theme";

export const StressScreen: React.FC = () => {
  const [stressLevel, setStressLevel] = useState(5);
  const [stressFactors, setStressFactors] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [todayEntry, setTodayEntry] = useState<StressEntry | null>(null);

  const theme = useTheme();
  const navigation = useNavigation();

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadTodayEntry();
  }, []);

  const loadTodayEntry = async () => {
    try {
      const entry = await getTodayStress(today);
      if (entry) {
        setTodayEntry(entry);
        setStressLevel(entry.stress_level);
        setStressFactors(entry.stress_factors || "");
      }
    } catch (error) {
      console.error("Error loading today's stress:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const stressEntry: StressEntry = {
        date: today,
        stress_level: stressLevel,
        stress_factors: stressFactors.trim() || null,
      };

      await saveStressEntry(stressEntry);
      Alert.alert("Success", "Stress level logged successfully!");
      setTodayEntry(stressEntry);
    } catch (error) {
      console.error("Error saving stress:", error);
      Alert.alert("Error", "Failed to save stress level");
    } finally {
      setIsSaving(false);
    }
  };

  const stressOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const getStressColor = (level: number) => {
    if (level <= 3) return "#4CAF50";
    if (level <= 6) return "#FF9800";
    return "#F44336";
  };

  const getStressLabel = (level: number) => {
    if (level <= 3) return "Low";
    if (level <= 6) return "Moderate";
    return "High";
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Daily Stress Level
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Track your stress level and contributing factors for {today}
          </Text>

          <View style={styles.inputSection}>
            <Text variant="titleMedium" style={styles.label}>
              Stress Level (1-10)
            </Text>
            <Text variant="bodySmall" style={[styles.stressIndicator, { color: getStressColor(stressLevel) }]}>
              {getStressLabel(stressLevel)} Stress
            </Text>
            <View style={styles.chipContainer}>
              {stressOptions.map((level) => (
                <Chip
                  key={level}
                  selected={stressLevel === level}
                  onPress={() => setStressLevel(level)}
                  style={[
                    styles.chip,
                    stressLevel === level && { backgroundColor: getStressColor(level) }
                  ]}
                  textStyle={stressLevel === level && { color: "#fff" }}
                >
                  {level}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text variant="titleMedium" style={styles.label}>
              Stress Factors (Optional)
            </Text>
            <TextInput
              mode="outlined"
              value={stressFactors}
              onChangeText={setStressFactors}
              placeholder="e.g., Work deadline, traffic, family issues"
              multiline
              numberOfLines={3}
              style={styles.textInput}
            />
          </View>

          {todayEntry && (
            <View style={styles.currentEntry}>
              <Text variant="titleSmall" style={styles.currentTitle}>
                Current Entry:
              </Text>
              <Text variant="bodyMedium">
                Stress Level: {todayEntry.stress_level}/10 ({getStressLabel(todayEntry.stress_level)})
              </Text>
              {todayEntry.stress_factors && (
                <Text variant="bodyMedium">
                  Factors: {todayEntry.stress_factors}
                </Text>
              )}
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            style={styles.saveButton}
            buttonColor={colors.neonCyan}
            textColor={theme.colors.surface}
          >
            {todayEntry ? "Update" : "Save"} Stress Level
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    fontWeight: "500",
  },
  stressIndicator: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  currentEntry: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    marginBottom: 24,
  },
  currentTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  saveButton: {
    marginTop: 8,
  },
});