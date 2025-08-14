#!/bin/bash

# GymApp Docker Startup Script

echo "🏋️ Starting GymApp Backend Services..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your API keys and configuration"
    echo "   Required: OPENAI_API_KEY"
    echo ""
    read -p "Press Enter to continue after editing .env file..."
fi

# Check if Firebase service account file exists
if [ ! -f "spring-api/src/main/resources/firebase-service-account.json" ]; then
    echo "⚠️  Firebase service account file not found!"
    echo "   Please place your firebase-service-account.json file in:"
    echo "   spring-api/src/main/resources/firebase-service-account.json"
    echo ""
    read -p "Press Enter to continue after adding the file..."
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Show status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🎉 GymApp Backend Services Started!"
echo ""
echo "📡 Available Services:"
echo "   🤖 AI Analysis API:  http://localhost:8000"
echo "   🌐 Spring Boot API:  http://localhost:8080"
echo ""
echo "🔍 Health Checks:"
echo "   🤖 AI Backend:       http://localhost:8000/health"
echo "   🌐 Spring API:       http://localhost:8080/actuator/health"
echo ""
echo "📋 Useful Commands:"
echo "   📊 View logs:        docker-compose logs -f"
echo "   🛑 Stop services:    docker-compose down"
echo "   🔄 Restart:          docker-compose restart"
echo "   🧹 Clean up:         docker-compose down -v --remove-orphans"