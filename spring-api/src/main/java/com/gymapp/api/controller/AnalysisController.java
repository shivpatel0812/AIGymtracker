package com.gymapp.api.controller;

import com.gymapp.api.model.AnalysisRequest;
import com.gymapp.api.model.AnalysisResponse;
import com.gymapp.api.service.AIPipelineService;
import com.gymapp.api.service.FirebaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/analysis")
@CrossOrigin(origins = "*") // Allow frontend to access
public class AnalysisController {

    @Autowired
    private FirebaseService firebaseService;

    @Autowired
    private AIPipelineService aiPipelineService;

    @PostMapping("/comprehensive")
    public ResponseEntity<AnalysisResponse> getComprehensiveAnalysis(@RequestBody AnalysisRequest request) {
        try {
            // 1. Retrieve all user data from Firebase
            Map<String, Object> userData = firebaseService.getAllUserData(request.getUserId(), request.getDateRange());
            
            // 2. Send data to AI pipeline for analysis
            Map<String, Object> analysisResult = aiPipelineService.getComprehensiveAnalysis(request.getUserId(), userData);
            
            // 3. Return response
            AnalysisResponse response = new AnalysisResponse(true, "Analysis completed successfully", analysisResult);
            return ResponseEntity.ok(response);
            
        } catch (ExecutionException | InterruptedException e) {
            AnalysisResponse errorResponse = new AnalysisResponse(false, "Failed to retrieve user data from Firebase: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        } catch (Exception e) {
            AnalysisResponse errorResponse = new AnalysisResponse(false, "Analysis failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/nutrition")
    public ResponseEntity<AnalysisResponse> getNutritionAnalysis(@RequestBody AnalysisRequest request) {
        try {
            // Get user data from Firebase
            Map<String, Object> userData = firebaseService.getAllUserData(request.getUserId(), request.getDateRange());
            
            // Extract nutrition data
            Map<String, Object> nutritionData = Map.of(
                "foodEntries", userData.get("foodEntries")
            );
            
            // Send to AI pipeline
            Map<String, Object> analysisResult = aiPipelineService.getNutritionAnalysis(request.getUserId(), nutritionData);
            
            AnalysisResponse response = new AnalysisResponse(true, "Nutrition analysis completed", analysisResult);
            return ResponseEntity.ok(response);
            
        } catch (ExecutionException | InterruptedException e) {
            AnalysisResponse errorResponse = new AnalysisResponse(false, "Failed to retrieve nutrition data: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        } catch (Exception e) {
            AnalysisResponse errorResponse = new AnalysisResponse(false, "Nutrition analysis failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/workout")
    public ResponseEntity<AnalysisResponse> getWorkoutAnalysis(@RequestBody AnalysisRequest request) {
        try {
            // Get user data from Firebase
            Map<String, Object> userData = firebaseService.getAllUserData(request.getUserId(), request.getDateRange());
            
            // Extract workout data
            Map<String, Object> workoutData = Map.of(
                "workouts", userData.get("workouts")
            );
            
            // Send to AI pipeline
            Map<String, Object> analysisResult = aiPipelineService.getWorkoutAnalysis(request.getUserId(), workoutData);
            
            AnalysisResponse response = new AnalysisResponse(true, "Workout analysis completed", analysisResult);
            return ResponseEntity.ok(response);
            
        } catch (ExecutionException | InterruptedException e) {
            AnalysisResponse errorResponse = new AnalysisResponse(false, "Failed to retrieve workout data: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        } catch (Exception e) {
            AnalysisResponse errorResponse = new AnalysisResponse(false, "Workout analysis failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "service", "Analysis API",
            "timestamp", String.valueOf(System.currentTimeMillis())
        ));
    }

    @PostMapping("/test-data")
    public ResponseEntity<Map<String, Object>> getTestData(@RequestBody AnalysisRequest request) {
        try {
            // Just return the Firebase data without AI analysis (for testing)
            Map<String, Object> userData = firebaseService.getAllUserData(request.getUserId(), request.getDateRange());
            return ResponseEntity.ok(userData);
            
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("error", "Failed to retrieve data: " + e.getMessage())
            );
        }
    }

    @PostMapping("/test-formatted-data")
    public ResponseEntity<Map<String, Object>> getTestFormattedData(@RequestBody AnalysisRequest request) {
        try {
            // Get Firebase data and format it like the test JSON files
            Map<String, Object> userData = firebaseService.getAllUserData(request.getUserId(), request.getDateRange());
            
            // Use the data formatting service to show exactly what gets sent to AI pipeline
            com.gymapp.api.service.DataFormattingService formatter = new com.gymapp.api.service.DataFormattingService();
            Map<String, Object> formattedData = formatter.formatAllUserData(request.getUserId(), userData);
            
            return ResponseEntity.ok(formattedData);
            
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("error", "Failed to retrieve and format data: " + e.getMessage())
            );
        }
    }
}