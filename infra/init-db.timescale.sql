-- TimescaleDB add-ons. Apply AFTER init-db.sql on a Timescale-enabled cluster.
-- Skip on plain Postgres (Render).

CREATE EXTENSION IF NOT EXISTS timescaledb;

SELECT create_hypertable('entity_positions', 'time', if_not_exists => TRUE, migrate_data => TRUE);
SELECT create_hypertable('alerts', 'time', if_not_exists => TRUE, migrate_data => TRUE);

CREATE MATERIALIZED VIEW IF NOT EXISTS entity_stats_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    entity_type,
    COUNT(*) AS total_positions,
    COUNT(DISTINCT source_id) AS unique_entities
FROM entity_positions
GROUP BY bucket, entity_type;

SELECT add_continuous_aggregate_policy('entity_stats_hourly',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE);
