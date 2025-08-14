package com.gymapp.api.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.service-account-key:firebase-service-account.json}")
    private String serviceAccountKey;

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                Resource serviceAccount = getServiceAccountResource();
                
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount.getInputStream()))
                        .build();

                FirebaseApp.initializeApp(options);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to initialize Firebase", e);
        }
    }
    
    private Resource getServiceAccountResource() {
        // First try to load as a file system resource (for Docker)
        if (serviceAccountKey.startsWith("/") || serviceAccountKey.startsWith("app/")) {
            return new FileSystemResource(serviceAccountKey);
        }
        
        // Then try as classpath resource (for local development)
        try {
            return new ClassPathResource(serviceAccountKey);
        } catch (Exception e) {
            // If classpath fails, try as file system resource
            return new FileSystemResource(serviceAccountKey);
        }
    }
}