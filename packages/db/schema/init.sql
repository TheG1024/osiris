-- Osiris Redux Database Schema
-- TimescaleDB + PostGIS enabled

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Entities table with hypertable for time-series data
CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(64) NOT NULL,
    name VARCHAR(256) NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude DOUBLE PRECISION DEFAULT 0,
    status VARCHAR(32) DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- PostGIS geometry column for spatial queries
    location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
        ST_MakePoint(longitude, latitude)::GEOGRAPHY
    ) STORED
);

-- Convert to hypertable for time-based partitioning
SELECT create_hypertable('entities', 'created_at', if_not_exists => TRUE);

-- Create spatial index for proximity queries
CREATE INDEX IF NOT EXISTS idx_entities_location 
ON entities USING GIST (location);

-- Create index for entity type lookups
CREATE INDEX IF NOT EXISTS idx_entities_type 
ON entities (entity_type);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_entities_status 
ON entities (status);

-- Alerts table with hypertable for time-series data
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    alert_type VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL DEFAULT 'info',
    title VARCHAR(256) NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- PostGIS geometry for alert location (optional, falls back to entity location)
    location GEOGRAPHY(POINT, 4326)
);

-- Convert to hypertable for time-based partitioning
SELECT create_hypertable('alerts', 'created_at', if_not_exists => TRUE);

-- Create index for entity lookup
CREATE INDEX IF NOT EXISTS idx_alerts_entity_id 
ON alerts (entity_id);

-- Create index for alert type
CREATE INDEX IF NOT EXISTS idx_alerts_type 
ON alerts (alert_type);

-- Create index for severity
CREATE INDEX IF NOT EXISTS idx_alerts_severity 
ON alerts (severity);

-- Create index for acknowledgment status
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged 
ON alerts (acknowledged);

-- Create index for resolution status
CREATE INDEX IF NOT EXISTS idx_alerts_resolved 
ON alerts (resolved);

-- Spatial index for alert location queries
CREATE INDEX IF NOT EXISTS idx_alerts_location 
ON alerts USING GIST (location);

-- Updated_at trigger function for entities
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on entities
CREATE TRIGGER update_entities_updated_at
    BEFORE UPDATE ON entities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();