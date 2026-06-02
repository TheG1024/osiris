# Osiris Redux - Complete Implementation Plan

> **For Hermes:** Use `subagent-driven-development` skill to execute this plan task-by-task.
> Each task must follow **strict TDD**: test first → watch fail → minimal code → watch pass → refactor → commit.

**Goal:** Rebuild the Osiris planetary-scale geospatial intelligence platform from scratch with 100% test coverage on core logic, systematic debugging for all issues, and bite-sized tasks (2-5 min each).

**Architecture:** Turborepo monorepo with hexagonal architecture:
- `packages/shared` - Common types, constants, utilities
- `packages/db` - TimescaleDB + PostGIS + Neo4j queries
- `packages/streaming` - Redpanda (Kafka-compatible) client
- `services/ingest-*` - Data ingestion (OpenSky, CelesTrak, AISStream, NOAA, Cameras)
- `services/processing` - H3 spatial indexing + stream processor
- `services/ai-engine` - Python FastAPI (Kalman, LSTM, Isolation Forest, DBSCAN, XGBoost)
- `apps/api-gateway` - Express REST + WebSocket + JWT RBAC
- `apps/web` - Next.js 14 + CesiumJS + Zustand
- `infra` - Docker Compose (TimescaleDB, Neo4j, Redpanda, MinIO)

**Tech Stack:**
- Backend: Node.js 20 (TypeScript), Python 3.12 (FastAPI)
- Frontend: Next.js 14, TypeScript, CesiumJS, Resium, TailwindCSS, Zustand
- Streaming: Redpanda
- Databases: TimescaleDB+PostGIS, Neo4j, MinIO
- Testing: Vitest (TS), pytest (Python), Playwright (E2E)

**Non-Negotiable Rules:**
1. **NO production code without a failing test first** (TDD iron law)
2. **NO fixes without root cause investigation** (4-phase systematic debugging)
3. **Every task is bite-sized** (2-5 min, one file or one function)
4. **Frequent commits** (one commit per task)
5. **Two-stage review** (spec compliance → code quality)

---

## PHASE 0: FOUNDATION (Tasks 0.1 - 0.10)

### Task 0.1: Initialize Git Repository and Root Package.json
**Objective:** Create the root of the monorepo with basic package.json
**Files:** `package.json`, `.gitignore`
**Test:** `test -f package.json && grep -q '"workspaces"' package.json`
**TDD:** Write test → expect FAIL (files missing) → create files → expect PASS → commit

### Task 0.2: Install Turborepo and Verify
**Objective:** Install Turbo and verify it works
**Files:** Modify `package.json`
**Test:** `npm install && npx turbo --version`

### Task 0.3: Create Turbo Configuration
**Objective:** Create turbo.json with pipeline configuration
**Files:** `turbo.json`
**Test:** `test -f turbo.json && grep -q '"pipeline"' turbo.json`

### Task 0.4: Create Base TypeScript Configuration
**Objective:** Create shared tsconfig.base.json with strict mode
**Files:** `tsconfig.base.json`
**Test:** `test -f tsconfig.base.json && grep -q '"strict": true' tsconfig.base.json`

### Task 0.5: Create ESLint Configuration
**Objective:** Create root .eslintrc.js with TypeScript support
**Files:** `.eslintrc.js`, `.eslintignore`
**Test:** `test -f .eslintrc.js && grep -q '@typescript-eslint' .eslintrc.js`

### Task 0.6: Create Prettier Configuration
**Objective:** Create .prettierrc with consistent formatting rules
**Files:** `.prettierrc`, `.prettierignore`
**Test:** `test -f .prettierrc && grep -q '"printWidth"' .prettierrc`

### Task 0.7: Create Directory Structure
**Objective:** Create all monorepo directories
**Files:** `apps/`, `services/`, `packages/`, `infra/`
**Test:** `test -d apps && test -d services && test -d packages && test -d infra`

### Task 0.8: Create Shared Package Structure
**Objective:** Initialize @osiris/shared package
**Files:** `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`
**Test:** `test -f packages/shared/package.json && grep -q '"@osiris/shared"' packages/shared/package.json`

