import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import {
  Text,
  Card,
  useTheme,
  Button,
  FAB,
  IconButton,
  Searchbar,
} from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { colors } from "../config/theme";
import {
  AnalysisHistoryService,
  SavedAnalysis,
} from "../services/analysisHistory";

export const AnalysisHistoryScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const history = await AnalysisHistoryService.getAnalysisHistory(20);
      setAnalyses(history);
    } catch (error) {
      console.error("Error loading analysis history:", error);
      Alert.alert("Error", "Failed to load analysis history");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyses();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadAnalyses();
    }, [])
  );

  const filteredAnalyses = analyses.filter(
    (analysis) =>
      (analysis.title?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      ) ||
      analysis.analysisType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteAnalysis = (analysisId: string) => {
    Alert.alert(
      "Delete Analysis",
      "Are you sure you want to delete this analysis?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await AnalysisHistoryService.deleteAnalysis(analysisId);
              setAnalyses((prev) => prev.filter((a) => a.id !== analysisId));
            } catch (error) {
              Alert.alert("Error", "Failed to delete analysis");
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAnalysisTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "comprehensive":
        return colors.neonCyan;
      case "workout":
        return "#FF6B6B";
      case "nutrition":
        return "#4ECDC4";
      default:
        return theme.colors.primary;
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text>Loading analysis history...</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Searchbar
        placeholder="Search analyses..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredAnalyses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No Analyses Found
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                {searchQuery
                  ? "No analyses match your search."
                  : "Start by creating your first analysis from the Dashboard."}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredAnalyses.map((analysis) => (
            <Card key={analysis.id} style={styles.analysisCard}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <View
                      style={[
                        styles.typeBadge,
                        {
                          backgroundColor: getAnalysisTypeColor(
                            analysis.analysisType
                          ),
                        },
                      ]}
                    >
                      <Text variant="labelSmall" style={styles.typeBadgeText}>
                        {analysis.analysisType.toUpperCase()}
                      </Text>
                    </View>
                    <Text variant="titleMedium" style={styles.analysisTitle}>
                      {analysis.title || `${analysis.analysisType} Analysis`}
                    </Text>
                  </View>
                  <IconButton
                    icon="delete"
                    iconColor={theme.colors.error}
                    size={20}
                    onPress={() => handleDeleteAnalysis(analysis.id)}
                  />
                </View>

                <Text variant="bodySmall" style={styles.dateText}>
                  {formatDate(analysis.createdAt)} • {analysis.dateRange} data
                </Text>

                <View style={styles.cardActions}>
                  <Button
                    mode="contained"
                    onPress={() => {
                      console.log('🔍 Navigating to AnalysisResult with data:', {
                        analysisData: analysis.analysisData,
                        analysisType: analysis.analysisType,
                        fromHistory: true,
                      });
                      (navigation.navigate as any)("AnalysisResult", {
                        analysisData: analysis.analysisData,
                        analysisType: analysis.analysisType,
                        fromHistory: true,
                      });
                    }}
                    style={styles.viewButton}
                    buttonColor={getAnalysisTypeColor(analysis.analysisType)}
                    compact
                  >
                    View Analysis
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.neonCyan }]}
        onPress={() => navigation.navigate("Dashboard" as never)}
        label="New Analysis"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    margin: 16,
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  analysisCard: {
    marginVertical: 8,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  typeBadgeText: {
    color: "white",
    fontWeight: "600",
  },
  analysisTitle: {
    fontWeight: "600",
    color: colors.neonCyan,
  },
  dateText: {
    opacity: 0.7,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  viewButton: {
    borderRadius: 8,
  },
  emptyCard: {
    margin: 16,
    borderRadius: 16,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptyText: {
    opacity: 0.7,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
  },
});
