import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, Card, Chip, useTheme, Button } from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import { getWorkouts } from "../services/workouts";
import { getHydrationHistory } from "../services/hydration";
import { getStressHistory } from "../services/stress";
import { getMacroHistory } from "../services/macros";
import { Workout, HydrationEntry, StressEntry, MacroEntry } from "../types";

export const CalendarScreen: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [hydrationData, setHydrationData] = useState<HydrationEntry[]>([]);
  const [stressData, setStressData] = useState<StressEntry[]>([]);
  const [macroData, setMacroData] = useState<MacroEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const theme = useTheme();
  const navigation = useNavigation();

  const loadData = async () => {
    try {
      const [workoutsList, hydrationList, stressList, macrosList] = await Promise.all([
        getWorkouts(),
        getHydrationHistory(90),
        getStressHistory(90),
        getMacroHistory(90)
      ]);
      
      setWorkouts(workoutsList);
      setHydrationData(hydrationList);
      setStressData(stressList);
      setMacroData(macrosList);
      
    } catch (e) {
      console.error("Failed to load data for calendar", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    
    for (const w of workouts) {
      const workoutDate = new Date(w.dateISO);
      const key = workoutDate.getFullYear() + '-' + 
                  String(workoutDate.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(workoutDate.getDate()).padStart(2, '0');
      if (!marks[key]) marks[key] = { dots: [] };
      marks[key].dots.push({ color: theme.colors.primary });
    }

    for (const h of hydrationData) {
      if (!marks[h.date]) marks[h.date] = { dots: [] };
      marks[h.date].dots.push({ color: '#2196F3' });
    }

    for (const s of stressData) {
      if (!marks[s.date]) marks[s.date] = { dots: [] };
      marks[s.date].dots.push({ color: '#FF9800' });
    }

    for (const m of macroData) {
      if (!marks[m.date]) marks[m.date] = { dots: [] };
      marks[m.date].dots.push({ color: '#4CAF50' });
    }

    Object.keys(marks).forEach(key => {
      marks[key].markingType = 'multi-dot';
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: theme.colors.secondary || theme.colors.primary,
      };
    }
    
    return marks;
  }, [workouts, hydrationData, stressData, macroData, selectedDate, theme.colors]);

  const workoutsByDate = useMemo(() => {
    const map: Record<string, Workout[]> = {};
    for (const w of workouts) {
      const workoutDate = new Date(w.dateISO);
      const key = workoutDate.getFullYear() + '-' + 
                  String(workoutDate.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(workoutDate.getDate()).padStart(2, '0');
      if (!map[key]) map[key] = [];
      map[key].push(w);
    }
    return map;
  }, [workouts]);

  const formatDatePretty = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const onDayPress = (day: any) => {
    const key = day.dateString; // YYYY-MM-DD
    setSelectedDate(key);
  };

  const selectedWorkouts = selectedDate
    ? workoutsByDate[selectedDate] || []
    : [];

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    
    const hydration = hydrationData.find(h => h.date === selectedDate);
    const stress = stressData.find(s => s.date === selectedDate);
    const macros = macroData.find(m => m.date === selectedDate);
    
    
    return { hydration, stress, macros };
  }, [selectedDate, hydrationData, stressData, macroData, selectedWorkouts]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Calendar
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={{
          calendarBackground: theme.colors.background,
          dayTextColor: theme.colors.onBackground,
          monthTextColor: theme.colors.onBackground,
          arrowColor: theme.colors.primary,
          todayTextColor: theme.colors.primary,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: theme.colors.onPrimary,
        }}
      />

      {selectedDate && (
        <View style={styles.listContainer}>
          <View style={styles.dayHeader}>
            <Text variant="titleMedium" style={styles.listHeader}>
              {formatDatePretty(selectedDate)}
            </Text>
            <Button
              mode="outlined"
              onPress={() =>
                (navigation as any).navigate("DailyData", {
                  date: selectedDate,
                })
              }
              compact
              style={styles.editButton}
            >
              Edit Day
            </Button>
          </View>

          <View style={styles.dataIndicators}>
            <Chip 
              icon="dumbbell" 
              style={[
                styles.indicator, 
                { backgroundColor: selectedWorkouts.length > 0 ? theme.colors.primary : '#666' }
              ]}
            >
              Workout {selectedWorkouts.length > 0 ? '✓' : ''}
            </Chip>
            <Chip 
              icon="water" 
              style={[
                styles.indicator, 
                { backgroundColor: selectedDayData?.hydration ? '#2196F3' : '#666' }
              ]}
            >
              Hydration {selectedDayData?.hydration ? '✓' : ''}
            </Chip>
            <Chip 
              icon="heart-pulse" 
              style={[
                styles.indicator, 
                { backgroundColor: selectedDayData?.stress ? '#FF9800' : '#666' }
              ]}
            >
              Stress {selectedDayData?.stress ? '✓' : ''}
            </Chip>
            <Chip 
              icon="nutrition" 
              style={[
                styles.indicator, 
                { backgroundColor: selectedDayData?.macros ? '#4CAF50' : '#666' }
              ]}
            >
              Macros {selectedDayData?.macros ? '✓' : ''}
            </Chip>
          </View>

          {selectedWorkouts.length === 0 ? (
            <Text variant="bodyMedium" style={{ opacity: 0.7, marginTop: 16 }}>
              No workouts logged for this day
            </Text>
          ) : (
            <FlatList
              data={selectedWorkouts}
              keyExtractor={(item, idx) => item.id || `${item.dateISO}-${idx}`}
              renderItem={({ item }) => (
                <Card
                  style={styles.card}
                  onPress={() =>
                    (navigation as any).navigate("WorkoutDetail", {
                      workout: item,
                    })
                  }
                >
                  <Card.Content>
                    <View style={styles.rowBetween}>
                      <View style={{ flex: 1 }}>
                        <Text variant="titleMedium">{item.dayType}</Text>
                        <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                          {item.notes || ""}
                        </Text>
                      </View>
                      <View style={styles.row}>
                        <Chip icon="dumbbell" style={styles.chip}>
                          {item.exercises.length}
                        </Chip>
                        <Chip icon="repeat" style={styles.chip}>
                          {item.exercises.reduce(
                            (t, e) =>
                              t + e.sets.filter((s) => !s.isWarmup).length,
                            0
                          )}
                        </Chip>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
    flex: 1,
  },
  listHeader: {
    marginBottom: 8,
  },
  card: {
    marginBottom: 12,
    borderRadius: 16,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    height: 32,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  editButton: {
    borderRadius: 20,
  },
  dataIndicators: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  indicator: {
    height: 28,
    opacity: 0.8,
  },
});

export default CalendarScreen;
