#!/bin/bash

echo "🚀 Starting GymApp Analysis API..."
echo "================================"

# Set JAVA_HOME to Java 17
export JAVA_HOME="/Users/shivpatel/Library/Java/JavaVirtualMachines/semeru-17.0.9-1/Contents/Home"

echo "Java Version:"
java -version
echo ""

echo "JAVA_HOME: $JAVA_HOME"
echo ""

echo "Starting Spring Boot server..."
echo "Server will be available at: http://localhost:8080"
echo "Health check: http://localhost:8080/api/analysis/health"
echo ""

# Start the server
mvn spring-boot:run