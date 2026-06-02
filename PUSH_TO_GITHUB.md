# Push to GitHub Instructions

## Step 1: Create Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `osiris-redux`
3. Description: "Planetary-scale geospatial intelligence platform - rebuilt with strict TDD"
4. Public repository
5. **Do NOT** initialize with README (we already have one)
6. Click "Create repository"

## Step 2: Push Code

Run these commands in the terminal:

```bash
cd /home/tsugiri/osiris-redux

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin git@github.com:YOUR_USERNAME/osiris-redux.git

# Or use HTTPS if you don't have SSH keys:
# git remote add origin https://github.com/YOUR_USERNAME/osiris-redux.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 3: Deploy to Render

### Method A: Direct GitHub Integration (Easiest)

1. Go to https://render.com and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select `osiris-redux` repository
5. Configure:
   - **Branch:** main
   - **Root Directory:** `apps/api-gateway`
   - **Runtime:** Docker
   - **Build Command:** `docker build -f ../../Dockerfile.api ../../`
   - **Start Command:** `node dist/server.js`
   - **Port:** 4000
6. Add environment variables:
   ```
   DATABASE_URL=postgresql://osiris:osiris_dev@localhost:5432/osiris
   JWT_SECRET=your-secret-key-change-in-production
   REDPANDA_BROKERS=localhost:9092
   ```
7. Choose instance type (Starter $7/month is fine for testing)
8. Click "Create Web Service"

### Method B: Docker Compose (Full Stack)

For the complete stack (PostgreSQL, Neo4j, Redpanda, API, AI Engine):

1. Create a **Blueprint** on Render
2. Connect `osiris-redux` repository
3. Point to `docker-compose.render.yml`
4. Render will deploy all services automatically

### Method C: Manual Docker Deploy

```bash
# Build locally
docker build -f Dockerfile.api -t osiris-api .

# Tag for Render container registry
docker tag osiris-api registry.render.com/<project-id>/osiris-api:latest

# Push to Render
docker push registry.render.com/<project-id>/osiris-api:latest
```

## Step 4: Verify Deployment

After deployment completes (~5-10 minutes):

```bash
# Replace with your Render URL
curl https://osiris-redux.onrender.com/api/v1/health

# Expected response:
# {"status":"healthy","service":"api-gateway","timestamp":1234567890}
```

## Environment Variables for Production

Set these in Render dashboard:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | From Render PostgreSQL | Auto-generated |
| `DATABASE_PASSWORD` | Secure random string | 32+ chars |
| `NEO4J_PASSWORD` | Secure random string | 32+ chars |
| `JWT_SECRET` | Secure random string | 32+ chars |
| `REDPANDA_BROKERS` | From Confluent Cloud / Redpanda Cloud | External streaming |

## Cost Optimization

- Start with **Starter** instances ($7/month each)
- Use Render's **free tier** for PostgreSQL (90 days)
- Auto-suspend idle services (Render feature)
- Total estimated cost: $15-30/month for full stack

## Next Steps After Deploy

1. Connect frontend to deployed API
2. Set up CI/CD with GitHub Actions
3. Configure custom domain
4. Enable HTTPS (automatic on Render)
5. Set up monitoring and alerts

## Support

- Render docs: https://render.com/docs
- Osiris project: `/home/tsugiri/osiris-redux/README.md`
- Deployment guide: `/home/tsugiri/osiris-redux/DEPLOYMENT.md`