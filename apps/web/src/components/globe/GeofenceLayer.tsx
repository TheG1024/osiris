// @deck.gl/core @deck.gl/layers
// Install: npm install @deck.gl/core @deck.gl/layers

import { ScatterplotLayer, PolygonLayer } from '@deck.gl/layers';
import { useGeofenceStore, Geofence, GEOFENCE_COLORS } from '@/store/geofenceStore';

interface GeofenceLayersProps {
  zoom?: number;
}

// Colors - use correct tuple types for deck.gl v9
const ACTIVE_FILL: [number, number, number, number] = [212, 175, 55, 30];
const ACTIVE_STROKE: [number, number, number, number] = [212, 175, 55, 255];
const INACTIVE_FILL: [number, number, number, number] = [100, 100, 100, 20];
const INACTIVE_STROKE: [number, number, number, number] = [100, 100, 100, 255];

export default function GeofenceLayers({ zoom = 8 }: GeofenceLayersProps) {
  const geofences = useGeofenceStore(state => state.geofences);

  // Separate circles and polygons
  const circles = geofences.filter(g => g.type === 'circle' && g.center && g.radius);
  const polygons = geofences.filter(g => g.type === 'polygon' && g.coordinates);

  // Only show at zoom 4+
  const visible = zoom >= 4;

  const layers = [
    // Circle geofences (ScatterplotLayer)
    visible && circles.length > 0 && new ScatterplotLayer({
      id: 'geofence-circles',
      data: circles,
      getPosition: d => [d.center!.lon, d.center!.lat],
      getRadius: d => d.radius!,
      getFillColor: d => d.active ? ACTIVE_FILL : INACTIVE_FILL,
      getLineColor: d => d.active ? ACTIVE_STROKE : INACTIVE_STROKE,
      getLineWidth: 2,
      stroked: true,
      filled: true,
      opacity: 0.8,
      pickable: true,
    }),

    // Polygon geofences (PolygonLayer)
    visible && polygons.length > 0 && new PolygonLayer({
      id: 'geofence-polygons',
      data: polygons,
      getPolygon: d => d.coordinates!,
      getFillColor: d => d.active ? ACTIVE_FILL : INACTIVE_FILL,
      getLineColor: d => d.active ? ACTIVE_STROKE : INACTIVE_STROKE,
      getLineWidth: 2,
      stroked: true,
      filled: true,
      opacity: 0.8,
      pickable: true,
    }),
  ].filter(Boolean);

  return layers;
}

// Helper to prepare circle coordinates for PolygonLayer (for better control)
export function prepareCirclePolygon(
  centerLat: number,
  centerLon: number,
  radiusMeters: number,
  segments: number = 64
): Array<[number, number]> {
  const coords: Array<[number, number]> = [];
  const R = 6371000; // Earth radius in meters
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const d = radiusMeters / R;
    
    const lat = centerLat + (d * Math.cos(angle)) * (180 / Math.PI);
    const lon = centerLon + (d * Math.sin(angle)) * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180);
    
    coords.push([lon, lat]);
  }
  
  return coords;
}

// Helper to calculate distance between two points
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}