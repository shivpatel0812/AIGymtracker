package com.gymapp.api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AIPipelineService {

    @Value("${ai.pipeline.url:http://localhost:8000}")
    private String aiPipelineUrl;

    @Autowired
    private DataFormattingService dataFormattingService;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> analyzeUserData(String userId, Map<String, Object> userData) {
        try {
            String endpoint = aiPipelineUrl + "/analyze";
            
            // Format data to match test JSON structure
            Map<String, Object> formattedData = dataFormattingService.formatAllUserData(userId, userData);
            
            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Create HTTP entity with formatted data
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(formattedData, headers);
            
            // Make API call to Python backend
            ResponseEntity<Map> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                entity,
                Map.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> analysisResult = response.getBody();
                return analysisResult;
            } else {
                throw new RuntimeException("AI Pipeline returned unsuccessful response");
            }
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to connect to AI Pipeline: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> getNutritionAnalysis(String userId, Map<String, Object> nutritionData) {
        try {
            String endpoint = aiPipelineUrl + "/nutrition/analyze";
            
            // Format nutrition data to match test JSON structure
            @SuppressWarnings("unchecked")
            List<com.gymapp.api.model.FoodEntry> foodEntries = 
                (List<com.gymapp.api.model.FoodEntry>) nutritionData.get("foodEntries");
            
            Map<String, Object> requestPayload = new HashMap<>();
            requestPayload.put("user_id", userId);
            if (foodEntries != null) {
                requestPayload.put("nutrition", dataFormattingService.formatNutritionData(foodEntries));
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestPayload, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                entity,
                Map.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> analysisResult = response.getBody();
                return analysisResult;
            } else {
                throw new RuntimeException("Nutrition analysis failed");
            }
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to get nutrition analysis: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> getWorkoutAnalysis(String userId, Map<String, Object> workoutData) {
        try {
            String endpoint = aiPipelineUrl + "/workout/analyze";
            
            // Format workout data to match test JSON structure
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> workouts = (List<Map<String, Object>>) workoutData.get("workouts");
            
            Map<String, Object> requestPayload = new HashMap<>();
            requestPayload.put("user_id", userId);
            if (workouts != null) {
                requestPayload.put("workouts", dataFormattingService.formatWorkoutData(workouts));
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestPayload, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                entity,
                Map.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> analysisResult = response.getBody();
                return analysisResult;
            } else {
                throw new RuntimeException("Workout analysis failed");
            }
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to get workout analysis: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> getComprehensiveAnalysis(String userId, Map<String, Object> allUserData) {
        // Use the main analyze endpoint with properly formatted data
        return analyzeUserData(userId, allUserData);
    }
    
    public Map<String, Object> getComprehensiveAnalysisOld(String userId, Map<String, Object> allUserData) {
        try {
            String endpoint = aiPipelineUrl + "/comprehensive/analyze";
            
            // Format data to match test JSON structure
            Map<String, Object> formattedData = dataFormattingService.formatAllUserData(userId, allUserData);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(formattedData, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                entity,
                Map.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> analysisResult = response.getBody();
                return analysisResult;
            } else {
                throw new RuntimeException("Comprehensive analysis failed");
            }
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to get comprehensive analysis: " + e.getMessage(), e);
        }
    }
}