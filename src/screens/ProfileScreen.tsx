import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Card,
  Button,
  Avatar,
  Divider,
  useTheme,
  FAB,
} from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type ProfileNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;
import { useAgent } from "../hooks/useAgent";
import { AgentInterface } from "../components/AgentInterface";
import { getUserPreferences, saveUserPreferences } from "../services/agentMemory";
import { colors } from "../config/theme";

export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const theme = useTheme();
  const navigation = useNavigation<ProfileNavigationProp>();
  const [isAgentVisible, setIsAgentVisible] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  
  const { 
    isInitialized, 
    sendMessage,
    updateContext 
  } = useAgent({ currentScreen: 'Profile' });

  useEffect(() => {
    loadUserPreferences();
    updateContext({
      currentScreen: 'Profile',
      sessionData: { user: user?.uid, preferences: userPreferences }
    });
  }, [user]);
  
  const loadUserPreferences = async () => {
    try {
      const preferences = await getUserPreferences();
      setUserPreferences(preferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };
  
  const handlePreferencesSetup = async () => {
    if (!isInitialized) return;
    
    try {
      await sendMessage("I'd like to set up my fitness preferences and goals");
      setIsAgentVisible(true);
    } catch (error) {
      console.error('Error setting up preferences:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
      <View
        style={[styles.header, { borderBottomColor: theme.colors.outline }]}
      >
        <Avatar.Text
          size={80}
          label={
            user?.displayName?.charAt(0)?.toUpperCase() ||
            user?.email?.charAt(0)?.toUpperCase() ||
            "U"
          }
          style={styles.avatar}
        />
        <Text variant="headlineMedium" style={styles.name}>
          {user?.displayName || "User"}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {user?.email}
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Account Information
          </Text>
          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              User ID:
            </Text>
            <Text variant="bodySmall" style={styles.value}>
              {user?.uid?.substring(0, 8)}...
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Email Verified:
            </Text>
            <Text variant="bodySmall" style={styles.value}>
              {user?.emailVerified ? "Yes" : "No"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Account Created:
            </Text>
            <Text variant="bodySmall" style={styles.value}>
              {user?.metadata?.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString()
                : "Unknown"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Last Sign In:
            </Text>
            <Text variant="bodySmall" style={styles.value}>
              {user?.metadata?.lastSignInTime
                ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                : "Unknown"}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            App Settings
          </Text>
          <Divider style={styles.divider} />

          <Button
            mode="outlined"
            onPress={handlePreferencesSetup}
            style={styles.settingButton}
            icon="account-cog"
            disabled={!isInitialized}
          >
            AI Coach Preferences
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => setIsAgentVisible(true)}
            style={styles.settingButton}
            icon="target"
            disabled={!isInitialized}
          >
            Set Fitness Goals
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate("ComprehensiveProfile")}
            style={styles.settingButton}
            icon="account-details"
          >
            Complete Profile Setup
          </Button>

          <Button
            mode="outlined"
            onPress={() => {}}
            style={styles.settingButton}
            icon="bell"
          >
            Notifications
          </Button>

          <Button
            mode="outlined"
            onPress={() => {}}
            style={styles.settingButton}
            icon="shield"
          >
            Privacy & Security
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate("FoodLog")}
            style={styles.settingButton}
            icon="food"
          >
            Food Log
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate("Hydration")}
            style={styles.settingButton}
            icon="water"
          >
            Hydration
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate("Stress")}
            style={styles.settingButton}
            icon="heart-pulse"
          >
            Stress Level
          </Button>

        </Card.Content>
      </Card>
      
      {userPreferences && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              AI Coach Status
            </Text>
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Communication Style:
              </Text>
              <Text variant="bodySmall" style={styles.value}>
                {userPreferences.communicationStyle || 'Not set'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Primary Goal:
              </Text>
              <Text variant="bodySmall" style={styles.value}>
                {userPreferences.fitnessGoals?.primaryGoal || 'Not set'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Workout Reminders:
              </Text>
              <Text variant="bodySmall" style={styles.value}>
                {userPreferences.notificationPreferences?.workoutReminders ? 'On' : 'Off'}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      <View style={[styles.actions, { borderTopColor: theme.colors.outline }]}>
        <Button
          mode="contained"
          onPress={handleSignOut}
          style={styles.signOutButton}
          icon="logout"
        >
          Sign Out
        </Button>
      </View>
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
        currentScreen="Profile"
        contextData={{ userPreferences, user: user?.uid }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    padding: 32,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    marginBottom: 16,
  },
  name: {
    marginBottom: 8,
    fontWeight: "bold",
  },
  email: {
    color: "#B0B0B0",
  },
  card: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.05)",
  },
  cardTitle: {
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  label: {
    fontWeight: "500",
  },
  value: {
    color: "#B0B0B0",
    textAlign: "right",
  },
  settingButton: {
    marginBottom: 12,
    justifyContent: "flex-start",
  },
  actions: {
    padding: 16,
    borderTopWidth: 1,
  },
  signOutButton: {
    paddingVertical: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.neonCyan,
  },
});
