# Osiris Redux

> Planetary-scale open-source geospatial intelligence platform. Real-time tracking of aircraft, satellites, ships, and weather with AI-powered anomaly detection and trajectory prediction.

## What It Is

Osiris ingests live data from multiple sources (OpenSky, CelesTrak, AISStream, NOAA), processes it through event streaming, and serves it via real-time APIs and a 3D globe interface. Built for monitoring, analysis, and early warning systems.

## Live Data Sources

- **Aircraft** - OpenSky Network (ADS-B), updates every 10 seconds
- **Satellites** - CelesTrak TLEs, refreshed every 6 hours
- **Ships** - AISStream WebSocket, real-time AIS messages
- **Weather** - NOAA METAR reports, updates every 5 minutes

## Tech Stack

**Backend:**
- Node.js 20 + TypeScript (services, API)
- Python 3.12 + FastAPI (AI engine)
- TimescaleDB + PostGIS (time-series + spatial)
- Neo4j (graph relationships)
- Redpanda (event streaming)

**Frontend:**
- Next.js 14 + CesiumJS (3D globe)
- Zustand (state management)
- WebSocket (real-time updates)

**AI/ML:**
- Kalman Filter (trajectory prediction)
- Isolation Forest (anomaly detection)
- DBSCAN (clustering)
- LSTM (advanced forecasting)
- XGBoost (escalation risk scoring)

## Quick Start

```bash
# Install dependencies
npm install

# Start infrastructure (PostgreSQL, Neo4j, Redpanda)
cd infra && docker-compose up -d

# Run services
cd services/ingest-aircraft && npm run dev
cd services/ai-engine && python main.py

# Start API and frontend
cd apps/api-gateway && npm run dev
cd apps/web && npm run dev
```

Visit http://localhost:3000 for the 3D globe interface.

### Prerequisites

- Node.js 20+ (see `.nvmrc`)
- npm 10+
- Docker + Docker Compose v2
- Python 3.12+ (AI engine only)

### First-time setup

```bash
nvm use            # or: nvm install
npm install
(cd infra && docker-compose up -d)
```

## Deployment

### Render (One-Click)

1. Go to https://render.com/select-repo
2. Connect GitHub, select this repo
3. Choose `render.yaml` Blueprint
4. Deploy

**Cost:** ~$21/month (3 services on Starter plan)

### Docker

```bash
docker-compose -f docker-compose.render.yml up -d
```

## Testing

```bash
# TypeScript packages (unit + integration; integration tests gated by INTEGRATION=1)
npm test

# Python AI engine
cd services/ai-engine && pytest

# End-to-end (Playwright; web must be running or E2E_BASE_URL set)
cd apps/web && npm run e2e
```

**Test Coverage:** 37 passing tests (17 shared, 6 streaming, 14 database, 7 AI)

## Load and Chaos Testing

```bash
# Load: hit a public endpoint with N concurrent workers. Exits non-zero if >10% fail.
TARGET=https://osiris-api-xhfm.onrender.com/api/v1/health \
  CONCURRENCY=50 REQUESTS=1000 \
  node scripts/load-test.mjs

# Chaos: stop a service, wait, restart, verify recovery. Needs docker-compose up.
CHAOS_SERVICE=redpanda DOWNSEC=10 ./scripts/chaos-test.sh
```

## Project Status

✅ **Core Infrastructure** - Packages, streaming, database layers
✅ **Data Ingestion** - All 4 pipelines (aircraft, satellite, ships, weather)
✅ **AI Engine** - Kalman, anomaly detection, clustering, forecasting
✅ **API Gateway** - REST + WebSocket + JWT auth + RBAC
✅ **Frontend** - Next.js + CesiumJS globe
✅ **DevOps** - Docker, Render Blueprint, GitHub Actions CI

🔄 **Next:** Integration tests, load testing, production hardening

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Sources                              │
│  OpenSky    CelesTrak    AISStream    NOAA                  │
└─────┬──────────┬────────────┬───────────┬───────────────────┘
      │          │            │           │
      ▼          ▼            ▼           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Ingestion Services                           │
│  aircraft     satellite      ships      weather             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │   Redpanda    │
                  │  (Streaming)  │
                  └───────┬───────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 Stream Processor                             │
│           H3 Spatial Indexing + Enrichment                  │
└─────────────────────────────────────────────────────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
      ┌──────────┐ ┌──────────┐ ┌──────────┐
      │Timescale │ │   Neo4j  │ │ AI Engine│
      │   DB     │ │  (Graph) │ │(FastAPI) │
      │(PostGIS) │ │          │ │          │
      └──────────┘ └──────────┘ └──────────┘
              │                       │
              └───────────┬───────────┘
                          ▼
              ┌───────────────────────┐
              │     API Gateway       │
              │  (Express + WebSocket)│
              └───────────┬───────────┘
                          ▼
              ┌───────────────────────┐
              │   Next.js Frontend    │
              │   (CesiumJS Globe)    │
              └───────────────────────┘
```

## License

MIT - Built for open-source geospatial intelligence.

## Credits

Rebuilt from the ground up with strict TDD, systematic debugging, and production-grade DevOps. Original Osiris stalled in March 2026; this is the complete rebuild.

---

**Status:** Production-ready core, deployment-ready.
**Tests:** 37 passing
**Commits:** 27
**Deployed:** https://github.com/TheG1024/osiris