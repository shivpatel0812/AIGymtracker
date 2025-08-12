import { MD3DarkTheme, configureFonts, MD3Theme } from "react-native-paper";
import {
  DarkTheme as NavigationDarkTheme,
  Theme as NavTheme,
} from "@react-navigation/native";

const neonCyan = "#00E5FF";
const electricPurple = "#9D4EDD";
const background = "#0D0D0D";
const surface = "#1A1A1A";
const textPrimary = "#FFFFFF";
const textSecondary = "#B0B0B0";
const divider = "rgba(255,255,255,0.05)";
const success = "#00FF94";
const danger = "#FF3B3B";

const fontConfig = configureFonts({
  config: {
    fontFamily: "System",
  },
});

export const paperTheme: MD3Theme = {
  ...MD3DarkTheme,
  dark: true,
  roundness: 12,
  fonts: fontConfig,
  colors: {
    ...MD3DarkTheme.colors,
    primary: neonCyan,
    secondary: electricPurple,
    background,
    surface,
    surfaceVariant: "#121212",
    onSurface: textPrimary,
    onSurfaceVariant: textSecondary,
    outline: divider,
    outlineVariant: divider,
    error: danger,
    inversePrimary: electricPurple,
  },
};

export const navTheme: NavTheme = {
  ...NavigationDarkTheme,
  dark: true,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: neonCyan,
    background,
    card: background,
    text: textPrimary,
    border: divider,
    notification: electricPurple,
  },
};

export const colors = {
  neonCyan,
  electricPurple,
  background,
  surface,
  textPrimary,
  textSecondary,
  divider,
  success,
  danger,
};
