/**
 * WebSocket Message types for Osiris Redux
 * Defines the message structure for real-time communication
 */

import { GeoEntity, ProcessedEntity } from './geo-entity';

/**
 * Union type of all WebSocket message types
 */
export type WSMessageType =
  | 'entity_batch'
  | 'alert'
  | 'stats'
  | 'heartbeat'
  | 'command'
  | 'error';

/**
 * Payload for entity batch messages
 */
export interface EntityBatchPayload {
  /** Array of entities in this batch */
  entities: (GeoEntity | ProcessedEntity)[];
  /** Source of the entities (e.g., 'radar', 'adsb', 'manual') */
  source: string;
  /** Number of entities in the batch */
  count: number;
}

/**
 * Severity levels for alerts
 */
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Payload for alert messages
 */
export interface AlertPayload {
  /** Unique alert identifier */
  alertId: string;
  /** Severity level of the alert */
  severity: AlertSeverity;
  /** Human-readable alert message */
  message: string;
  /** ID of the entity triggering the alert (if applicable) */
  entityId?: string;
  /** Unix timestamp when the alert was generated */
  timestamp: number;
}

/**
 * Payload for statistics messages
 */
export interface StatsPayload {
  /** Time period this stats covers (e.g., '1h', '24h') */
  period: string;
  /** Total number of entities tracked */
  totalEntities: number;
  /** Breakdown of entities by type */
  entitiesByType: {
    aircraft: number;
    satellite: number;
    ship: number;
    weather: number;
    camera: number;
  };
  /** Average processing latency in milliseconds */
  processingLatency: number;
}

/**
 * Generic WebSocket message interface
 */
export interface WSMessage<T = unknown> {
  /** Type of the message */
  type: WSMessageType;
  /** Message payload (type-specific) */
  payload: T;
  /** Unix timestamp when the message was created */
  timestamp: number;
}