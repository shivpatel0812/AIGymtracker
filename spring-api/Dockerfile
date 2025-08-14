# Multi-stage build: Build stage
FROM openjdk:17-jdk-slim AS builder

# Install Maven
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy pom.xml first for better caching
COPY pom.xml .

# Download dependencies (this layer will be cached if pom.xml doesn't change)
RUN mvn dependency:resolve

# Copy source code
COPY src/ src/

# Build the application
RUN mvn clean package -DskipTests

# Runtime stage
FROM openjdk:17-jdk-slim

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r spring && useradd -r -g spring spring

# Set working directory
WORKDIR /app

# Copy the built jar from builder stage
COPY --from=builder /app/target/analysis-api-0.0.1-SNAPSHOT.jar app.jar

# Copy Firebase service account file
COPY src/main/resources/gymapp-5cb9b-firebase-adminsdk-fbsvc-754b066dc1.json /app/firebase-service-account.json

# Change ownership to spring user
RUN chown spring:spring app.jar && chown spring:spring /app/firebase-service-account.json

# Switch to non-root user
USER spring

# Expose port 8080
EXPOSE 8080

# Set environment variables
ENV SPRING_PROFILES_ACTIVE=docker

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
CMD ["java", "-jar", "app.jar"]