package com.gymapp.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class FoodEntry {
    private String id;
    
    @JsonProperty("createdAtISO")
    private String createdAtISO;
    
    @JsonProperty("imageUrl")
    private String imageUrl;
    
    @JsonProperty("imageStoragePath")
    private String imageStoragePath;
    
    private String description;
    
    private Macros macros;
    
    public static class Macros {
        private Double calories;
        private Double protein;
        private Double carbs;
        private Double fat;
        
        // Constructors
        public Macros() {}
        
        public Macros(Double calories, Double protein, Double carbs, Double fat) {
            this.calories = calories;
            this.protein = protein;
            this.carbs = carbs;
            this.fat = fat;
        }
        
        // Getters and setters
        public Double getCalories() { return calories; }
        public void setCalories(Double calories) { this.calories = calories; }
        
        public Double getProtein() { return protein; }
        public void setProtein(Double protein) { this.protein = protein; }
        
        public Double getCarbs() { return carbs; }
        public void setCarbs(Double carbs) { this.carbs = carbs; }
        
        public Double getFat() { return fat; }
        public void setFat(Double fat) { this.fat = fat; }
    }
    
    // Constructors
    public FoodEntry() {}
    
    public FoodEntry(String id, String createdAtISO, String imageUrl, 
                    String imageStoragePath, String description, Macros macros) {
        this.id = id;
        this.createdAtISO = createdAtISO;
        this.imageUrl = imageUrl;
        this.imageStoragePath = imageStoragePath;
        this.description = description;
        this.macros = macros;
    }
    
    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getCreatedAtISO() { return createdAtISO; }
    public void setCreatedAtISO(String createdAtISO) { this.createdAtISO = createdAtISO; }
    
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    
    public String getImageStoragePath() { return imageStoragePath; }
    public void setImageStoragePath(String imageStoragePath) { this.imageStoragePath = imageStoragePath; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Macros getMacros() { return macros; }
    public void setMacros(Macros macros) { this.macros = macros; }
}