import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text, Card, useTheme, Button, FAB } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getFoodEntriesByDate } from "../services/food";
import { FoodEntry } from "../types";
import {
  getComprehensiveAnalysis,
  getNutritionAnalysis,
  getWorkoutAnalysis,
} from "../services/analysis";
import { colors } from "../config/theme";
import { useAgent } from "../hooks/useAgent";
import { AgentInterface } from "../components/AgentInterface";

const HEALTH_SECTIONS = [
  {
    id: "workouts",
    title: "Workouts",
    description: "Track your exercise routines",
    icon: "dumbbell",
    color: "#00E5FF",
    screen: "SplitSetup",
  },
  {
    id: "hydration",
    title: "Hydration",
    description: "Monitor your water intake",
    icon: "water",
    color: "#2196F3",
    screen: "Hydration",
  },
  {
    id: "stress",
    title: "Stress",
    description: "Monitor stress levels",
    icon: "heart-pulse",
    color: "#F44336",
    screen: "Stress",
  },
  {
    id: "sleep",
    title: "Sleep",
    description: "Track your sleep patterns",
    icon: "sleep",
    color: "#9C27B0",
    screen: "DailyData",
  },
  {
    id: "food",
    title: "Food Log",
    description: "Log your daily meals",
    icon: "food",
    color: "#4CAF50",
    screen: "FoodLog",
  },
];

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const [dailyMacros, setDailyMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAgentVisible, setIsAgentVisible] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    isInitialized,
    proactiveMessages,
    celebrateAchievement,
    updateContext,
  } = useAgent({ currentScreen: "Dashboard" });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadDailyMacros();
  }, []); // Only run once when component mounts

  useEffect(() => {
    updateContext({
      currentScreen: "Dashboard",
      sessionData: { dailyMacros, lastVisit: new Date().toISOString() },
    });
  }, [dailyMacros]); // Update context when macros change

  const loadDailyMacros = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const entries = await getFoodEntriesByDate(today);
      const totals = entries.reduce(
        (acc, entry) => ({
          calories: acc.calories + (entry.macros.calories || 0),
          protein: acc.protein + (entry.macros.protein || 0),
          carbs: acc.carbs + (entry.macros.carbs || 0),
          fat: acc.fat + (entry.macros.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      setDailyMacros(totals);
    } catch (error) {
      console.error("Error loading daily macros:", error);
      setLoadError("Failed to load nutrition data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectionPress = (screen: string) => {
    navigation.navigate(screen as never);
  };

  const handleAnalysis = async (
    analysisType: "comprehensive" | "nutrition" | "workout"
  ) => {
    setIsAnalyzing(true);
    try {
      let analysisResult;

      switch (analysisType) {
        case "comprehensive":
          analysisResult = await getComprehensiveAnalysis("30days");
          break;
        case "nutrition":
          analysisResult = await getNutritionAnalysis("30days");
          break;
        case "workout":
          analysisResult = await getWorkoutAnalysis("30days");
          break;
      }

      (navigation.navigate as any)("AnalysisResult", {
        analysisData: analysisResult,
        analysisType:
          analysisType.charAt(0).toUpperCase() + analysisType.slice(1),
        dateRange: "30days",
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      (navigation.navigate as any)("AnalysisResult", {
        analysisData: {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
        analysisType:
          analysisType.charAt(0).toUpperCase() + analysisType.slice(1),
        dateRange: "30days",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>
            Health Hub
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Track all aspects of your wellness journey
          </Text>
        </View>

        <View style={styles.sectionsContainer}>
          {HEALTH_SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.id}
              onPress={() => handleSectionPress(section.screen)}
              activeOpacity={0.8}
            >
              <Card style={styles.sectionCard}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                      name={section.icon as any}
                      size={32}
                      color={section.color}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      {section.title}
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={styles.sectionDescription}
                    >
                      {section.description}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color="#B0B0B0"
                  />
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickStats}>
          <Text variant="titleMedium" style={styles.quickStatsTitle}>
            Today's Nutrition
          </Text>
          <Card style={styles.statsCard}>
            <Card.Content>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text variant="bodyMedium" style={styles.statsText}>
                    Loading nutrition data...
                  </Text>
                </View>
              ) : loadError ? (
                <TouchableOpacity onPress={loadDailyMacros}>
                  <View style={styles.errorContainer}>
                    <Text
                      variant="bodyMedium"
                      style={[styles.statsText, styles.errorText]}
                    >
                      {loadError}
                    </Text>
                    <Text variant="bodySmall" style={styles.retryText}>
                      Tap to retry
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : dailyMacros.calories > 0 ? (
                <View style={styles.macroGrid}>
                  <View style={styles.macroItem}>
                    <Text variant="titleSmall" style={styles.macroValue}>
                      {Math.round(dailyMacros.calories)}
                    </Text>
                    <Text variant="bodySmall" style={styles.macroLabel}>
                      Calories
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text variant="titleSmall" style={styles.macroValue}>
                      {Math.round(dailyMacros.protein)}g
                    </Text>
                    <Text variant="bodySmall" style={styles.macroLabel}>
                      Protein
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text variant="titleSmall" style={styles.macroValue}>
                      {Math.round(dailyMacros.carbs)}g
                    </Text>
                    <Text variant="bodySmall" style={styles.macroLabel}>
                      Carbs
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text variant="titleSmall" style={styles.macroValue}>
                      {Math.round(dailyMacros.fat)}g
                    </Text>
                    <Text variant="bodySmall" style={styles.macroLabel}>
                      Fat
                    </Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => navigation.navigate("FoodLog" as never)}
                >
                  <Text variant="bodyMedium" style={styles.statsText}>
                    No food logged today. Tap to start logging meals.
                  </Text>
                </TouchableOpacity>
              )}
            </Card.Content>
          </Card>
        </View>

        <View style={styles.analysisSection}>
          <Text variant="titleMedium" style={styles.analysisSectionTitle}>
            AI Analysis
          </Text>
          <Text variant="bodyMedium" style={styles.analysisSectionSubtitle}>
            Get insights from your health data using AI
          </Text>

          <View style={styles.analysisButtons}>
            <View style={styles.analysisButtonRow}>
              <Button
                mode="contained"
                onPress={() => handleAnalysis("comprehensive")}
                disabled={isAnalyzing}
                loading={isAnalyzing}
                style={[styles.analysisButton, styles.halfButton]}
                buttonColor={colors.neonCyan}
                textColor={theme.colors.surface}
                icon="chart-line"
              >
                Full Analysis
              </Button>

              <Button
                mode="outlined"
                onPress={() => navigation.navigate("AnalysisHistory" as never)}
                style={[styles.analysisButton, styles.halfButton]}
                icon="history"
              >
                View History
              </Button>
            </View>

            <View style={styles.analysisButtonRow}>
              <Button
                mode="outlined"
                onPress={() => handleAnalysis("nutrition")}
                disabled={isAnalyzing}
                style={[styles.analysisButton, styles.halfButton]}
                icon="food-apple"
              >
                Nutrition
              </Button>

              <Button
                mode="outlined"
                onPress={() => handleAnalysis("workout")}
                disabled={isAnalyzing}
                style={[styles.analysisButton, styles.halfButton]}
                icon="dumbbell"
              >
                Workout
              </Button>
            </View>
          </View>
        </View>

        {proactiveMessages.length > 0 && (
          <Card style={styles.proactiveCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.proactiveTitle}>
                💡 Your AI Coach Says:
              </Text>
              <Text variant="bodyMedium" style={styles.proactiveMessage}>
                {proactiveMessages[0].message}
              </Text>
              {proactiveMessages[0].actions && (
                <View style={styles.proactiveActions}>
                  {proactiveMessages[0].actions
                    .slice(0, 2)
                    .map((action, index) => (
                      <Button
                        key={index}
                        mode="outlined"
                        onPress={() => {
                          // Handle proactive action
                          setIsAgentVisible(true);
                        }}
                        style={styles.proactiveActionButton}
                        compact
                      >
                        {action.label}
                      </Button>
                    ))}
                </View>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <FAB
        icon="robot"
        label={isInitialized ? "AI Coach" : "Loading..."}
        style={styles.fab}
        onPress={() => setIsAgentVisible(true)}
        disabled={!isInitialized}
      />

      <AgentInterface
        visible={isAgentVisible}
        onDismiss={() => setIsAgentVisible(false)}
        currentScreen="Dashboard"
        contextData={{ dailyMacros, isAnalyzing }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontWeight: "bold",
    color: "#00E5FF",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 8,
    color: "#B0B0B0",
  },
  sectionsContainer: {
    paddingHorizontal: 20,
  },
  sectionCard: {
    marginBottom: 12,
    borderRadius: 16,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionDescription: {
    color: "#B0B0B0",
    fontSize: 14,
  },
  quickStats: {
    padding: 20,
    marginTop: 20,
  },
  quickStatsTitle: {
    marginBottom: 12,
    fontWeight: "600",
  },
  statsCard: {
    borderRadius: 16,
  },
  statsText: {
    color: "#B0B0B0",
    textAlign: "center",
  },
  macroGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroItem: {
    alignItems: "center",
    flex: 1,
  },
  macroValue: {
    fontWeight: "600",
    color: "#00E5FF",
  },
  macroLabel: {
    color: "#B0B0B0",
    marginTop: 2,
  },
  analysisSection: {
    padding: 20,
    marginTop: 20,
  },
  analysisSectionTitle: {
    marginBottom: 8,
    fontWeight: "600",
    color: colors.neonCyan,
  },
  analysisSectionSubtitle: {
    marginBottom: 20,
    color: "#B0B0B0",
  },
  analysisButtons: {
    gap: 12,
  },
  analysisButton: {
    borderRadius: 12,
  },
  analysisButtonRow: {
    flexDirection: "row",
    gap: 12,
  },
  halfButton: {
    flex: 1,
  },
  proactiveCard: {
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: "#FFF3CD",
  },
  proactiveTitle: {
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  proactiveMessage: {
    color: "#333",
    marginBottom: 12,
  },
  proactiveActions: {
    flexDirection: "row",
    gap: 8,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  errorText: {
    color: "#FF6B6B",
  },
  retryText: {
    color: colors.neonCyan,
    marginTop: 4,
    textDecorationLine: "underline",
  },
  proactiveActionButton: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.neonCyan,
  },
});
