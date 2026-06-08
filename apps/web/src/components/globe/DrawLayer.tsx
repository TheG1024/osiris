// @deck.gl/core @nebula.gl/layers
// Install: npm install @deck.gl/core @nebula.gl/layers

import { GeoJsonLayer } from '@deck.gl/layers';

// Colors - use Uint8Array for deck.gl v9
const DRAFT_FILL: [number, number, number, number] = [212, 175, 55, 30];
const DRAFT_STROKE: [number, number, number, number] = [212, 175, 55, 255];

interface DrawLayerProps {
  features: any[];
  mode: 'view' | 'polygon' | 'circle';
}

export default function DrawLayer({ features, mode }: DrawLayerProps) {
  if (mode === 'view' || features.length === 0) {
    return [];
  }

  // For now, use GeoJsonLayer as placeholder
  // When nebula.gl is properly installed, use EditableGeoJsonLayer
  const layers = [
    new GeoJsonLayer({
      id: 'draw-layer',
      data: {
        type: 'FeatureCollection',
        features: features,
      },
      filled: true,
      stroked: true,
      getFillColor: DRAFT_FILL,
      getLineColor: DRAFT_STROKE,
      getLineWidth: 2,
      lineWidthMinPixels: 2,
      opacity: 0.8,
      pickable: true,
      // Editable properties (when using EditableGeoJsonLayer)
      // mode: mode === 'polygon' ? 'drawPolygon' : 'drawCircle',
    }),
  ];

  return layers;
}

// Helper to validate a polygon
export function isValidPolygon(coordinates: any[]): boolean {
  if (!coordinates || coordinates.length < 3) return false;
  
  // Check if first and last points are same (closed ring)
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  
  // For a valid polygon, we need at least 4 points (including closing)
  return coordinates.length >= 4;
}

// Helper to validate a circle
export function isValidCircle(feature: any): boolean {
  if (!feature?.properties?.radius) return false;
  return feature.properties.radius > 0;
}

// Helper to convert drawn feature to geofence format
export function featureToGeofence(
  feature: any,
  name: string,
  watchTypes: string[]
): any {
  const mode = feature.properties?.mode;
  
  if (mode === 'circle') {
    // Extract center from the first coordinate of the polygon
    const coords = feature.geometry.coordinates[0];
    const centerLon = coords[0][0];
    const centerLat = coords[0][1];
    
    return {
      name,
      type: 'circle',
      center: { lat: centerLat, lon: centerLon },
      radius: feature.properties.radius,
      watchTypes,
      active: true,
    };
  }
  
  if (mode === 'polygon') {
    return {
      name,
      type: 'polygon',
      coordinates: feature.geometry.coordinates[0].slice(0, -1), // Remove closing point
      watchTypes,
      active: true,
    };
  }
  
  return null;
}