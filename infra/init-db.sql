-- Osiris Redux Database Schema (PostgreSQL + PostGIS)
-- TimescaleDB extensions are optional; see init-db.timescale.sql for those.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Entities table (current state, upserted by source)
CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude DOUBLE PRECISION,
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    location GEOGRAPHY(POINT, 4326),
    UNIQUE (entity_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_entities_location ON entities USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_last_seen ON entities(entity_type, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_entities_metadata ON entities USING GIN(metadata);

-- Entity positions (time-series, plain table; promote to hypertable if Timescale enabled)
CREATE TABLE IF NOT EXISTS entity_positions (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude DOUBLE PRECISION,
    velocity DOUBLE PRECISION,
    heading DOUBLE PRECISION
);
CREATE INDEX IF NOT EXISTS idx_positions_entity ON entity_positions(entity_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_positions_type_time ON entity_positions(entity_type, time DESC);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    entity_id UUID,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    score DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);
CREATE INDEX IF NOT EXISTS idx_alerts_entity ON alerts(entity_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity, time DESC);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_entities_updated_at ON entities;
CREATE TRIGGER update_entities_updated_at
    BEFORE UPDATE ON entities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
