import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, FlatList } from "react-native";
import {
  Text,
  Button,
  TextInput,
  Card,
  useTheme,
  Chip,
  IconButton,
  Divider,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { HydrationEntry } from "../types";
import { saveHydrationEntry, getTodayHydration, getHydrationHistory } from "../services/hydration";
import { colors } from "../config/theme";

export const HydrationScreen: React.FC = () => {
  const [waterIntake, setWaterIntake] = useState("");
  const [hydrationQuality, setHydrationQuality] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [todayEntry, setTodayEntry] = useState<HydrationEntry | null>(null);
  const [historyEntries, setHistoryEntries] = useState<HydrationEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<HydrationEntry | null>(null);

  const theme = useTheme();
  const navigation = useNavigation();

  const today = new Date().toISOString().split('T')[0];

  const cupsToLiters = (cups: number) => cups * 0.236588;
  const litersToCups = (liters: number) => Math.round(liters / 0.236588 * 100) / 100;

  useEffect(() => {
    loadTodayEntry();
    loadHistory();
  }, []);

  const loadTodayEntry = async () => {
    try {
      const entry = await getTodayHydration(today);
      if (entry) {
        setTodayEntry(entry);
        setWaterIntake(litersToCups(entry.water_intake).toString());
        setHydrationQuality(entry.hydration_quality);
      }
    } catch (error) {
      console.error("Error loading today's hydration:", error);
    }
  };

  const loadHistory = async () => {
    try {
      const entries = await getHydrationHistory(10);
      setHistoryEntries(entries);
    } catch (error) {
      console.error("Error loading hydration history:", error);
    }
  };

  const handleSave = async () => {
    if (!waterIntake.trim()) {
      Alert.alert("Error", "Please enter water intake");
      return;
    }

    const waterIntakeCups = parseFloat(waterIntake);
    if (isNaN(waterIntakeCups) || waterIntakeCups < 0) {
      Alert.alert("Error", "Please enter a valid water intake");
      return;
    }

    setIsSaving(true);
    try {
      const dateToSave = editingEntry ? editingEntry.date : today;
      const hydrationEntry: HydrationEntry = {
        date: dateToSave,
        water_intake: cupsToLiters(waterIntakeCups),
        hydration_quality: hydrationQuality,
      };

      await saveHydrationEntry(hydrationEntry);
      Alert.alert("Success", "Hydration logged successfully!");
      
      if (dateToSave === today) {
        setTodayEntry(hydrationEntry);
      }
      
      setEditingEntry(null);
      setWaterIntake("");
      setHydrationQuality(5);
      loadHistory();
    } catch (error) {
      console.error("Error saving hydration:", error);
      Alert.alert("Error", "Failed to save hydration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditEntry = (entry: HydrationEntry) => {
    setEditingEntry(entry);
    setWaterIntake(litersToCups(entry.water_intake).toString());
    setHydrationQuality(entry.hydration_quality);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    if (todayEntry) {
      setWaterIntake(litersToCups(todayEntry.water_intake).toString());
      setHydrationQuality(todayEntry.hydration_quality);
    } else {
      setWaterIntake("");
      setHydrationQuality(5);
    }
  };

  const qualityOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Daily Hydration
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Track your water intake and hydration quality for {today}
          </Text>

          <View style={styles.inputSection}>
            <Text variant="titleMedium" style={styles.label}>
              Water Intake (cups)
            </Text>
            <TextInput
              mode="outlined"
              value={waterIntake}
              onChangeText={setWaterIntake}
              placeholder="e.g., 8"
              keyboardType="decimal-pad"
              style={styles.textInput}
            />
            <Text variant="bodySmall" style={styles.conversionText}>
              {waterIntake && !isNaN(parseFloat(waterIntake)) ? 
                `≈ ${cupsToLiters(parseFloat(waterIntake)).toFixed(2)} liters` : 
                "1 cup = 0.24 liters"}
            </Text>
          </View>

          <View style={styles.inputSection}>
            <Text variant="titleMedium" style={styles.label}>
              Hydration Quality (1-10)
            </Text>
            <View style={styles.chipContainer}>
              {qualityOptions.map((quality) => (
                <Chip
                  key={quality}
                  selected={hydrationQuality === quality}
                  onPress={() => setHydrationQuality(quality)}
                  style={[
                    styles.chip,
                    hydrationQuality === quality && { backgroundColor: colors.neonCyan }
                  ]}
                  textStyle={hydrationQuality === quality && { color: theme.colors.surface }}
                >
                  {quality}
                </Chip>
              ))}
            </View>
          </View>

          {editingEntry && (
            <View style={styles.editingBanner}>
              <Text variant="titleSmall" style={styles.editingTitle}>
                Editing {editingEntry.date}
              </Text>
              <Button
                mode="text"
                onPress={handleCancelEdit}
                textColor={colors.neonCyan}
              >
                Cancel
              </Button>
            </View>
          )}

          {todayEntry && !editingEntry && (
            <View style={styles.currentEntry}>
              <Text variant="titleSmall" style={styles.currentTitle}>
                Today's Entry:
              </Text>
              <Text variant="bodyMedium">
                Water: {litersToCups(todayEntry.water_intake)} cups | Quality: {todayEntry.hydration_quality}/10
              </Text>
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
            {editingEntry ? "Update" : todayEntry && !editingEntry ? "Update Today" : "Save"} Hydration
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