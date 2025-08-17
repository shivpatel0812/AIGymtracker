import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Provider as PaperProvider, useTheme } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View, Platform } from "react-native";
import { IconButton } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { SplitSetupScreen } from "./src/screens/SplitSetupScreen";
import { DayPickerScreen } from "./src/screens/DayPickerScreen";
import { LogWorkoutScreen } from "./src/screens/LogWorkoutScreen";
import { WorkoutCompleteScreen } from "./src/screens/WorkoutCompleteScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { WorkoutDetailScreen } from "./src/screens/WorkoutDetailScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { navTheme, paperTheme, colors } from "./src/config/theme";
import { CalendarScreen } from "./src/screens/CalendarScreen";
import { FoodLogScreen } from "./src/screens/FoodLogScreen";
import { HydrationScreen } from "./src/screens/HydrationScreen";
import { StressScreen } from "./src/screens/StressScreen";
import { DailyDataScreen } from "./src/screens/DailyDataScreen";
import { AnalysisResultScreen } from "./src/screens/AnalysisResultScreen";
import { AnalysisHistoryScreen } from "./src/screens/AnalysisHistoryScreen";
import { ComprehensiveProfileScreen } from "./src/screens/ComprehensiveProfileScreen";

const Stack = createStackNavigator();
const PERSISTENCE_KEY = "NAVIGATION_STATE_V1";

