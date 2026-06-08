import { useState, useCallback } from 'react';
// @nebula.gl/core @nebula.gl/geo-editing
// Note: When installed, import from @nebula.gl/core

export type DrawMode = 'view' | 'polygon' | 'circle';

export interface Feature {
  id: string;
  type: 'Feature';
  properties: {
    mode?: string;
    radius?: number;
  };
  geometry: {
    type: 'Polygon' | 'LineString';
    coordinates: any;
  };
}

export interface UseGeofenceDrawReturn {
  mode: DrawMode;
  features: Feature[];
  draftFeature: Feature | null;
  setMode: (mode: DrawMode) => void;
  onEdit: (editResult: any) => void;
  clearDraft: () => void;
  saveDraftAsGeofence: (name: string, watchTypes: string[]) => void;
}

// Default draw mode
const DEFAULT_DRAW_MODE: DrawMode = 'view';

export default function useGeofenceDraw(): UseGeofenceDrawReturn {
  const [mode, setMode] = useState<DrawMode>(DEFAULT_DRAW_MODE);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [draftFeature, setDraftFeature] = useState<Feature | null>(null);

  const onEdit = useCallback((editResult: any) => {
    if (!editResult.updatedData?.features) return;

    const updatedFeatures = editResult.updatedData.features;
    
    // Get the latest feature (the one being drawn)
    const latestFeature = updatedFeatures[updatedFeatures.length - 1];
    if (latestFeature) {
      setDraftFeature(latestFeature);
    }
    
    setFeatures(updatedFeatures);
  }, []);

  const clearDraft = useCallback(() => {
    setDraftFeature(null);
    setFeatures([]);
    setMode('view');
  }, []);

  const saveDraftAsGeofence = useCallback((name: string, watchTypes: string[]) => {
    // This will be connected to the geofence store in the actual implementation
    console.log('Saving geofence:', { name, watchTypes, feature: draftFeature });
    
    // After saving, clear the draft
    clearDraft();
  }, [draftFeature, clearDraft]);

  return {
    mode,
    features,
    draftFeature,
    setMode,
    onEdit,
    clearDraft,
    saveDraftAsGeofence,
  };
}

// Helper to create a circle feature from center and radius
export function createCircleFeature(
  centerLat: number,
  centerLon: number,
  radiusMeters: number,
  segments: number = 64
): Feature {
  const coords = generateCircleCoords(centerLat, centerLon, radiusMeters, segments);
  
  return {
    id: `circle-${Date.now()}`,
    type: 'Feature',
    properties: {
      mode: 'circle',
      radius: radiusMeters,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  };
}

// Helper to create a polygon feature from coordinates
export function createPolygonFeature(
  coordinates: Array<[number, number]>
): Feature {
  return {
    id: `polygon-${Date.now()}`,
    type: 'Feature',
    properties: {
      mode: 'polygon',
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
  };
}

// Generate circle coordinates
function generateCircleCoords(
  centerLat: number,
  centerLon: number,
  radiusMeters: number,
  segments: number
): Array<[number, number]> {
  const coords: Array<[number, number]> = [];
  const R = 6371000;
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const d = radiusMeters / R;
    
    const lat = centerLat + (d * Math.cos(angle)) * (180 / Math.PI);
    const lon = centerLon + (d * Math.sin(angle)) * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180);
    
    coords.push([lon, lat]);
  }
  
  return coords;
}

// Helper to get centroid of a polygon
export function getPolygonCentroid(
  coordinates: Array<[number, number]>
): { lat: number; lon: number } {
  let latSum = 0;
  let lonSum = 0;
  
  for (const coord of coordinates) {
    latSum += coord[1];
    lonSum += coord[0];
  }
  
  return {
    lat: latSum / coordinates.length,
    lon: lonSum / coordinates.length,
  };
}

// Helper to calculate area of a polygon (in square meters)
export function calculatePolygonArea(
  coordinates: Array<[number, number]>
): number {
  // Using Shoelace formula (simplified)
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i][0] * coordinates[j][1];
    area -= coordinates[j][0] * coordinates[i][1];
  }
  
  area = Math.abs(area) / 2;
  
  // Convert from degrees² to meters² (approximate)
  const metersPerDegree = 111320;
  return area * metersPerDegree * metersPerDegree;
}