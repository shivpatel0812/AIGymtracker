package com.gymapp.api.service;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import com.gymapp.api.model.FoodEntry;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
public class FirebaseService {

    private Firestore getFirestore() {
        return FirestoreClient.getFirestore();
    }

    public List<FoodEntry> getFoodEntriesForUser(String userId, String dateRange) throws ExecutionException, InterruptedException {
        Firestore db = getFirestore();
        CollectionReference foodEntries = db.collection("users").document(userId).collection("foodEntries");
        
        Query query = foodEntries.orderBy("createdAtISO", Query.Direction.DESCENDING);
        
        // Apply date filtering based on range
        if (!"all".equals(dateRange)) {
            String startDate = getStartDateForRange(dateRange);
            query = query.whereGreaterThanOrEqualTo("createdAtISO", startDate);
        }
        
        QuerySnapshot querySnapshot = query.get().get();
        List<FoodEntry> entries = new ArrayList<>();
        
        for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
            FoodEntry entry = convertDocumentToFoodEntry(document);
            entries.add(entry);
        }
        
        return entries;
    }

    public Map<String, Object> getAllUserData(String userId, String dateRange) throws ExecutionException, InterruptedException {
        Map<String, Object> userData = new HashMap<>();
        
        // Get food entries
        List<FoodEntry> foodEntries = getFoodEntriesForUser(userId, dateRange);
        userData.put("foodEntries", foodEntries);
        
        // Get other data types (workouts, hydration, stress, sleep, etc.)
        userData.put("workouts", getWorkoutsForUser(userId, dateRange));
        userData.put("hydration", getHydrationForUser(userId, dateRange));
        userData.put("stress", getStressForUser(userId, dateRange));
        userData.put("sleep", getSleepForUser(userId, dateRange));
        
        return userData;
    }

    private List<Map<String, Object>> getWorkoutsForUser(String userId, String dateRange) throws ExecutionException, InterruptedException {
        Firestore db = getFirestore();
        CollectionReference workouts = db.collection("users").document(userId).collection("workouts");
        
        Query query = workouts.orderBy("dateISO", Query.Direction.DESCENDING);
        
        if (!"all".equals(dateRange)) {
            String startDate = getStartDateForRange(dateRange);
            query = query.whereGreaterThanOrEqualTo("dateISO", startDate);
        }
        
        QuerySnapshot querySnapshot = query.get().get();
        List<Map<String, Object>> workoutList = new ArrayList<>();
        
        for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
            Map<String, Object> workout = document.getData();
            workout.put("id", document.getId());
            workoutList.add(workout);
        }
        
        return workoutList;
    }

    private List<Map<String, Object>> getHydrationForUser(String userId, String dateRange) throws ExecutionException, InterruptedException {
        Firestore db = getFirestore();
        CollectionReference hydration = db.collection("users").document(userId).collection("hydration");
        
        Query query = hydration.orderBy("date", Query.Direction.DESCENDING);
        
        if (!"all".equals(dateRange)) {
            String startDate = getStartDateForRange(dateRange).split("T")[0]; // Just date part
            query = query.whereGreaterThanOrEqualTo("date", startDate);
        }
        
        QuerySnapshot querySnapshot = query.get().get();
        List<Map<String, Object>> hydrationList = new ArrayList<>();
        
        for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
            Map<String, Object> hydrationEntry = document.getData();
            hydrationEntry.put("id", document.getId());
            hydrationList.add(hydrationEntry);
        }
        
        return hydrationList;
    }

    private List<Map<String, Object>> getStressForUser(String userId, String dateRange) throws ExecutionException, InterruptedException {
        Firestore db = getFirestore();
        CollectionReference stress = db.collection("users").document(userId).collection("stress");
        
        Query query = stress.orderBy("date", Query.Direction.DESCENDING);
        
        if (!"all".equals(dateRange)) {
            String startDate = getStartDateForRange(dateRange).split("T")[0]; // Just date part
            query = query.whereGreaterThanOrEqualTo("date", startDate);
        }
        
        QuerySnapshot querySnapshot = query.get().get();
        List<Map<String, Object>> stressList = new ArrayList<>();
        
        for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
            Map<String, Object> stressEntry = document.getData();
            stressEntry.put("id", document.getId());
            stressList.add(stressEntry);
        }
        
        return stressList;
    }

    private List<Map<String, Object>> getSleepForUser(String userId, String dateRange) throws ExecutionException, InterruptedException {
        Firestore db = getFirestore();
        CollectionReference sleep = db.collection("users").document(userId).collection("sleep");
        
        Query query = sleep.orderBy("date", Query.Direction.DESCENDING);
        
        if (!"all".equals(dateRange)) {
            String startDate = getStartDateForRange(dateRange).split("T")[0]; // Just date part
            query = query.whereGreaterThanOrEqualTo("date", startDate);
        }
        
        QuerySnapshot querySnapshot = query.get().get();
        List<Map<String, Object>> sleepList = new ArrayList<>();
        
        for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
            Map<String, Object> sleepEntry = document.getData();
            sleepEntry.put("id", document.getId());
            sleepList.add(sleepEntry);
        }
        
        return sleepList;
    }

    private FoodEntry convertDocumentToFoodEntry(QueryDocumentSnapshot document) {
        Map<String, Object> data = document.getData();
        
        FoodEntry entry = new FoodEntry();
        entry.setId(document.getId());
        entry.setCreatedAtISO((String) data.get("createdAtISO"));
        entry.setImageUrl((String) data.get("imageUrl"));
        entry.setImageStoragePath((String) data.get("imageStoragePath"));
        entry.setDescription((String) data.get("description"));
        
        // Handle macros
        @SuppressWarnings("unchecked")
        Map<String, Object> macrosData = (Map<String, Object>) data.get("macros");
        if (macrosData != null) {
            FoodEntry.Macros macros = new FoodEntry.Macros();
            macros.setCalories(getDoubleValue(macrosData.get("calories")));
            macros.setProtein(getDoubleValue(macrosData.get("protein")));
            macros.setCarbs(getDoubleValue(macrosData.get("carbs")));
            macros.setFat(getDoubleValue(macrosData.get("fat")));
            entry.setMacros(macros);
        }
        
        return entry;
    }

    private Double getDoubleValue(Object value) {
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return null;
    }

    private String getStartDateForRange(String dateRange) {
        LocalDate now = LocalDate.now();
        LocalDate startDate;
        
        switch (dateRange) {
            case "7days":
                startDate = now.minusDays(7);
                break;
            case "30days":
                startDate = now.minusDays(30);
                break;
            case "90days":
                startDate = now.minusDays(90);
                break;
            default:
                startDate = now.minusDays(30); // Default to 30 days
        }
        
        return startDate.format(DateTimeFormatter.ISO_LOCAL_DATE) + "T00:00:00.000Z";
    }
}