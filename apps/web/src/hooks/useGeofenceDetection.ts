import { useRef, useCallback, useEffect } from 'react';
import { useGeofenceStore, Geofence, EntityType } from '@/store/geofenceStore';

// Entity positions passed from hooks
interface EntityPosition {
  id: string;
  name: string;
  type: EntityType;
  lat: number;
  lon: number;
  altitude?: number; // For flights/satellites
}

interface UseGeofenceDetectionProps {
  flights: EntityPosition[];
  ships: EntityPosition[];
  satellites: EntityPosition[];
}

// Debounce tracking for entities inside zones
interface EntityTracking {
  lastInside: number;
  alerted: boolean;
}

export default function useGeofenceDetection({
  flights,
  ships,
  satellites,
}: UseGeofenceDetectionProps) {
  const trackingRef = useRef<Map<string, EntityTracking>>(new Map());
  const { getActiveGeofences, addAlert } = useGeofenceStore();

  const checkEntity = useCallback((
    entity: EntityPosition,
    geofence: Geofence
  ): boolean => {
    if (!geofence.active || !geofence.watchTypes.includes(entity.type as EntityType)) {
      return false;
    }

    if (geofence.type === 'circle' && geofence.center && geofence.radius) {
      return isInsideCircle(
        entity.lat,
        entity.lon,
        geofence.center.lat,
        geofence.center.lon,
        geofence.radius
      );
    }

    if (geofence.type === 'polygon' && geofence.coordinates) {
      return isInsidePolygon(
        entity.lat,
        entity.lon,
        geofence.coordinates
      );
    }

    return false;
  }, []);

  const checkAllEntities = useCallback(() => {
    const activeGeofences = getActiveGeofences();
    if (activeGeofences.length === 0) return;

    const allEntities = [
      ...flights.map(f => ({ ...f, type: 'flight' as EntityType })),
      ...ships.map(s => ({ ...s, type: 'ship' as EntityType })),
      ...satellites.map(sat => ({ ...sat, type: 'satellite' as EntityType })),
    ];

    for (const geofence of activeGeofences) {
      for (const entity of allEntities) {
        const isInside = checkEntity(entity, geofence);
        const trackKey = `${geofence.id}-${entity.id}`;
        const tracking = trackingRef.current.get(trackKey);

        if (isInside && !tracking?.alerted) {
          // Entity entered geofence
          addAlert({
            geofenceId: geofence.id,
            geofenceName: geofence.name,
            entityType: entity.type as EntityType,
            entityId: entity.id,
            entityName: entity.name,
            lat: entity.lat,
            lon: entity.lon,
          });

          trackingRef.current.set(trackKey, {
            lastInside: Date.now(),
            alerted: true,
          });
        } else if (!isInside && tracking?.alerted) {
          // Entity exited geofence - reset alert state
          trackingRef.current.set(trackKey, {
            lastInside: Date.now(),
            alerted: false,
          });
        }
      }
    }
  }, [flights, ships, satellites, getActiveGeofences, addAlert, checkEntity]);

  // Run detection on entity updates
  useEffect(() => {
    checkAllEntities();
  }, [checkAllEntities]);

  // Cleanup old tracking entries periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const toDelete: string[] = [];

      trackingRef.current.forEach((value, key) => {
        // Remove entries older than 5 minutes
        if (now - value.lastInside > 5 * 60 * 1000) {
          toDelete.push(key);
        }
      });

      toDelete.forEach(key => trackingRef.current.delete(key));
    }, 60000);

    return () => clearInterval(cleanup);
  }, []);

  return {
    checkAllEntities,
  };
}

// Haversine distance for circle detection
function isInsideCircle(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number,
  radiusMeters: number
): boolean {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(centerLat - lat);
  const dLon = toRad(centerLon - lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat)) * Math.cos(toRad(centerLat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance <= radiusMeters;
}

// Ray casting for polygon detection
function isInsidePolygon(
  lat: number,
  lon: number,
  coordinates: Array<[number, number]>
): boolean {
  let inside = false;
  const n = coordinates.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = coordinates[i];
    const [xj, yj] = coordinates[j];

    if (((yi > lat) !== (yj > lat)) &&
        (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Helper to convert km to meters
export function kmToMeters(km: number): number {
  return km * 1000;
}

// Helper to convert meters to km
export function metersToKm(meters: number): number {
  return meters / 1000;
}