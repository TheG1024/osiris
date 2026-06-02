# Osiris Infrastructure

Docker Compose stack for the Osiris Redux platform.

## Services

- **TimescaleDB** (port 5432) - Time-series database with PostGIS
- **Neo4j** (ports 7474, 7687) - Graph database for relationships
- **Redpanda** (port 9092) - Kafka-compatible streaming
- **MinIO** (ports 9000, 9001) - S3-compatible object storage

## Quick Start

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f timescaledb

# Stop all services
docker-compose down

# Stop and remove volumes (deletes data)
docker-compose down -v
```

## Database Setup

The `init-db.sql` file is automatically run on first TimescaleDB startup.
It creates:
- `entities` table with PostGIS spatial indexing
- `entity_positions` hypertable for time-series data
- `alerts` hypertable for anomaly alerts
- Continuous aggregate for hourly statistics

## Connection Strings

- TimescaleDB: `postgresql://osiris:osiris_dev@localhost:5432/osiris`
- Neo4j: `bolt://neo4j:osiris_dev@localhost:7687`
- Redpanda: `localhost:9092`
- MinIO: `http://localhost:9000` (console: http://localhost:9001)
