# Osiris Redux

> Planetary-scale open-source geospatial intelligence platform.
> Rebuilt from scratch with strict Test-Driven Development and systematic debugging.

## Architecture

Monorepo built with Turborepo, consisting of:

### Packages (`packages/`)
- `@osiris/shared` - Common types, constants, utilities
- `@osiris/db` - TimescaleDB + PostGIS + Neo4j queries
- `@osiris/streaming` - Redpanda consumer/producer wrappers

### Services (`services/`)
- `ingest-aircraft` - OpenSky ADS-B data ingestion (10s poll)
- `ingest-satellite` - CelesTrak TLEs (6h refresh)
- `ingest-ships` - AISStream ship tracking (WebSocket)
- `ingest-weather` - NOAA METAR data (5min poll)
- `processing` - H3 spatial indexing + stream processor
- `ai-engine` - Python FastAPI (Kalman, LSTM, Isolation Forest, DBSCAN, XGBoost)

### Apps (`apps/`)
- `api-gateway` - Express REST + WebSocket + JWT auth + RBAC
- `web` - Next.js 14 + CesiumJS 3D globe + Zustand

## Tech Stack

- **Backend**: Node.js 20 (TypeScript), Python 3.12 (FastAPI)
- **Frontend**: Next.js 14, CesiumJS, Resium, TailwindCSS, Zustand
- **Streaming**: Redpanda (Kafka-compatible)
- **Databases**: TimescaleDB + PostGIS, Neo4j, MinIO
- **Testing**: Vitest (TS), pytest (Python), Playwright (E2E)

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- Docker + Docker Compose

### Setup
```bash
# Install dependencies
npm install

# Start infrastructure
cd infra && docker-compose up -d

# Build packages
npm run build

# Run services
cd services/ingest-aircraft && npm run dev
cd services/ai-engine && python main.py

# Run API gateway
cd apps/api-gateway && npm run dev

# Run frontend
cd apps/web && npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run specific package
cd packages/shared && npm test

# Python tests
cd services/ai-engine && pytest
```

## Development Workflow

This project follows **strict TDD**:
1. Write failing test first
2. Watch it fail (RED)
3. Implement minimal code
4. Watch it pass (GREEN)
5. Refactor with confidence

All issues follow **systematic 4-phase debugging**:
1. Root cause investigation
2. Pattern analysis
3. Hypothesis & testing
4. Implementation + regression test

## License

MIT
