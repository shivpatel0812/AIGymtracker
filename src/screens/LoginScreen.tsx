import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Button,
  Card,
  TextInput,
  HelperText,
  Divider,
  useTheme,
} from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";

export const LoginScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const { signIn, signUp, resetPassword } = useAuth();
  const theme = useTheme();

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await signIn(email, password);
    } catch (error: any) {
      setError(error.message || "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !displayName) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await signUp(email, password, displayName);
    } catch (error: any) {
      setError(error.message || "Sign up failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await resetPassword(email);
      setError("Password reset email sent!");
      setTimeout(() => setMode("signin"), 2000);
    } catch (error: any) {
      setError(error.message || "Password reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  const renderSignIn = () => (
    <>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={handleSignIn}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
      >
        Sign In
      </Button>
      <Button
        mode="text"
        onPress={() => setMode("reset")}
        style={styles.textButton}
      >
        Forgot Password?
      </Button>
    </>
  );

  const renderSignUp = () => (
    <>
      <TextInput
        label="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        mode="outlined"
        secureTextEntry
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={handleSignUp}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
      >
        Sign Up
      </Button>
    </>
  );

  const renderResetPassword = () => (
    <>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={handleResetPassword}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
      >
        Reset Password
      </Button>
      <Button
        mode="text"
        onPress={() => setMode("signin")}
        style={styles.textButton}
      >
        Back to Sign In
      </Button>
    </>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    >
      <View style={styles.content}>
        <Card style={styles.welcomeCard}>
          <Card.Content style={styles.cardContent}>
            <Text variant="displaySmall" style={styles.appIcon}>
              💪
            </Text>
            <Text variant="headlineLarge" style={styles.title}>
              GymApp
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              {mode === "signin" && "Sign in to continue your fitness journey"}
              {mode === "signup" &&
                "Create an account to start tracking your workouts"}
              {mode === "reset" && "Reset your password"}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.authCard}>
          <Card.Content>
            <View style={styles.tabs}>
              <Button
                mode={mode === "signin" ? "contained" : "text"}
                onPress={() => setMode("signin")}
                style={styles.tabButton}
              >
                Sign In
              </Button>
              <Button
                mode={mode === "signup" ? "contained" : "text"}
                onPress={() => setMode("signup")}
                style={styles.tabButton}
              >
                Sign Up
              </Button>
            </View>

            <Divider style={styles.divider} />

            {mode === "signin" && renderSignIn()}
            {mode === "signup" && renderSignUp()}
            {mode === "reset" && renderResetPassword()}

            {error ? (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            ) : null}
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  welcomeCard: {
    marginBottom: 24,
  },
  cardContent: {
    alignItems: "center",
    padding: 24,
  },
  appIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    color: "#B0B0B0",
    lineHeight: 20,
  },
  authCard: {
    marginBottom: 24,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  divider: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  textButton: {
    marginBottom: 8,
  },
});
