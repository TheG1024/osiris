-- Osiris Redux Database Schema
-- TimescaleDB + PostGIS

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Entities table (current state)
CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude DOUBLE PRECISION,
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    location GEOGRAPHY(POINT, 4326)
);

CREATE INDEX IF NOT EXISTS idx_entities_location ON entities USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_metadata ON entities USING GIN(metadata);

-- Entity positions (time-series, hypertable)
CREATE TABLE IF NOT EXISTS entity_positions (
    time TIMESTAMPTZ NOT NULL,
    entity_id UUID NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude DOUBLE PRECISION,
    velocity DOUBLE PRECISION,
    heading DOUBLE PRECISION
);

SELECT create_hypertable('entity_positions', 'time', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_positions_entity ON entity_positions(entity_id, time DESC);

-- Alerts table
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

SELECT create_hypertable('alerts', 'time', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_alerts_entity ON alerts(entity_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity, time DESC);

-- Continuous aggregate for entity counts (last hour)
CREATE MATERIALIZED VIEW IF NOT EXISTS entity_stats_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS bucket,
    COUNT(*) AS total_positions,
    COUNT(DISTINCT entity_id) AS unique_entities
FROM entity_positions
GROUP BY bucket;

SELECT add_continuous_aggregate_policy('entity_stats_hourly',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE);

-- Trigger to update entity.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_entities_updated_at
    BEFORE UPDATE ON entities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
