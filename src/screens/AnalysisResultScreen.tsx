import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, useTheme, Button } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "../config/theme";

export const AnalysisResultScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get the analysis data from navigation params
  const { analysisData, analysisType } = route.params as {
    analysisData: any;
    analysisType: string;
  };

  const renderAnalysisContent = () => {
    if (!analysisData || !analysisData.success) {
      return (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.errorTitle}>
              Analysis Failed
            </Text>
            <Text variant="bodyMedium" style={styles.errorText}>
              {analysisData?.error || "Unknown error occurred"}
            </Text>
          </Card.Content>
        </Card>
      );
    }

    const analysis = analysisData.analysis;

    return (
      <View>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              {analysisType} Analysis Results
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {analysisData.message}
            </Text>
          </Card.Content>
        </Card>

        {/* Render analysis sections */}
        {analysis && Object.keys(analysis).map((key) => (
          <Card key={key} style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </Text>
              
              {typeof analysis[key] === 'object' ? (
                <View style={styles.objectContainer}>
                  {Object.entries(analysis[key]).map(([subKey, value]) => (
                    <View key={subKey} style={styles.keyValueRow}>
                      <Text variant="bodyMedium" style={styles.keyText}>
                        {subKey}:
                      </Text>
                      <Text variant="bodyMedium" style={styles.valueText}>
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text variant="bodyMedium" style={styles.analysisText}>
                  {String(analysis[key])}
                </Text>
              )}
            </Card.Content>
          </Card>
        ))}
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
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Go Back
        </Button>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Dashboard' as never)}
          style={styles.button}
          buttonColor={colors.neonCyan}
          textColor={theme.colors.surface}
        >
          Back to Dashboard
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
  card: {
    marginBottom: 16,
    borderRadius: 16,
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
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 12,
    color: colors.neonCyan,
  },
  analysisText: {
    lineHeight: 22,
  },
  objectContainer: {
    paddingLeft: 8,
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
  },
  button: {
    borderRadius: 8,
  },
});