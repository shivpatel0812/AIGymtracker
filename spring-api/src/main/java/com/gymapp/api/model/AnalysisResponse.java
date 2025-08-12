package com.gymapp.api.model;

import java.util.Map;

public class AnalysisResponse {
    private boolean success;
    private String message;
    private Map<String, Object> analysis;
    private String error;
    
    public AnalysisResponse() {}
    
    public AnalysisResponse(boolean success, String message, Map<String, Object> analysis) {
        this.success = success;
        this.message = message;
        this.analysis = analysis;
    }
    
    public AnalysisResponse(boolean success, String error) {
        this.success = success;
        this.error = error;
    }
    
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public Map<String, Object> getAnalysis() { return analysis; }
    public void setAnalysis(Map<String, Object> analysis) { this.analysis = analysis; }
    
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}