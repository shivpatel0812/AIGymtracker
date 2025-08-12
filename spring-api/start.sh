

#!/bin/bash

echo "Starting GymApp Analysis API..."
echo "Make sure you have:"
echo "1. Firebase service account key in src/main/resources/"
echo "2. Python AI pipeline running on port 8000"
echo ""

# Build and run the Spring Boot application
mvn spring-boot:run
