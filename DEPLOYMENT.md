# Osiris Redux - Deployment Guide

## GitHub Setup

```bash
# Create repository at github.com/new (name: osiris-redux)
# Then push:
cd /home/tsugiri/osiris-redux
git remote add origin git@github.com:YOUR_USERNAME/osiris-redux.git
git branch -M main
git push -u origin main
```

## Render Deployment Options

### Option 1: Docker Deploy (Recommended)

1. **Create a new Web Service on Render:**
   - Connect your GitHub repository
   - Branch: `main`
   - Build command: `docker build -f docker-compose.render.yml .`
   - Start command: `docker-compose -f docker-compose.render.yml up`

2. **Environment variables:**
   ```
   DATABASE_PASSWORD=<secure-password>
   NEO4J_PASSWORD=<secure-password>
   JWT_SECRET=<secure-random-string>
   ```

### Option 2: Individual Services

Deploy each service separately on Render:

#### API Gateway
- **Runtime:** Docker
- **Build context:** Root directory
- **Dockerfile:** `Dockerfile.api`
- **Port:** 4000
- **Env vars:** `DATABASE_URL`, `REDPANDA_BROKERS`, `JWT_SECRET`

#### AI Engine
- **Runtime:** Docker
- **Build context:** `services/ai-engine`
- **Dockerfile:** `Dockerfile.python`
- **Port:** 8000
- **Env vars:** `DATABASE_URL`

#### Database (Managed PostgreSQL)
Use Render's managed PostgreSQL with TimescaleDB extension:
- Create PostgreSQL database
- Attach to services
- Run `infra/init-db.sql` manually

#### Event Streaming (Managed Redpanda/Confluent)
Use Confluent Cloud or Redpanda Cloud:
- Create cluster
- Update `REDPANDA_BROKERS` in services

### Option 3: Simplest - API Only

For testing, deploy just the API gateway:

1. Create Web Service on Render
2. Root directory, Docker runtime
3. Use `Dockerfile.api`
4. Set environment variables
5. Connect to Render's managed PostgreSQL

## Cost Estimates (Render)

- **Web Service (API Gateway):** $7/month (starter)
- **Managed PostgreSQL:** $0/month (free tier, 90 days)
- **Total:** ~$7-25/month depending on scale

## Post-Deployment

1. **Health check:** `curl https://your-service.onrender.com/api/v1/health`
2. **WebSocket:** Connect to `wss://your-service.onrender.com/ws`
3. **Login:** POST to `/api/v1/auth/login` with credentials

## Troubleshooting

- **Build fails:** Check Node.js version (need 20+)
- **Database connection:** Verify `DATABASE_URL` format
- **WebSocket disconnects:** Ensure WebSocket support enabled in Render