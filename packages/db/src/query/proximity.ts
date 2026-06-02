import { haversineDistance } from '@osiris/shared';

/**
 * Find entities within a radius of a point
 * Uses PostGIS ST_DWithin for database queries
 * For in-memory filtering, uses haversine distance
 * 
 * @param lat - Latitude of center point
 * @param lon - Longitude of center point
 * @param radiusKm - Radius in kilometers
 * @param entities - Array of entities to filter (optional, if not provided queries DB)
 * @returns Array of entities within the radius with distance info
 */
export interface EntityWithDistance {
  id: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export function findEntitiesInRadius(
  lat: number,
  lon: number,
  radiusKm: number,
  entities: Array<{ id: string; latitude: number; longitude: number }>
): EntityWithDistance[] {
  return entities
    .map(entity => {
      const distanceKm = haversineDistance(lat, lon, entity.latitude, entity.longitude) / 1000;
      return {
        id: entity.id,
        latitude: entity.latitude,
        longitude: entity.longitude,
        distanceKm
      };
    })
    .filter(entity => entity.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * SQL fragment for PostGIS proximity query
 * Use this in your database queries
 * 
 * Example:
 * ```sql
 * SELECT id, latitude, longitude
 * FROM entities
 * WHERE ST_DWithin(
 *   location,
 *   ST_MakePoint($lon, $lat)::GEOGRAPHY,
 *   $radiusMeters
 * )
 * ```
 */
export const PROXIMITY_SQL_WHERE = `
  ST_DWithin(
    location,
    ST_MakePoint($lon, $lat)::GEOGRAPHY,
    $radiusMeters
  )
`;

export const PROXIMITY_SQL_ORDER = `
  ST_Distance(location, ST_MakePoint($lon, $lat)::GEOGRAPHY) ASC
`;