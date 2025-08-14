import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  Card,
  useTheme,
  Button,
  IconButton,
  Chip,
  List,
  DataTable,
} from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "../config/theme";
import { AnalysisHistoryService } from "../services/analysisHistory";

export const AnalysisResultScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const [saved, setSaved] = useState(false);

  // Get the analysis data from navigation params
  const { analysisData, analysisType, fromHistory, dateRange } =
    route.params as {
      analysisData: any;
      analysisType: string;
      fromHistory?: boolean;
      dateRange?: string;
    };

  // Auto-save analysis if it's new (not from history)
  useEffect(() => {
    const autoSaveAnalysis = async () => {
      if (!fromHistory && analysisData?.success && !saved) {
        try {
          await AnalysisHistoryService.saveAnalysis(
            analysisType,
            analysisData,
            dateRange || "30days"
          );
          setSaved(true);
        } catch (error) {
          console.error("Failed to auto-save analysis:", error);
        }
      }
    };

    autoSaveAnalysis();
  }, [analysisData, analysisType, fromHistory, dateRange, saved]);

  const humanizeLabel = (label: string) => {
    return label
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  const normalizeKey = (label: string) =>
    label
      .toLowerCase()
      .replace(/[_\s]+/g, " ")
      .trim();

  // Heuristic categorization of exercises for grouping (mobile-friendly sections)
  const categorizeExercise = (
    exerciseName: string
  ): "Push" | "Pull" | "Legs" | "Other" => {
    const n = exerciseName.toLowerCase();
    if (
      /bench|chest|shoulder|overhead|press|tricep|dip|pushdown|incline|decline|fly/.test(
        n
      )
    ) {
      return "Push";
    }
    if (/row|pull|lat|bicep|curl|rear delt|face pull|shrug/.test(n)) {
      return "Pull";
    }
    if (
      /squat|leg|hamstring|quad|calf|glute|lunge|rdl|romanian deadlift|deadlift|hip thrust|split squat|press\b/.test(
        n
      )
    ) {
      return "Legs";
    }
    return "Other";
  };

  const renderObjectDetails = (obj: any): React.ReactNode => {
    if (obj == null) {
      return null;
    }

    // If it's a string, try to render with richer formatting first
    if (typeof obj === "string") {
      const text = obj;
      const hasWorkoutPattern =
        /(?:^|\n)\s*(?:\d+\.|[-•])?\s*[A-Za-z][^\n:]{2,}:\s*$/m.test(text) &&
        /(?:^|\n)\s*[-•*]?\s*Week\s*\d/i.test(text);
      const hasEmojiSections = /[🎯⚡🔍📊💡🏋️📈⚠️🔄]/.test(text);

      if (hasWorkoutPattern) {
        return <View>{renderWorkoutAnalysis(text)}</View>;
      }
      if (hasEmojiSections) {
        return <View>{formatTextContent(text)}</View>;
      }

      return (
        <Text variant="bodyMedium" style={styles.analysisText}>
          {text}
        </Text>
      );
    }

    // If it's an array, render as a bulleted list
    if (Array.isArray(obj)) {
      return (
        <List.Section style={styles.listSection}>
          {obj.map((item, index) => (
            <List.Item
              key={index}
              title={String(item)}
              left={(props) => <List.Icon {...props} icon="circle-small" />}
            />
          ))}
        </List.Section>
      );
    }

    if (typeof obj === "object") {
      const entries = Object.entries(obj);
      const isFlat = entries.every(
        ([, v]) =>
          v == null || typeof v !== "object" || Array.isArray(v) === true
      );

      if (isFlat) {
        return (
          <List.Section style={styles.listSection}>
            {entries.map(([k, v]) => (
              <List.Item
                key={k}
                title={humanizeLabel(k)}
                right={() => (
                  <Text variant="bodyMedium" style={styles.metricValue}>
                    {typeof v === "number" ? String(v) : String(v)}
                  </Text>
                )}
              />
            ))}
          </List.Section>
        );
      }

      // Nested objects – render accordions per top-level key
      return (
        <View>
          {entries.map(([k, v]) => (
            <List.Accordion
              key={k}
              title={humanizeLabel(k)}
              style={styles.accordion}
            >
              <View style={styles.accordionContent}>
                {renderObjectDetails(v)}
              </View>
            </List.Accordion>
          ))}
        </View>
      );
    }

    return (
      <Text variant="bodyMedium" style={styles.analysisText}>
        {String(obj)}
      </Text>
    );
  };

  const renderBulletText = (content: string): React.ReactNode => {
    const lines = content
      .split("\n")
      .map((l) => l.trimEnd())
      .filter((l) => l.length > 0 && !/^=+$/.test(l.trim()));

    const hasBullets = lines.some((l) => /^(?:[-•*]|\d+\.)\s+/.test(l.trim()));

    if (hasBullets) {
      return (
        <View style={styles.listSection}>
          {lines.map((line, idx) => {
            const trimmed = line.trim();
            const bulletMatch = trimmed.match(/^(?:([-•*])|(\d+\.))\s+(.*)$/);
            if (bulletMatch) {
              const contentText =
                bulletMatch[3] || trimmed.replace(/^(?:[-•*]|\d+\.)\s+/, "");
              const dot = bulletMatch[1] ? "•" : "•";
              return (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>{dot}</Text>
                  <Text style={styles.bulletText}>{contentText}</Text>
                </View>
              );
            }
            return (
              <Text
                key={`p-${idx}`}
                variant="bodyMedium"
                style={styles.sectionContent}
              >
                {trimmed}
              </Text>
            );
          })}
        </View>
      );
    }

    return (
      <Text variant="bodyMedium" style={styles.sectionContent}>
        {lines.join("\n")}
      </Text>
    );
  };

  const renderWorkoutAnalysis = (text: string) => {
    const lines = text
      .split("\n")
      .map((l) => l.trimEnd())
      .filter(Boolean);

    // Detect and render simple "Exercise: ..." sections with week rows as a table
    type TableRow = { exercise: string; week: string; details: string };
    const tableRows: TableRow[] = [];
    let currentExerciseHeader = "";

    for (const raw of lines) {
      const line = raw.replace(/^=+$/, "").trim();
      if (!line) continue;

      // Exercise header like: "Bench Press:" or "Incline Dumbbell Press:"
      const exerciseHeaderMatch = line.match(
        /^\s*(?:\d+\.|[-•])?\s*([A-Za-z].*?):\s*$/
      );
      if (exerciseHeaderMatch) {
        currentExerciseHeader = exerciseHeaderMatch[1].trim();
        continue;
      }

      // Row like: "- Week 1-2: 77.5kg for 3 sets of 8-10 reps with 2-3 minutes rest"
      const weekRowMatch = line.match(
        /^\s*(?:[-•*])?\s*(Week\s*\d+(?:\s*[-–]\s*\d+)?)\s*:\s*(.+)$/i
      );
      if (weekRowMatch && currentExerciseHeader) {
        tableRows.push({
          exercise: currentExerciseHeader,
          week: weekRowMatch[1].trim(),
          details: weekRowMatch[2].trim(),
        });
        continue;
      }
    }

    const hasTabularData = tableRows.length > 0;

    if (hasTabularData) {
      // Group by Push / Pull / Legs (mobile friendly accordions)
      const byCategory: Record<string, Record<string, TableRow[]>> = {};
      for (const row of tableRows) {
        const category = categorizeExercise(row.exercise);
        if (!byCategory[category]) byCategory[category] = {};
        if (!byCategory[category][row.exercise])
          byCategory[category][row.exercise] = [];
        byCategory[category][row.exercise].push(row);
      }

      return (
        <View>
          {Object.entries(byCategory).map(([category, exercises]) => (
            <View key={category} style={styles.workoutTypeSection}>
              <Text variant="headlineSmall" style={styles.workoutTypeTitle}>
                {category.toUpperCase()}
              </Text>
              {Object.entries(exercises).map(([exerciseName, weeks]) => (
                <List.Accordion
                  key={exerciseName}
                  title={exerciseName}
                  style={styles.accordion}
                >
                  <View style={styles.accordionContent}>
                    {weeks.map((w, idx) => (
                      <View
                        key={`${exerciseName}-${w.week}-${idx}`}
                        style={styles.weekRow}
                      >
                        <Chip icon="calendar" compact style={styles.weekChip}>
                          {w.week}
                        </Chip>
                        <Text
                          variant="bodyMedium"
                          style={styles.weekDetailsText}
                        >
                          {w.details}
                        </Text>
                      </View>
                    ))}
                  </View>
                </List.Accordion>
              ))}
            </View>
          ))}
        </View>
      );
    }

    // Parse workout splits and exercises
    const workoutTypes: {
      [key: string]: { weeks: { [key: string]: string[] } };
    } = {};
    let currentWorkoutType = "";
    let currentWeek = "";
    const intro: string[] = [];

    const workoutTypeRegex =
      /^(push|pull|legs|upper|lower|full body|chest|back|shoulders|arms)[\s:]*/i;
    const weekRegex = /^week\s*\d+(?:\s*[-–]\s*\d+)?\s*:?/i;

    for (const raw of lines) {
      const line = raw.replace(/^=+$/, "").trim();
      if (!line) continue;

      // Check if it's a workout type header
      if (workoutTypeRegex.test(line)) {
        currentWorkoutType = line.replace(/:$/, "").trim();
        if (!workoutTypes[currentWorkoutType]) {
          workoutTypes[currentWorkoutType] = { weeks: {} };
        }
        continue;
      }

      // Check if it's a week header
      if (weekRegex.test(line)) {
        currentWeek = line.replace(/:$/, "").trim();
        if (
          currentWorkoutType &&
          !workoutTypes[currentWorkoutType].weeks[currentWeek]
        ) {
          workoutTypes[currentWorkoutType].weeks[currentWeek] = [];
        }
        continue;
      }

      // Add exercises to current workout type and week
      if (line.startsWith("- ")) {
        const exercise = line.replace(/^-\s*/, "");
        if (currentWorkoutType && currentWeek) {
          workoutTypes[currentWorkoutType].weeks[currentWeek].push(exercise);
        } else if (currentWorkoutType) {
          // If no specific week, add to a general section
          if (!workoutTypes[currentWorkoutType].weeks["General"]) {
            workoutTypes[currentWorkoutType].weeks["General"] = [];
          }
          workoutTypes[currentWorkoutType].weeks["General"].push(exercise);
        } else {
          intro.push(exercise);
        }
      } else {
        // Non-bullet text
        if (!currentWorkoutType && !currentWeek) {
          intro.push(line);
        } else if (currentWorkoutType && currentWeek) {
          workoutTypes[currentWorkoutType].weeks[currentWeek].push(line);
        } else if (currentWorkoutType) {
          if (!workoutTypes[currentWorkoutType].weeks["General"]) {
            workoutTypes[currentWorkoutType].weeks["General"] = [];
          }
          workoutTypes[currentWorkoutType].weeks["General"].push(line);
        }
      }
    }

    return (
      <View>
        {intro.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            {renderBulletText(intro.join("\n"))}
          </View>
        )}

        {Object.keys(workoutTypes).length > 0 ? (
          Object.entries(workoutTypes).map(([workoutType, data]) => (
            <View key={workoutType} style={styles.workoutTypeSection}>
              <Text variant="headlineSmall" style={styles.workoutTypeTitle}>
                {workoutType.toUpperCase()}
              </Text>

              {Object.entries(data.weeks).map(([week, exercises]) => (
                <View key={week} style={styles.weekSection}>
                  <Text variant="titleMedium" style={styles.weekTitle}>
                    {week}
                  </Text>

                  <View style={styles.exerciseTable}>
                    {exercises.map((exercise, idx) => {
                      // Parse exercise details (weight x reps format)
                      const exerciseMatch = exercise.match(/^(.+?):\s*(.+)/);
                      if (exerciseMatch) {
                        const [, exerciseName, details] = exerciseMatch;
                        return (
                          <View key={idx} style={styles.exerciseRow}>
                            <Text
                              variant="bodyMedium"
                              style={styles.exerciseName}
                            >
                              {exerciseName.trim()}
                            </Text>
                            <Text
                              variant="bodyMedium"
                              style={styles.exerciseDetails}
                            >
                              {details.trim()}
                            </Text>
                          </View>
                        );
                      } else {
                        return (
                          <View key={idx} style={styles.exerciseRow}>
                            <Text
                              variant="bodyMedium"
                              style={styles.exerciseFullText}
                            >
                              {exercise}
                            </Text>
                          </View>
                        );
                      }
                    })}
                  </View>
                </View>
              ))}
            </View>
          ))
        ) : (
          // Fallback to original format if no workout types detected
          <View>{renderBulletText(text)}</View>
        )}
      </View>
    );
  };

  const formatTextContent = (text: string) => {
    // Split by common section markers and format nicely
    const sections = text.split(/(?=🎯|⚡|🔍|📊|💡|🏋️|📈|⚠️|🔄)/);

    return sections
      .map((section, index) => {
        if (!section.trim()) return null;

        const lines = section.trim().split("\n");
        const title = lines[0];
        const content = lines.slice(1).join("\n");

        // Check if this is a section header with emoji
        if (/^[🎯⚡🔍📊💡🏋️📈⚠️🔄]/.test(title)) {
          const looksLikeWorkout =
            /(?:^|\n)\s*(?:\d+\.|[-•])?\s*[A-Za-z][^\n:]{2,}:\s*$/m.test(
              content
            ) && /(?:^|\n)\s*[-•*]?\s*Week\s*\d/i.test(content);
          return (
            <Card key={index} style={styles.sectionCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.emojiSectionTitle}>
                  {title}
                </Text>
                {content &&
                  (looksLikeWorkout
                    ? renderWorkoutAnalysis(content.trim())
                    : renderBulletText(content.trim()))}
              </Card.Content>
            </Card>
          );
        }

        // Regular content
        return (
          <Text key={index} variant="bodyMedium" style={styles.analysisText}>
            {section.trim()}
          </Text>
        );
      })
      .filter(Boolean);
  };

  const renderAnalysisContent = () => {
    // Debug logging
    console.log(
      "🔍 AnalysisResultScreen - analysisData:",
      JSON.stringify(analysisData, null, 2)
    );
    console.log("🔍 AnalysisResultScreen - fromHistory:", fromHistory);
    if (analysisData?.analysis) {
      console.log(
        "🔍 Available analysis keys:",
        Object.keys(analysisData.analysis)
      );
    }

    if (!analysisData || !analysisData.success) {
      return (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.errorTitle}>
              Analysis Failed
            </Text>
            <Text variant="bodyMedium" style={styles.errorText}>
              {analysisData?.error ||
                analysisData?.message ||
                "Unknown error occurred"}
            </Text>
            {/* Debug info */}
            <Text variant="bodySmall" style={{ marginTop: 8, opacity: 0.5 }}>
              Debug: {JSON.stringify(analysisData)}
            </Text>
          </Card.Content>
        </Card>
      );
    }

    const analysis = analysisData.analysis;

    return (
      <View>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Text variant="headlineSmall" style={styles.title}>
                  {analysisType} Analysis
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                  {analysisData.message}
                </Text>
              </View>
              <View style={styles.headerRight}>
                {saved && (
                  <Chip icon="check" style={styles.savedChip}>
                    Saved
                  </Chip>
                )}
                <IconButton
                  icon="history"
                  iconColor={colors.neonCyan}
                  onPress={() =>
                    navigation.navigate("AnalysisHistory" as never)
                  }
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Analysis Content */}
        {typeof analysis === "string" ? (
          // Handle string analysis (like our LLM workout analysis)
          <View>{formatTextContent(analysis)}</View>
        ) : (
          // Handle object analysis (like comprehensive analysis)
          analysis &&
          Object.keys(analysis).map((key) => {
            const value = analysis[key];
            const normalizedKey = normalizeKey(key);
            const isFormattedText =
              typeof value === "string" &&
              (value.includes("🎯") ||
                value.includes("📊") ||
                value.includes("💡") ||
                value.includes("⚡") ||
                value.includes("🔍") ||
                value.includes("📈") ||
                value.includes("⚠️") ||
                value.includes("🔄") ||
                value.includes("🏋️"));

            const titleLabel =
              key.charAt(0).toUpperCase() +
              key
                .slice(1)
                .replace(/([A-Z])/g, " $1")
                .replace(/_/g, " ");

            return (
              <Card key={key} style={styles.sectionCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    {titleLabel}
                  </Text>
                  {normalizedKey.startsWith("workout") &&
                  typeof value === "string" ? (
                    renderWorkoutAnalysis(value)
                  ) : normalizedKey === "comprehensive summary" &&
                    typeof value === "string" ? (
                    <View>{formatTextContent(value)}</View>
                  ) : Array.isArray(value) ? (
                    <View>{renderObjectDetails(value)}</View>
                  ) : typeof value === "object" ? (
                    <View style={styles.objectContainer}>
                      {renderObjectDetails(value)}
                    </View>
                  ) : isFormattedText ? (
                    <View>{formatTextContent(String(value))}</View>
                  ) : (
                    <Text variant="bodyMedium" style={styles.analysisText}>
                      {String(value)}
                    </Text>
                  )}
                </Card.Content>
              </Card>
            );
          })
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {renderAnalysisContent()}

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate("AnalysisHistory" as never)}
          style={styles.button}
          icon="history"
        >
          View History
        </Button>
        <Button
          mode="contained"
          onPress={() => navigation.navigate("Dashboard" as never)}
          style={styles.button}
          buttonColor={colors.neonCyan}
          textColor={theme.colors.surface}
          icon="plus"
        >
          New Analysis
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "rgba(94, 255, 255, 0.05)",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: "center",
    flexDirection: "row",
  },
  savedChip: {
    marginRight: 8,
    backgroundColor: "rgba(76, 175, 80, 0.2)",
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  errorCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "rgba(244, 67, 54, 0.1)",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
    color: colors.neonCyan,
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: 8,
  },
  emojiSectionTitle: {
    fontWeight: "600",
    marginBottom: 12,
    color: colors.neonCyan,
    fontSize: 18,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 12,
    color: colors.neonCyan,
  },
  sectionContent: {
    lineHeight: 24,
    fontSize: 16,
  },
  analysisText: {
    lineHeight: 22,
    fontSize: 15,
  },
  objectContainer: {
    paddingLeft: 4,
  },
  keyValueRow: {
    flexDirection: "row",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  keyText: {
    fontWeight: "600",
    marginRight: 8,
    color: colors.neonCyan,
    minWidth: 80,
  },
  valueText: {
    flex: 1,
    opacity: 0.8,
  },
  listSection: {
    paddingVertical: 0,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
  },
  bulletDot: {
    width: 16,
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.7,
  },
  bulletText: {
    flex: 1,
    flexShrink: 1,
    lineHeight: 22,
    fontSize: 15,
  },
  metricValue: {
    opacity: 0.85,
    fontWeight: "600",
  },
  accordion: {
    backgroundColor: "transparent",
  },
  accordionContent: {
    paddingLeft: 8,
    paddingRight: 4,
  },
  errorTitle: {
    color: "#F44336",
    fontWeight: "600",
    marginBottom: 8,
  },
  errorText: {
    color: "#F44336",
    opacity: 0.8,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 32,
    gap: 12,
    flexDirection: "row",
  },
  button: {
    borderRadius: 8,
    flex: 1,
  },
  weekTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    color: colors.neonCyan,
  },
  workoutTypeSection: {
    marginBottom: 20,
    backgroundColor: "rgba(94, 255, 255, 0.03)",
    borderRadius: 12,
    padding: 16,
  },
  workoutTypeTitle: {
    fontWeight: "bold",
    marginBottom: 16,
    color: colors.neonCyan,
    textAlign: "center",
    fontSize: 20,
  },
  weekSection: {
    marginBottom: 16,
  },
  exerciseTable: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
    padding: 8,
  },
  exerciseRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  exerciseName: {
    flex: 1,
    fontWeight: "600",
    color: colors.neonCyan,
  },
  exerciseDetails: {
    flex: 1,
    textAlign: "right",
    opacity: 0.9,
  },
  exerciseFullText: {
    flex: 1,
    opacity: 0.9,
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  weekChip: {
    marginRight: 12,
    backgroundColor: "rgba(94, 255, 255, 0.1)",
    borderRadius: 8,
  },
  weekDetailsText: {
    flex: 1,
    flexShrink: 1,
    opacity: 0.9,
  },
});
