# 🏋️ GymApp Docker Deployment

This guide explains how to deploy the GymApp backend services using Docker containers.

## 🏗️ Architecture

The backend consists of two containerized services:

- **🤖 AI Backend** (Python Flask) - Port 8000
  - Machine learning analysis
  - OpenAI integration
  - Workout/nutrition/health analytics

- **🌐 Spring API** (Java SpringBoot) - Port 8080
  - API Gateway
  - Firebase integration
  - Data orchestration

## 📋 Prerequisites

- Docker & Docker Compose installed
- OpenAI API key
- Firebase service account JSON file

## 🚀 Quick Start

1. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. **Add Firebase Credentials**
   ```bash
   # Place your Firebase service account file at:
   spring-api/src/main/resources/firebase-service-account.json
   ```

3. **Start Services**
   ```bash
   ./docker-start.sh
   ```

## 🛠️ Manual Setup

### 1. Configure Environment

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` and add your keys:
```env
OPENAI_API_KEY=your_openai_api_key_here
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
```

### 2. Firebase Setup

Place your Firebase service account JSON file:
```
spring-api/src/main/resources/firebase-service-account.json
```

### 3. Build & Run

```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📡 Service Endpoints

### AI Backend (Port 8000)
- Health: `GET http://localhost:8000/health`
- Analyze: `POST http://localhost:8000/analyze`
- Workout Analysis: `POST http://localhost:8000/workout/analyze`

### Spring API (Port 8080)
- Health: `GET http://localhost:8080/actuator/health`
- Comprehensive Analysis: `POST http://localhost:8080/api/analysis/comprehensive`
- Workout Analysis: `POST http://localhost:8080/api/analysis/workout`
- Nutrition Analysis: `POST http://localhost:8080/api/analysis/nutrition`

## 🔧 Development

### Development Mode
For development with hot reloading:

```bash
# Edit docker-compose.yml and uncomment volume mounts
docker-compose up
```

### Individual Services

**AI Backend only:**
```bash
cd backend
docker build -t gymapp-ai .
docker run -p 8000:8000 --env-file ../.env gymapp-ai
```

**Spring API only:**
```bash
cd spring-api
docker build -t gymapp-spring .
docker run -p 8080:8080 -e SPRING_PROFILES_ACTIVE=docker gymapp-spring
```

## 🐛 Troubleshooting

### Service Health Checks
```bash
# Check AI backend
curl http://localhost:8000/health

# Check Spring API
curl http://localhost:8080/actuator/health
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ai-backend
docker-compose logs -f spring-api
```

### Reset Everything
```bash
# Stop and remove everything
docker-compose down -v --remove-orphans

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

## 🚀 Production Deployment

### Environment Variables
- Set `FLASK_ENV=production`
- Use specific CORS origins instead of `*`
- Use secure Firebase credentials management
- Set appropriate log levels

### Security
- Remove development volume mounts
- Use secrets management for API keys
- Configure proper firewall rules
- Use HTTPS/SSL termination

### Scaling
- Use Docker Swarm or Kubernetes for scaling
- Add load balancer for multiple instances
- Implement health checks and auto-restart
- Monitor resource usage

## 📊 Monitoring

### Health Checks
Both services include health check endpoints:
- AI Backend: `/health`
- Spring API: `/actuator/health`

### Logs
Services log to stdout/stderr for Docker log collection.

### Metrics
Spring Boot includes actuator endpoints for metrics:
- `/actuator/metrics`
- `/actuator/info`