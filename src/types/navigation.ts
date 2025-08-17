export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  SplitSetup: undefined;
  DayPicker: undefined;
  LogWorkout: { dayType?: string };
  WorkoutComplete: { workoutId: string };
  History: undefined;
  Calendar: undefined;
  WorkoutDetail: { workoutId: string };
  FoodLog: undefined;
  Hydration: undefined;
  Stress: undefined;
  DailyData: undefined;
  AnalysisResult: { analysisId: string };
  AnalysisHistory: undefined;
  Profile: undefined;
  ComprehensiveProfile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}