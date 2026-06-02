/**
 * Redpanda topic constants for Osiris Redux
 * Defines all Kafka/Redpanda topics used in the system
 */

/**
 * Map of all Redpanda topic names
 */
export const TOPICS = {
  /** Aircraft ADS-B data ingestion */
  INGEST_AIRCRAFT: 'ingest.aircraft',
  /** Satellite telemetry ingestion */
  INGEST_SATELLITE: 'ingest.satellite',
  /** Maritime AIS data ingestion */
  INGEST_SHIPS: 'ingest.ships',
  /** Weather data ingestion */
  INGEST_WEATHER: 'ingest.weather',
  /** Processed entities output */
  ENTITIES_PROCESSED: 'entities.processed',
  /** System alerts and notifications */
  ALERTS: 'alerts'
} as const;