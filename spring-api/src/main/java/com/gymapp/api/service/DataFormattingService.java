package com.gymapp.api.service;

import com.gymapp.api.model.FoodEntry;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DataFormattingService {

    public List<Map<String, Object>> formatNutritionData(List<FoodEntry> foodEntries) {
        // Group food entries by date
        Map<String, List<FoodEntry>> entriesByDate = foodEntries.stream()
            .collect(Collectors.groupingBy(entry -> {
                // Extract date from ISO string (e.g., "2025-08-11T14:30:00.000Z" -> "2025-08-11")
                return entry.getCreatedAtISO().substring(0, 10);
            }));

        // Convert to the expected format
        List<Map<String, Object>> nutritionData = new ArrayList<>();
        
        for (Map.Entry<String, List<FoodEntry>> dayEntry : entriesByDate.entrySet()) {
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", dayEntry.getKey());
            
            List<Map<String, Object>> foods = new ArrayList<>();
            for (FoodEntry entry : dayEntry.getValue()) {
                Map<String, Object> foodItem = new HashMap<>();
                foodItem.put("name", entry.getDescription() != null ? entry.getDescription() : "Food Entry");
                
                if (entry.getMacros() != null) {
                    foodItem.put("calories", entry.getMacros().getCalories() != null ? entry.getMacros().getCalories().intValue() : 0);
                    foodItem.put("protein", entry.getMacros().getProtein() != null ? entry.getMacros().getProtein().intValue() : 0);
                    foodItem.put("carbs", entry.getMacros().getCarbs() != null ? entry.getMacros().getCarbs().intValue() : 0);
                    foodItem.put("fat", entry.getMacros().getFat() != null ? entry.getMacros().getFat().intValue() : 0);
                } else {
                    foodItem.put("calories", 0);
                    foodItem.put("protein", 0);
                    foodItem.put("carbs", 0);
                    foodItem.put("fat", 0);
                }
                
                foods.add(foodItem);
            }
            
            dayData.put("foods", foods);
            nutritionData.add(dayData);
        }
        
        // Sort by date
        nutritionData.sort((a, b) -> ((String) a.get("date")).compareTo((String) b.get("date")));
        
        return nutritionData;
    }

    public List<Map<String, Object>> formatHydrationData(List<Map<String, Object>> hydrationEntries) {
        List<Map<String, Object>> formattedData = new ArrayList<>();
        
        for (Map<String, Object> entry : hydrationEntries) {
            Map<String, Object> formatted = new HashMap<>();
            formatted.put("date", entry.get("date"));
            
            // Convert water_intake to decimal (liters)
            Object waterIntake = entry.get("water_intake");
            if (waterIntake instanceof Number) {
                formatted.put("water_intake", ((Number) waterIntake).doubleValue());
            } else {
                formatted.put("water_intake", 0.0);
            }
            
            // Hydration quality as integer (1-10)
            Object hydrationQuality = entry.get("hydration_quality");
            if (hydrationQuality instanceof Number) {
                formatted.put("hydration_quality", ((Number) hydrationQuality).intValue());
            } else {
                formatted.put("hydration_quality", 5);
            }
            
            formattedData.add(formatted);
        }
        
        // Sort by date
        formattedData.sort((a, b) -> ((String) a.get("date")).compareTo((String) b.get("date")));
        
        return formattedData;
    }

    public List<Map<String, Object>> formatStressData(List<Map<String, Object>> stressEntries) {
        List<Map<String, Object>> formattedData = new ArrayList<>();
        
        for (Map<String, Object> entry : stressEntries) {
            Map<String, Object> formatted = new HashMap<>();
            formatted.put("date", entry.get("date"));
            
            // Stress level as integer (1-10)
            Object stressLevel = entry.get("stress_level");
            if (stressLevel instanceof Number) {
                formatted.put("stress_level", ((Number) stressLevel).intValue());
            } else {
                formatted.put("stress_level", 5);
            }
            
            // Stress factors as string
            Object stressFactors = entry.get("stress_factors");
            formatted.put("stress_factors", stressFactors != null ? stressFactors.toString() : "");
            
            formattedData.add(formatted);
        }
        
        // Sort by date
        formattedData.sort((a, b) -> ((String) a.get("date")).compareTo((String) b.get("date")));
        
        return formattedData;
    }

    public List<Map<String, Object>> formatSleepData(List<Map<String, Object>> sleepEntries) {
        List<Map<String, Object>> formattedData = new ArrayList<>();
        
        for (Map<String, Object> entry : sleepEntries) {
            Map<String, Object> formatted = new HashMap<>();
            formatted.put("date", entry.get("date"));
            
            // Sleep hours as decimal
            Object sleepHours = entry.get("sleep_hours");
            if (sleepHours instanceof Number) {
                formatted.put("sleep_hours", ((Number) sleepHours).doubleValue());
            } else {
                formatted.put("sleep_hours", 7.0);
            }
            
            // Sleep quality as integer (1-10)
            Object sleepQuality = entry.get("sleep_quality");
            if (sleepQuality instanceof Number) {
                formatted.put("sleep_quality", ((Number) sleepQuality).intValue());
            } else {
                formatted.put("sleep_quality", 7);
            }
            
            formattedData.add(formatted);
        }
        
        // Sort by date
        formattedData.sort((a, b) -> ((String) a.get("date")).compareTo((String) b.get("date")));
        
        return formattedData;
    }

    public List<Map<String, Object>> formatWorkoutData(List<Map<String, Object>> workouts) {
        List<Map<String, Object>> formattedData = new ArrayList<>();
        
        for (Map<String, Object> workout : workouts) {
            Map<String, Object> formatted = new HashMap<>();
            
            // Extract date from dateISO (e.g., "2025-08-11" from full ISO string)
            String dateISO = (String) workout.get("dateISO");
            if (dateISO != null) {
                formatted.put("date", dateISO.substring(0, 10));
            }
            
            // Map dayType to workout_type
            String dayType = (String) workout.get("dayType");
            formatted.put("workout_type", dayType != null ? dayType : "Rest");
            
            // Format exercises
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> exercises = (List<Map<String, Object>>) workout.get("exercises");
            List<Map<String, Object>> formattedExercises = new ArrayList<>();
            
            if (exercises != null) {
                for (Map<String, Object> exercise : exercises) {
                    Map<String, Object> formattedExercise = new HashMap<>();
                    formattedExercise.put("name", exercise.get("name"));
                    
                    // Calculate average weight from sets
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> sets = (List<Map<String, Object>>) exercise.get("sets");
                    double avgWeight = 0.0;
                    if (sets != null && !sets.isEmpty()) {
                        double totalWeight = sets.stream()
                            .mapToDouble(set -> {
                                Object weight = set.get("weight");
                                return weight instanceof Number ? ((Number) weight).doubleValue() : 0.0;
                            })
                            .sum();
                        avgWeight = totalWeight / sets.size();
                    }
                    formattedExercise.put("weight", avgWeight);
                    
                    // Format sets
                    List<Map<String, Object>> formattedSets = new ArrayList<>();
                    if (sets != null) {
                        for (int i = 0; i < sets.size(); i++) {
                            Map<String, Object> set = sets.get(i);
                            Map<String, Object> formattedSet = new HashMap<>();
                            formattedSet.put("set", i + 1);
                            
                            Object reps = set.get("reps");
                            formattedSet.put("reps", reps instanceof Number ? ((Number) reps).intValue() : 0);
                            
                            formattedSets.add(formattedSet);
                        }
                    }
                    formattedExercise.put("sets", formattedSets);
                    
                    formattedExercises.add(formattedExercise);
                }
            }
            
            formatted.put("exercises", formattedExercises);
            formattedData.add(formatted);
        }
        
        // Sort by date
        formattedData.sort((a, b) -> ((String) a.get("date")).compareTo((String) b.get("date")));
        
        return formattedData;
    }

    public Map<String, Object> formatAllUserData(String userId, Map<String, Object> rawUserData) {
        Map<String, Object> formattedData = new HashMap<>();
        formattedData.put("user_id", userId);
        
        // Format nutrition data
        @SuppressWarnings("unchecked")
        List<FoodEntry> foodEntries = (List<FoodEntry>) rawUserData.get("foodEntries");
        if (foodEntries != null) {
            formattedData.put("nutrition", formatNutritionData(foodEntries));
        }
        
        // Format workout data
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> workouts = (List<Map<String, Object>>) rawUserData.get("workouts");
        if (workouts != null) {
            formattedData.put("workouts", formatWorkoutData(workouts));
        }
        
        // Format hydration data
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> hydration = (List<Map<String, Object>>) rawUserData.get("hydration");
        if (hydration != null) {
            formattedData.put("hydration", formatHydrationData(hydration));
        }
        
        // Format stress data
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> stress = (List<Map<String, Object>>) rawUserData.get("stress");
        if (stress != null) {
            formattedData.put("stress", formatStressData(stress));
        }
        
        // Format sleep data
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> sleep = (List<Map<String, Object>>) rawUserData.get("sleep");
        if (sleep != null) {
            formattedData.put("sleep", formatSleepData(sleep));
        }
        
        return formattedData;
    }
}