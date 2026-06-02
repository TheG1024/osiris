import { Pool } from 'pg';

/**
 * Entity interface representing a database entity record
 */
export interface Entity {
  id: string;
  entityType: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * EntityInput interface for inserting new entities
 */
export interface EntityInput {
  entityType: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  status?: string;
  metadata?: Record<string, unknown>;
}

// Database connection pool (lazy initialized)
let pool: Pool | null = null;

/**
 * Get or create the database connection pool
 */
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

/**
 * Insert a new entity into the database
 * @param entity - Entity data to insert
 * @returns The inserted entity
 */
export async function insertEntity(entity: EntityInput): Promise<Entity> {
  const client = getPool();
  const query = `
    INSERT INTO entities (entity_type, name, description, latitude, longitude, altitude, status, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, entity_type, name, description, latitude, longitude, altitude, status, metadata, created_at, updated_at
  `;
  
  const values = [
    entity.entityType,
    entity.name,
    entity.description || null,
    entity.latitude,
    entity.longitude,
    entity.altitude || 0,
    entity.status || 'active',
    entity.metadata || {},
  ];

  const result = await client.query(query, values);
  return rowToEntity(result.rows[0]);
}

/**
 * Get a single entity by ID
 * @param id - Entity UUID
 * @returns The entity or undefined if not found
 */
export async function getEntity(id: string): Promise<Entity | undefined> {
  const client = getPool();
  const query = `
    SELECT id, entity_type, name, description, latitude, longitude, altitude, status, metadata, created_at, updated_at
    FROM entities
    WHERE id = $1
  `;

  const result = await client.query(query, [id]);
  
  if (result.rows.length === 0) {
    return undefined;
  }
  
  return rowToEntity(result.rows[0]);
}

/**
 * Get all entities of a specific type
 * @param entityType - Type of entities to retrieve
 * @returns Array of matching entities
 */
export async function getEntitiesByType(entityType: string): Promise<Entity[]> {
  const client = getPool();
  const query = `
    SELECT id, entity_type, name, description, latitude, longitude, altitude, status, metadata, created_at, updated_at
    FROM entities
    WHERE entity_type = $1
    ORDER BY created_at DESC
  `;

  const result = await client.query(query, [entityType]);
  return result.rows.map(rowToEntity);
}

/**
 * Get all entities within a radius of a point
 * Uses PostGIS ST_DWithin for efficient geospatial queries
 * @param lat - Latitude of center point
 * @param lon - Longitude of center point
 * @param radiusKm - Radius in kilometers
 * @returns Array of entities within the radius
 */
export async function getEntitiesInRadius(
  lat: number,
  lon: number,
  radiusKm: number
): Promise<Entity[]> {
  const client = getPool();
  
  // ST_DWithin uses meters, so convert km to meters
  const radiusMeters = radiusKm * 1000;
  
  const query = `
    SELECT id, entity_type, name, description, latitude, longitude, altitude, status, metadata, created_at, updated_at
    FROM entities
    WHERE ST_DWithin(
      location,
      ST_MakePoint($1, $2)::GEOGRAPHY,
      $3
    )
    ORDER BY ST_Distance(location, ST_MakePoint($1, $2)::GEOGRAPHY) ASC
  `;

  const result = await client.query(query, [lon, lat, radiusMeters]);
  return result.rows.map(rowToEntity);
}

/**
 * Convert a database row to an Entity object
 */
function rowToEntity(row: Record<string, unknown>): Entity {
  return {
    id: row.id as string,
    entityType: row.entity_type as string,
    name: row.name as string,
    description: row.description as string ?? undefined,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    altitude: row.altitude as number ?? undefined,
    status: row.status as string,
    metadata: row.metadata as Record<string, unknown> ?? undefined,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}