### Task 0.9: Create GeoEntity Type with TDD
**Objective:** Define the core GeoEntity interface with TypeScript types
**Files:** `packages/shared/src/types/geo-entity.ts`, `packages/shared/src/types/index.ts`, `packages/shared/src/types/geo-entity.test.ts`
**TDD Steps:**
1. Write failing test for GeoEntity creation
2. Run test → FAIL (types don't exist)
3. Implement GeoEntity interface
4. Run test → PASS
5. Commit

### Task 0.10: Create WebSocket Message Types with TDD
**Objective:** Define WS message types and payloads
**Files:** `packages/shared/src/types/ws-message.ts`, `packages/shared/src/types/ws-message.test.ts`
**TDD:** Test message type union, EntityBatchPayload, AlertPayload → Implement → Verify

---

## PHASE 1: SHARED PACKAGE COMPLETE (Tasks 1.1 - 1.15)

### Task 1.1: Create Redpanda Topic Constants
**Files:** `packages/shared/src/constants/topics.ts`
**TDD:** Test TOPICS object has all required topics → Implement → Verify

### Task 1.2: Create Permission Constants and RBAC Types
**Files:** `packages/shared/src/constants/permissions.ts`, `packages/shared/src/constants/permissions.test.ts`
**TDD:** Test UserRole type, PERMISSIONS map → Implement → Verify

### Task 1.3: Create Shared Utility Functions
**Files:** `packages/shared/src/utils/haversine.ts`, `packages/shared/src/utils/haversine.test.ts`
**TDD:** Test haversine distance calculation → Implement → Verify

### Task 1.4: Build and Export Shared Package
**Test:** `cd packages/shared && npm run build && test -f dist/index.d.ts`

---

## PHASE 2: STREAMING PACKAGE (Tasks 2.1 - 2.10)

### Task 2.1: Initialize @osiris/streaming Package
**Files:** `packages/streaming/package.json`, `packages/streaming/tsconfig.json`

### Task 2.2: Create Redpanda Consumer with TDD
**Files:** `packages/streaming/src/consumer.ts`, `packages/streaming/src/consumer.test.ts`
**TDD:** Test consumer connects, subscribes, receives messages → Mock Redpanda → Implement → Verify

### Task 2.3: Create Redpanda Producer with TDD
**Files:** `packages/streaming/src/producer.ts`, `packages/streaming/src/producer.test.ts`
**TDD:** Test producer connects, publishes to topic → Mock Redpanda → Implement → Verify

---

## PHASE 3: DATABASE PACKAGE (Tasks 3.1 - 3.20)

### Task 3.1: Initialize @osiris/db Package
**Files:** `packages/db/package.json`, `packages/db/tsconfig.json`

### Task 3.2: Create TimescaleDB Schema SQL
**Files:** `packages/db/schema/init.sql`
**TDD:** Test SQL file exists, contains CREATE HYPERTABLE → Implement → Verify

### Task 3.3: Create Entity Repository with TDD
**Files:** `packages/db/src/repository/entity-repository.ts`, `packages/db/src/repository/entity-repository.test.ts`
**TDD:** Test insertEntity, getEntity, getEntitiesByType → Mock DB → Implement → Verify

### Task 3.4: Create Proximity Query Function with TDD
**Files:** `packages/db/src/query/proximity.ts`, `packages/db/src/query/proximity.test.ts`
**TDD:** Test finds entities within radius using PostGIS → Implement → Verify

---

## PHASE 4: INGESTION SERVICES (Tasks 4.1 - 4.50)

### Task 4.1: Initialize ingest-aircraft Service
**Files:** `services/ingest-aircraft/package.json`, `services/ingest-aircraft/tsconfig.json`

### Task 4.2: Create OpenSky API Client with TDD
**Files:** `services/ingest-aircraft/src/client/opensky-client.ts`, `services/ingest-aircraft/src/client/opensky-client.test.ts`
**TDD:** Test API call with rate limiting → Mock HTTP → Implement → Verify

### Task 4.3: Create ADS-B Message Parser with TDD
**Files:** `services/ingest-aircraft/src/parser/adsb-parser.ts`, `services/ingest-aircraft/src/parser/adsb-parser.test.ts`
**TDD:** Test parses raw ADS-B to GeoEntity → Implement → Verify

### Task 4.4: Create Redpanda Publisher with TDD
**Files:** `services/ingest-aircraft/src/publisher.ts`, `services/ingest-aircraft/src/publisher.test.ts`

### Task 4.5: Create Main Ingestion Loop with TDD
**Files:** `services/ingest-aircraft/src/index.ts`, `services/ingest-aircraft/src/index.test.ts`
**TDD:** Test polling interval, error handling, graceful shutdown → Implement → Verify

*(Repeat pattern for ingest-satellite, ingest-ships, ingest-weather, ingest-cameras)*

---

## PHASE 5: STREAM PROCESSING SERVICE (Tasks 5.1 - 5.20)

### Task 5.1: Initialize processing Service
### Task 5.2: Create H3 Indexing Module with TDD
### Task 5.3: Create Stream Processor with TDD
### Task 5.4: Create TimescaleDB Writer with TDD
### Task 5.5: Create Neo4j Writer with TDD

---

## PHASE 6: AI ENGINE (Tasks 6.1 - 6.40)

### Task 6.1: Initialize Python FastAPI AI Engine
**Files:** `services/ai-engine/main.py`, `services/ai-engine/requirements.txt`, `services/ai-engine/Dockerfile`

### Task 6.2: Create Kalman Filter with TDD (Python)
**Files:** `services/ai-engine/kalman.py`, `services/ai-engine/test_kalman.py`
**TDD:**
```python
# FIRST: Write test
def test_kalman_predicts_trajectory():
    positions = [(0, 0, 0), (0.1, 0.1, 60000), (0.2, 0.2, 120000)]
    kf = KalmanFilter()
    predictions = kf.predict(positions, steps=10)
    assert len(predictions) == 10
    assert predictions[0][0] > 0.2  # Continues trajectory

# THEN: Watch FAIL
# THEN: Implement minimal Kalman
# THEN: Watch PASS
```

### Task 6.3: Create Isolation Forest with TDD
**Files:** `services/ai-engine/anomaly.py`, `services/ai-engine/test_anomaly.py`

### Task 6.4: Create DBSCAN Clustering with TDD
**Files:** `services/ai-engine/clustering.py`, `services/ai-engine/test_clustering.py`

### Task 6.5: Create LSTM Model with TDD
**Files:** `services/ai-engine/lstm.py`, `services/ai-engine/test_lstm.py`

### Task 6.6: Create XGBoost Escalation Model with TDD
**Files:** `services/ai-engine/escalation.py`, `services/ai-engine/test_escalation.py`

### Task 6.7: Create Redpanda Consumer Thread with TDD
### Task 6.8: Create Alert Publisher with TDD

---

## PHASE 7: API GATEWAY (Tasks 7.1 - 7.30)

### Task 7.1: Initialize api-gateway App
### Task 7.2: Create Express Server with TDD
### Task 7.3: Create Health Endpoint with TDD
### Task 7.4: Create GET /entities Endpoint with TDD
### Task 7.5: Create GET /entities/:id Endpoint with TDD
### Task 7.6: Create GET /query/proximity Endpoint with TDD
### Task 7.7: Create GET /history/:entityId Endpoint with TDD
### Task 7.8: Create GET /alerts Endpoint with TDD
### Task 7.9: Create WebSocket Server with TDD
### Task 7.10: Create JWT Auth Middleware with TDD
### Task 7.11: Create RBAC Permission Guards with TDD

---

## PHASE 8: FRONTEND (Tasks 8.1 - 8.40)

### Task 8.1: Initialize Next.js Web App
### Task 8.2: Create CesiumJS Globe Component with TDD (Vitest)
### Task 8.3: Create Entity Billboard Rendering with TDD
### Task 8.4: Create GPU Instancing for 1000+ Entities with TDD
### Task 8.5: Create WebSocket Hook with TDD
### Task 8.6: Create Zustand Entity Store with TDD
### Task 8.7: Create EntityDetail Panel with TDD
### Task 8.8: Create AlertsPanel with TDD
### Task 8.9: Create StatsPanel with TDD
### Task 8.10: Create SearchPanel with TDD

---

## PHASE 9: INFRASTRUCTURE (Tasks 9.1 - 9.15)

### Task 9.1: Create Docker Compose File
### Task 9.2: Create TimescaleDB Service Definition
### Task 9.3: Create Neo4j Service Definition
### Task 9.4: Create Redpanda Service Definition
### Task 9.5: Create MinIO Service Definition
### Task 9.6: Create Docker Network Configuration
### Task 9.7: Create Health Check for All Services
### Task 9.8: Test All Containers Start Successfully

---

## PHASE 10: TESTING INFRASTRUCTURE (Tasks 10.1 - 10.10)

### Task 10.1: Setup Jest for Backend
### Task 10.2: Setup Vitest for Frontend
### Task 10.3: Setup pytest for AI Engine
### Task 10.4: Setup Playwright for E2E
### Task 10.5: Create GitHub Actions CI Pipeline

---

## PHASE 11: DOCUMENTATION (Tasks 11.1 - 11.10)

### Task 11.1: Create README.md with Architecture Diagram
### Task 11.2: Create API Documentation
### Task 11.3: Create Deployment Guide
### Task 11.4: Create Development Setup Guide

---

## PHASE 12: LOAD AND CHAOS TESTING (Tasks 12.1 - 12.10)

### Task 12.1: Create Load Test for Ingestion (10K entities/sec)
### Task 12.2: Create Load Test for API (1K concurrent users)
### Task 12.3: Create Chaos Test: Redpanda Restart
### Task 12.4: Create Chaos Test: Database Restart

---

## EXECUTION STRATEGY

Execute with `subagent-driven-development`:
- One subagent per task (or per task group for small tasks)
- Two-stage review: spec compliance → code quality
- TDD enforced: no production code without failing test first
- Systematic debugging: 4-phase root cause before any fix

**Ready to execute. Confirm to proceed with Phase 0.**