const AppNavigator: React.FC = () => {
  const { user, isLoading, signOut } = useAuth();
  const [isNavReady, setIsNavReady] = React.useState(false);
  const [initialNavState, setInitialNavState] = React.useState<any>(undefined);
  const theme = useTheme();

  React.useEffect(() => {
    if (Platform.OS === "web") {
      const previous = document.body.style.overflow;
      // Allow browser window scrolling in web/devtools preview
      document.body.style.overflow = "auto";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, []);

  React.useEffect(() => {
    const restoreState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(PERSISTENCE_KEY);
        if (savedState) setInitialNavState(JSON.parse(savedState));
      } finally {
        setIsNavReady(true);
      }
    };
    restoreState();
  }, []);

  if (isLoading || !isNavReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.neonCyan} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={navTheme}
      initialState={user ? initialNavState : undefined}
      onStateChange={
        user
          ? async (state) => {
              try {
                await AsyncStorage.setItem(
                  PERSISTENCE_KEY,
                  JSON.stringify(state)
                );
              } catch {}
            }
          : undefined
      }
    >
      <Stack.Navigator
        initialRouteName={user ? "Dashboard" : "Login"}
        screenOptions={{
          headerStyle: {
            backgroundColor: paperTheme.colors.surface,
          },
          headerTintColor: paperTheme.colors.onSurface,
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        {!user ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={({ navigation }) => ({
                title: "Health Hub",
                headerRight: () => (
                  <IconButton
                    icon="account"
                    iconColor={paperTheme.colors.onSurface}
                    onPress={() => navigation.navigate("Profile" as never)}
                    size={24}
                  />
                ),
              })}
            />
            <Stack.Screen
              name="SplitSetup"
              component={SplitSetupScreen}
              options={({ navigation }) => ({
                title: "Choose Split",
                headerRight: () => (
                  <IconButton
                    icon="account"
                    iconColor={paperTheme.colors.onSurface}
                    onPress={() => navigation.navigate("Profile" as never)}
                    size={24}
                  />
                ),
              })}
            />
            <Stack.Screen
              name="DayPicker"
              component={DayPickerScreen}
              options={({ navigation }) => ({
                title: "Today's Workout",
                headerRight: () => (
                  <IconButton
                    icon="account"
                    iconColor={paperTheme.colors.onSurface}
                    onPress={() => navigation.navigate("Profile" as never)}
                    size={24}
                  />
                ),
              })}
            />
            <Stack.Screen
              name="LogWorkout"
              component={LogWorkoutScreen}
              options={({ navigation }) => ({
                title: "Log Workout",
                headerRight: () => (
                  <IconButton
                    icon="account"
                    iconColor={paperTheme.colors.onSurface}
                    onPress={() => navigation.navigate("Profile" as never)}
                    size={24}
                  />
                ),
              })}
            />
            <Stack.Screen
              name="WorkoutComplete"
              component={WorkoutCompleteScreen}
              options={{ title: "Workout Complete", headerShown: false }}
            />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={({ navigation }) => ({
                title: "Workout History",
                headerRight: () => (
                  <IconButton
                    icon="account"
                    iconColor={paperTheme.colors.onSurface}
                    onPress={() => navigation.navigate("Profile" as never)}
                    size={24}
                  />
                ),
              })}
            />
            <Stack.Screen
              name="Calendar"
              component={CalendarScreen}
              options={({ navigation }) => ({
                title: "Calendar",
                headerRight: () => (
                  <IconButton
                    icon="account"
                    iconColor={paperTheme.colors.onSurface}
                    onPress={() => navigation.navigate("Profile" as never)}
                    size={24}
                  />
                ),
              })}
            />
            <Stack.Screen
              name="WorkoutDetail"
              component={WorkoutDetailScreen}
              options={({ navigation }) => ({
                title: "Workout Details",
                headerRight: () => (
                  <IconButton
                    icon="account"
                    iconColor={paperTheme.colors.onSurface}
                    onPress={() => navigation.navigate("Profile" as never)}
                    size={24}
                  />
                ),
              })}
            />
            <Stack.Screen
              name="FoodLog"
              component={FoodLogScreen}
              options={({ navigation }) => ({
                title: "Food Log",
                headerRight: () => (
                  <IconButton
                    icon="account"
                    iconColor={paperTheme.colors.onSurface}
                    onPress={() => navigation.navigate("Profile" as never)}
                    size={24}
                  />
                ),
              })}
            />
            <Stack.Screen
              name="Hydration"
              component={HydrationScreen}
              options={({ navigation }) => ({
                title: "Hydration",
                headerRight: () => (
                  <IconButton
                    icon="account"
                    iconColor={paperTheme.colors.onSurface}
                    onPress={() => navigation.navigate("Profile" as never)}
                    size={24}
                  />
                ),
              })}
            />
            <Stack.Screen
              name="Stress"
              component={StressScreen}
              options={({ navigation }) => ({
                title: "Stress Level",
                headerRight: () => (
                  <IconButton
                    icon="account"
                    iconColor={paperTheme.colors.onSurface}
                    onPress={() => navigation.navigate("Profile" as never)}
                    size={24}
                  />
                ),
              })}
            />
            <Stack.Screen
              name="DailyData"
              component={DailyDataScreen}
              options={({ navigation }) => ({
                title: "Daily Data",
                headerRight: () => (
                  <IconButton
                    icon="account"
                    iconColor={paperTheme.colors.onSurface}
                    onPress={() => navigation.navigate("Profile" as never)}
                    size={24}
                  />
                ),
              })}
            />
            <Stack.Screen
              name="AnalysisResult"
              component={AnalysisResultScreen}
              options={({ navigation }) => ({
                title: "Analysis Results",
                headerRight: () => (
                  <IconButton
                    icon="account"
                    iconColor={paperTheme.colors.onSurface}
                    onPress={() => navigation.navigate("Profile" as never)}
                    size={24}
                  />
                ),
              })}
            />
            <Stack.Screen
              name="AnalysisHistory"
              component={AnalysisHistoryScreen}
              options={({ navigation }) => ({
                title: "Analysis History",
                headerRight: () => (
                  <IconButton
                    icon="account"
                    iconColor={paperTheme.colors.onSurface}
                    onPress={() => navigation.navigate("Profile" as never)}
                    size={24}
                  />
                ),
              })}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                title: "Profile",
                headerRight: () => (
                  <IconButton
                    icon="logout"
                    iconColor={paperTheme.colors.onSurface}
                    onPress={signOut}
                    size={24}
                  />
                ),
              }}
            />
            <Stack.Screen
              name="ComprehensiveProfile"
              component={ComprehensiveProfileScreen}
              options={{
                title: "Complete Profile",
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <PaperProvider theme={paperTheme}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}
