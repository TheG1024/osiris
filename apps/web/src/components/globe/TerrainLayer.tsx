// @deck.gl/geo-layers @deck.gl/mesh-layers
// @loaders.gl/core
// Install these packages: npm install @deck.gl/geo-layers @deck.gl/mesh-layers @loaders.gl/core

import { TerrainLayer } from '@deck.gl/geo-layers';

export interface TerrainLayerProps {
  onViewStateChange?: (viewState: any) => void;
  elevationScale?: number;
}

export default function TerrainLayerComponent({ 
  onViewStateChange,
  elevationScale = 50 
}: TerrainLayerProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  
  if (!mapboxToken) {
    console.warn('NEXT_PUBLIC_MAPBOX_TOKEN not set - terrain disabled');
    return null;
  }

  // Use Mapbox Terrain-DEM for elevation and Mapbox Satellite for texture
  const terrainLayer = new TerrainLayer({
    id: 'terrain-layer',
    // Mapbox terrain source
    elevationData: 'mapbox://mapbox.mapbox-terrain-dem-v1',
    texture: 'mapbox://mapbox.mapbox-satellite-v1',
    
    // Elevation scale for 3D effect
    elevationScale,
    
    // Terrain resolution
    terrainResolution: 32,
    
    // Use Mapbox token
    fetchOptions: {
      headers: {
        'Authorization': `Bearer ${mapboxToken}`
      }
    },
    
    onTerrainLoad: (terrain) => {
      console.log('Terrain loaded');
    },
    
    // Performance optimizations
    aggregator: 'highest',
    meshMaxError: 10,
    
    // Material properties
    material: {
      ambient: 0.6,
      diffuse: 0.4,
      shininess: 32,
      specularColor: [255, 255, 255],
    },
    
    // Color mapping
    colorRange: [
      [0, 0, 0, 0], // Transparent
      [245, 222, 179, 100], // Sandy
      [139, 119, 101, 100], // Rocky
      [255, 255, 255, 100], // Snow
    ],
    
    autoHighlight: true,
    pickable: true,
    
    onViewStateChange
  });

  return terrainLayer;
}

// Helper to get elevation color based on height
export function getElevationColor(elevation: number): [number, number, number, number] {
  if (elevation < 500) return [245, 222, 179, 100]; // Sandy/beige
  if (elevation < 1500) return [139, 119, 101, 100]; // Rocky/brown
  if (elevation < 3000) return [160, 160, 160, 100]; // Mountain gray
  return [255, 255, 255, 100]; // Snow white
}