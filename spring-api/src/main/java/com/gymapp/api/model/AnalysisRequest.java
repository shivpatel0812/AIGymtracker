package com.gymapp.api.model;

public class AnalysisRequest {
    private String userId;
    private String dateRange; // e.g., "7days", "30days", "all"
    
    public AnalysisRequest() {}
    
    public AnalysisRequest(String userId, String dateRange) {
        this.userId = userId;
        this.dateRange = dateRange;
    }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getDateRange() { return dateRange; }
    public void setDateRange(String dateRange) { this.dateRange = dateRange; }
}