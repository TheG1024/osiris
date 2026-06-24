import { Pool } from 'pg';

/**
 * Entity interface representing a database entity record
 */
export interface Entity {
  id: string;
  entityType: string;
  sourceId: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  status: string;
  metadata?: Record<string, unknown>;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * EntityInput interface for inserting new entities
 */
export interface EntityInput {
  entityType: string;
  sourceId: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  status?: string;
  metadata?: Record<string, unknown>;
}

/**
 * PositionInput for a single time-series sample
 */
export interface PositionInput {
  entityId: string;
  entityType: string;
  sourceId: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  velocity?: number;
  heading?: number;
  time?: Date;
}

// Database connection pool (lazy initialized)
let pool: Pool | null = null;

function getPool_(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    });
  }
  return pool;
};

/**
 * Get or create the database connection pool
 */
/**
 * Get the shared pool. Exposed for ad-hoc queries (stats, lookups by source_id).
 */
export function getPool(): Pool {
  return getPool_();
}

// ponytail: shared base SELECT so list helpers don't drift.
const ENTITY_COLS = `id, entity_type, source_id, name, description, latitude, longitude,
  altitude, status, metadata, last_seen_at, created_at, updated_at`;

/**
 * Insert or update an entity by (entity_type, source_id).
 * Also writes a row to entity_positions for the time series.
 * @param entity - Entity data
 * @returns The inserted/updated entity
 */
export async function upsertEntity(entity: EntityInput): Promise<Entity> {
  const client = getPool();
  const query = `
    INSERT INTO entities
      (entity_type, source_id, name, description, latitude, longitude, altitude, status, metadata, last_seen_at, location)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), ST_MakePoint($6, $5)::GEOGRAPHY)
    ON CONFLICT (entity_type, source_id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      altitude = EXCLUDED.altitude,
      status = EXCLUDED.status,
      metadata = EXCLUDED.metadata,
      last_seen_at = NOW(),
      location = EXCLUDED.location
    RETURNING ${ENTITY_COLS}
  `;
  const values = [
    entity.entityType,
    entity.sourceId,
    entity.name,
    entity.description ?? null,
    entity.latitude,
    entity.longitude,
    entity.altitude ?? 0,
    entity.status ?? 'active',
    entity.metadata ?? {},
  ];
  const result = await client.query(query, values);
  return rowToEntity(result.rows[0]);
}

/**
 * Bulk upsert: one transaction, multi-row INSERT ... ON CONFLICT.
 * Returns the upserted entities.
 */
export async function upsertEntities(entities: EntityInput[]): Promise<Entity[]> {
  if (entities.length === 0) return [];
  const client = getPool();
  const cols = ['entity_type', 'source_id', 'name', 'description', 'latitude', 'longitude',
    'altitude', 'status', 'metadata'];
  const placeholders = entities.map((_, i) => {
    const base = i * cols.length;
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5},
            $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9})`;
  }).join(',');

  const values = entities.flatMap((e) => [
    e.entityType, e.sourceId, e.name, e.description ?? null,
    e.latitude, e.longitude, e.altitude ?? 0,
    e.status ?? 'active', e.metadata ?? {},
  ]);

  const query = `
    INSERT INTO entities (${cols.join(',')})
    VALUES ${placeholders}
    ON CONFLICT (entity_type, source_id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      altitude = EXCLUDED.altitude,
      status = EXCLUDED.status,
      metadata = EXCLUDED.metadata,
      last_seen_at = NOW()
    RETURNING ${ENTITY_COLS}
  `;
  const result = await client.query(query, values);
  return result.rows.map(rowToEntity);
}

/**
 * Append a position sample. Caller provides the entity_id (from a prior upsert).
 */
export async function insertPosition(p: PositionInput): Promise<void> {
  const client = getPool();
  await client.query(
    `INSERT INTO entity_positions
       (entity_id, entity_type, source_id, latitude, longitude, altitude, velocity, heading, time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, NOW()))`,
    [p.entityId, p.entityType, p.sourceId, p.latitude, p.longitude,
     p.altitude ?? null, p.velocity ?? null, p.heading ?? null, p.time ?? null]
  );
}

/**
 * Get a single entity by ID
 */
export async function getEntity(id: string): Promise<Entity | undefined> {
  const client = getPool();
  const result = await client.query(
    `SELECT ${ENTITY_COLS} FROM entities WHERE id = $1`,
    [id]
  );
  return result.rows[0] ? rowToEntity(result.rows[0]) : undefined;
}

/**
 * Get all entities of a specific type, ordered by most recently seen.
 * @param opts.limit - max rows (default 500)
 * @param opts.since - filter by last_seen_at > since
 */
export async function getEntitiesByType(
  entityType: string,
  opts: { limit?: number; since?: Date } = {}
): Promise<Entity[]> {
  const client = getPool();
  const limit = Math.min(opts.limit ?? 500, 5000);
  const params: unknown[] = [entityType];
  let where = `WHERE entity_type = $1`;
  if (opts.since) {
    params.push(opts.since);
    where += ` AND last_seen_at > $${params.length}`;
  }
  params.push(limit);
  const query = `
    SELECT ${ENTITY_COLS} FROM entities
    ${where}
    ORDER BY last_seen_at DESC
    LIMIT $${params.length}
  `;
  const result = await client.query(query, params);
  return result.rows.map(rowToEntity);
}

/**
 * Get entities within a radius of a point using PostGIS.
 */
export async function getEntitiesInRadius(
  lat: number,
  lon: number,
  radiusKm: number
): Promise<Entity[]> {
  const client = getPool();
  const radiusMeters = radiusKm * 1000;
  const result = await client.query(
    `SELECT ${ENTITY_COLS} FROM entities
     WHERE ST_DWithin(location, ST_MakePoint($1, $2)::GEOGRAPHY, $3)
     ORDER BY ST_Distance(location, ST_MakePoint($1, $2)::GEOGRAPHY) ASC
     LIMIT 1000`,
    [lon, lat, radiusMeters]
  );
  return result.rows.map(rowToEntity);
}

/**
 * Convert a database row to an Entity object
 */
function rowToEntity(row: Record<string, unknown>): Entity {
  return {
    id: row.id as string,
    entityType: row.entity_type as string,
    sourceId: row.source_id as string,
    name: row.name as string,
    description: row.description as string ?? undefined,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    altitude: row.altitude as number ?? undefined,
    status: row.status as string,
    metadata: row.metadata as Record<string, unknown> ?? undefined,
    lastSeenAt: row.last_seen_at as Date,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}
