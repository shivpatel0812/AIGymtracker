import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  Button,
  TextInput,
  Card,
  useTheme,
  Chip,
  IconButton,
  Divider,
  Portal,
  Modal,
} from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { HydrationEntry, StressEntry, MacroEntry } from "../types";
import { saveHydrationEntry, getTodayHydration } from "../services/hydration";
import { saveStressEntry, getTodayStress } from "../services/stress";
import { saveMacroEntry, getTodayMacros } from "../services/macros";
import { colors } from "../config/theme";

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const DailyDataScreen: React.FC = () => {
  const [hydrationData, setHydrationData] = useState<HydrationEntry | null>(
    null
  );
  const [stressData, setStressData] = useState<StressEntry | null>(null);
  const [macroData, setMacroData] = useState<MacroEntry | null>(null);

  const [waterIntake, setWaterIntake] = useState("");
  const [hydrationQuality, setHydrationQuality] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [stressFactors, setStressFactors] = useState("");
  const [foods, setFoods] = useState<FoodItem[]>([]);

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as any;
  const selectedDate = params?.date || new Date().toISOString().split("T")[0];

  const cupsToLiters = (cups: number) => cups * 0.236588;
  const litersToCups = (liters: number) =>
    Math.round((liters / 0.236588) * 100) / 100;

  useEffect(() => {
    loadDayData();
  }, [selectedDate]);

  const loadDayData = async () => {
    try {
      const [hydration, stress, macros] = await Promise.all([
        getTodayHydration(selectedDate),
        getTodayStress(selectedDate),
        getTodayMacros(selectedDate),
      ]);

      setHydrationData(hydration);
      setStressData(stress);
      setMacroData(macros);

      if (hydration) {
        setWaterIntake(litersToCups(hydration.water_intake).toString());
        setHydrationQuality(hydration.hydration_quality);
      }

      if (stress) {
        setStressLevel(stress.stress_level);
        setStressFactors(stress.stress_factors || "");
      }

      if (macros) {
        setFoods(macros.foods);
      }
    } catch (error) {
      console.error("Error loading day data:", error);
    }
  };

  const saveHydration = async () => {
    if (!waterIntake.trim()) {
      Alert.alert("Error", "Please enter water intake");
      return;
    }

    const waterIntakeCups = parseFloat(waterIntake);
    if (isNaN(waterIntakeCups) || waterIntakeCups < 0) {
      Alert.alert("Error", "Please enter valid water intake");
      return;
    }

    setIsSaving(true);
    try {
      const entry: HydrationEntry = {
        date: selectedDate,
        water_intake: cupsToLiters(waterIntakeCups),
        hydration_quality: hydrationQuality,
      };

      await saveHydrationEntry(entry);
      setHydrationData(entry);
      setEditingSection(null);
      Alert.alert("Success", "Hydration saved!");
    } catch (error) {
      Alert.alert("Error", "Failed to save hydration");
    } finally {
      setIsSaving(false);
    }
  };

  const saveStress = async () => {
    setIsSaving(true);
    try {
      const entry: StressEntry = {
        date: selectedDate,
        stress_level: stressLevel,
        stress_factors: stressFactors.trim() || null,
      };

      await saveStressEntry(entry);
      setStressData(entry);
      setEditingSection(null);
      Alert.alert("Success", "Stress level saved!");
    } catch (error) {
      Alert.alert("Error", "Failed to save stress level");
    } finally {
      setIsSaving(false);
    }
  };

  const saveMacros = async () => {
    const validFoods = foods.filter((food) => food.name.trim() !== "");
    if (validFoods.length === 0) {
      Alert.alert("Error", "Please add at least one food item");
      return;
    }

    setIsSaving(true);
    try {
      const entry: MacroEntry = {
        date: selectedDate,
        foods: validFoods,
      };

      await saveMacroEntry(entry);
      setMacroData(entry);
      setEditingSection(null);
      Alert.alert("Success", "Macros saved!");
    } catch (error) {
      Alert.alert("Error", "Failed to save macros");
    } finally {
      setIsSaving(false);
    }
  };

  const addFoodItem = () => {
    setFoods([
      ...foods,
      { name: "", calories: 0, protein: 0, carbs: 0, fat: 0 },
    ]);
  };

  const removeFoodItem = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  const updateFoodItem = (
    index: number,
    field: keyof FoodItem,
    value: string | number
  ) => {
    const updatedFoods = [...foods];
    if (typeof value === "string" && field !== "name") {
      (updatedFoods[index] as any)[field] = parseFloat(value) || 0;
    } else if (field === "name" && typeof value === "string") {
      updatedFoods[index].name = value;
    } else if (typeof value === "number") {
      (updatedFoods[index] as any)[field] = value;
    }
    setFoods(updatedFoods);
  };

  const calculateTotals = () => {
    return foods.reduce(
      (totals, food) => ({
        calories: totals.calories + food.calories,
        protein: totals.protein + food.protein,
        carbs: totals.carbs + food.carbs,
        fat: totals.fat + food.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const totals = calculateTotals();
  const qualityOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="headlineSmall" style={styles.dateTitle}>
        {formatDate(selectedDate)}
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium">💧 Hydration</Text>
            <IconButton
              icon={editingSection === "hydration" ? "check" : "pencil"}
              size={20}
              onPress={() => {
                if (editingSection === "hydration") {
                  saveHydration();
                } else {
                  setEditingSection("hydration");
                }
              }}
              disabled={isSaving}
            />
          </View>

          {editingSection === "hydration" ? (
            <View>
              <TextInput
                mode="outlined"
                label="Water Intake (cups)"
                value={waterIntake}
                onChangeText={setWaterIntake}
                placeholder="e.g., 8"
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <Text variant="bodySmall" style={styles.conversionText}>
                {waterIntake && !isNaN(parseFloat(waterIntake))
                  ? `≈ ${cupsToLiters(parseFloat(waterIntake)).toFixed(
                      2
                    )} liters`
                  : "1 cup = 0.24 liters"}
              </Text>
              <Text variant="titleSmall" style={styles.label}>
                Quality (1-10)
              </Text>
              <View style={styles.chipContainer}>
                {qualityOptions.map((quality) => (
                  <Chip
                    key={quality}
                    selected={hydrationQuality === quality}
                    onPress={() => setHydrationQuality(quality)}
                    style={[
                      styles.chip,
                      hydrationQuality === quality && {
                        backgroundColor: colors.neonCyan,
                      },
                    ]}
                    textStyle={
                      hydrationQuality === quality && {
                        color: theme.colors.surface,
                      }
                    }
                  >
                    {quality}
                  </Chip>
                ))}
              </View>
            </View>
          ) : (
            <View>
              {hydrationData ? (
                <Text variant="bodyMedium">
                  {litersToCups(hydrationData.water_intake)} cups • Quality:{" "}
                  {hydrationData.hydration_quality}/10
                </Text>
              ) : (
                <Text variant="bodyMedium" style={{ opacity: 0.6 }}>
                  No hydration data logged
                </Text>
              )}
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium">😰 Stress Level</Text>
            <IconButton
              icon={editingSection === "stress" ? "check" : "pencil"}
              size={20}
              onPress={() => {
                if (editingSection === "stress") {
                  saveStress();
                } else {
                  setEditingSection("stress");
                }
              }}
              disabled={isSaving}
            />
          </View>

          {editingSection === "stress" ? (
            <View>
              <Text variant="titleSmall" style={styles.label}>
                Stress Level (1-10)
              </Text>
              <View style={styles.chipContainer}>
                {qualityOptions.map((level) => (
                  <Chip
                    key={level}
                    selected={stressLevel === level}
                    onPress={() => setStressLevel(level)}
                    style={[
                      styles.chip,
                      stressLevel === level && {
                        backgroundColor: colors.neonCyan,
                      },
                    ]}
                    textStyle={
                      stressLevel === level && { color: theme.colors.surface }
                    }
                  >
                    {level}
                  </Chip>
                ))}
              </View>
              <TextInput
                mode="outlined"
                label="Stress Factors (Optional)"
                value={stressFactors}
                onChangeText={setStressFactors}
                placeholder="e.g., Work deadline, traffic"
                multiline
                style={styles.input}
              />
            </View>
          ) : (
            <View>
              {stressData ? (
                <View>
                  <Text variant="bodyMedium">
                    Level: {stressData.stress_level}/10
                  </Text>
                  {stressData.stress_factors && (
                    <Text variant="bodyMedium">
                      Factors: {stressData.stress_factors}
                    </Text>
                  )}
                </View>
              ) : (
                <Text variant="bodyMedium" style={{ opacity: 0.6 }}>
                  No stress data logged
                </Text>
              )}
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium">🍽️ Macros</Text>
            <IconButton
              icon={editingSection === "macros" ? "check" : "pencil"}
              size={20}
              onPress={() => {
                if (editingSection === "macros") {
                  saveMacros();
                } else {
                  setEditingSection("macros");
                  if (!macroData && foods.length === 0) {
                    addFoodItem();
                  }
                }
              }}
              disabled={isSaving}
            />
          </View>

          {editingSection === "macros" ? (
            <View>
              <View style={styles.totalsGrid}>
                <View style={styles.totalItem}>
                  <Text variant="titleSmall">Calories</Text>
                  <Text
                    variant="headlineSmall"
                    style={{ color: colors.neonCyan }}
                  >
                    {totals.calories}
                  </Text>
                </View>
                <View style={styles.totalItem}>
                  <Text variant="titleSmall">Protein</Text>
                  <Text
                    variant="headlineSmall"
                    style={{ color: colors.neonCyan }}
                  >
                    {totals.protein}g
                  </Text>
                </View>
                <View style={styles.totalItem}>
                  <Text variant="titleSmall">Carbs</Text>
                  <Text
                    variant="headlineSmall"
                    style={{ color: colors.neonCyan }}
                  >
                    {totals.carbs}g
                  </Text>
                </View>
                <View style={styles.totalItem}>
                  <Text variant="titleSmall">Fat</Text>
                  <Text
                    variant="headlineSmall"
                    style={{ color: colors.neonCyan }}
                  >
                    {totals.fat}g
                  </Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.sectionHeader}>
                <Text variant="titleSmall">Food Items</Text>
                <Button mode="outlined" onPress={addFoodItem} compact>
                  Add Food
                </Button>
              </View>

              {foods.map((food, index) => (
                <Card key={index} style={styles.foodCard}>
                  <Card.Content>
                    <View style={styles.sectionHeader}>
                      <Text variant="titleSmall">Food {index + 1}</Text>
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => removeFoodItem(index)}
                      />
                    </View>

                    <TextInput
                      mode="outlined"
                      label="Food Name"
                      value={food.name}
                      onChangeText={(value) =>
                        updateFoodItem(index, "name", value)
                      }
                      style={styles.input}
                    />

                    <View style={styles.macroInputs}>
                      <TextInput
                        mode="outlined"
                        label="Calories"
                        value={food.calories.toString()}
                        onChangeText={(value) =>
                          updateFoodItem(index, "calories", value)
                        }
                        keyboardType="numeric"
                        style={styles.macroInput}
                      />
                      <TextInput
                        mode="outlined"
                        label="Protein (g)"
                        value={food.protein.toString()}
                        onChangeText={(value) =>
                          updateFoodItem(index, "protein", value)
                        }
                        keyboardType="numeric"
                        style={styles.macroInput}
                      />
                      <TextInput
                        mode="outlined"
                        label="Carbs (g)"
                        value={food.carbs.toString()}
                        onChangeText={(value) =>
                          updateFoodItem(index, "carbs", value)
                        }
                        keyboardType="numeric"
                        style={styles.macroInput}
                      />
                      <TextInput
                        mode="outlined"
                        label="Fat (g)"
                        value={food.fat.toString()}
                        onChangeText={(value) =>
                          updateFoodItem(index, "fat", value)
                        }
                        keyboardType="numeric"
                        style={styles.macroInput}
                      />
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          ) : (
            <View>
              {macroData ? (
                <View>
                  <View style={styles.totalsGrid}>
                    <View style={styles.totalItem}>
                      <Text variant="titleSmall">Calories</Text>
                      <Text
                        variant="headlineSmall"
                        style={{ color: colors.neonCyan }}
                      >
                        {macroData.foods.reduce(
                          (sum, f) => sum + f.calories,
                          0
                        )}
                      </Text>
                    </View>
                    <View style={styles.totalItem}>
                      <Text variant="titleSmall">Protein</Text>
                      <Text
                        variant="headlineSmall"
                        style={{ color: colors.neonCyan }}
                      >
                        {macroData.foods.reduce((sum, f) => sum + f.protein, 0)}
                        g
                      </Text>
                    </View>
                    <View style={styles.totalItem}>
                      <Text variant="titleSmall">Carbs</Text>
                      <Text
                        variant="headlineSmall"
                        style={{ color: colors.neonCyan }}
                      >
                        {macroData.foods.reduce((sum, f) => sum + f.carbs, 0)}g
                      </Text>
                    </View>
                    <View style={styles.totalItem}>
                      <Text variant="titleSmall">Fat</Text>
                      <Text
                        variant="headlineSmall"
                        style={{ color: colors.neonCyan }}
                      >
                        {macroData.foods.reduce((sum, f) => sum + f.fat, 0)}g
                      </Text>
                    </View>
                  </View>
                  <Text
                    variant="bodySmall"
                    style={{ marginTop: 8, opacity: 0.7 }}
                  >
                    {macroData.foods.length} food items logged
                  </Text>
                </View>
              ) : (
                <Text variant="bodyMedium" style={{ opacity: 0.6 }}>
                  No macro data logged
                </Text>
              )}
            </View>
          )}
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
  dateTitle: {
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  input: {
    marginBottom: 8,
  },
  label: {
    marginBottom: 8,
    fontWeight: "500",
  },
  conversionText: {
    marginBottom: 12,
    opacity: 0.7,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    marginBottom: 4,
  },
  totalsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  totalItem: {
    alignItems: "center",
    minWidth: "23%",
  },
  divider: {
    marginVertical: 16,
  },
  foodCard: {
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  macroInputs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  macroInput: {
    flex: 1,
    minWidth: "45%",
  },
});
