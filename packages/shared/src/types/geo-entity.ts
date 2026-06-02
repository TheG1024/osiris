/**
 * GeoEntity types for Osiris Redux
 * Defines the core entity types used across the system
 */

/**
 * Union type of all supported entity types
 */
export type EntityType = 'aircraft' | 'satellite' | 'ship' | 'weather' | 'camera';

/**
 * Base interface for all geographic entities
 */
export interface GeoEntity {
  /** Unique identifier for the entity */
  id: string;
  /** Type of entity */
  type: EntityType;
  /** Latitude in decimal degrees */
  lat: number;
  /** Longitude in decimal degrees */
  lon: number;
  /** Unix timestamp of the entity's last update */
  timestamp: number;
  /** Optional altitude in meters */
  altitude?: number;
  /** Optional velocity in km/h */
  velocity?: number;
  /** Optional heading in degrees (0-360) */
  heading?: number;
  /** Optional metadata */
  metadata?: Record<string, any>;
}

/**
 * Extended interface for processed entities with additional metadata
 */
export interface ProcessedEntity extends GeoEntity {
  /** Unix timestamp when the entity was processed */
  processedAt: number;
  /** Confidence score of the processing (0-1) */
  confidence: number;
}