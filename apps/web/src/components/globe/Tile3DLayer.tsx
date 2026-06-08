// @deck.gl/core @deck.gl/geo-layers @deck.gl/mesh-layers
// @loaders.gl/3d-tiles @loaders.gl/core
// Install these packages: npm install @deck.gl/core @deck.gl/geo-layers @deck.gl/mesh-layers @loaders.gl/3d-tiles @loaders.gl/core

import { Tile3DLayer } from '@deck.gl/geo-layers';
import { CesiumIonLoader } from '@loaders.gl/3d-tiles';

export interface Tile3DLayerProps {
  onViewStateChange?: (viewState: any) => void;
}

export default function Tile3DLayerComponent({ onViewStateChange }: Tile3DLayerProps) {
  const cesiumToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
  
  if (!cesiumToken) {
    console.warn('NEXT_PUBLIC_CESIUM_ION_TOKEN not set - 3D buildings disabled');
    return null;
  }

  // Cesium OSM Buildings (asset ID: 2275207)
  const tile3dLayer = new Tile3DLayer({
    id: 'tile3dlayer-osm-buildings',
    data: 'https://assets.cesium.com/3d-tiles/2275207/tileset.json',
    loader: CesiumIonLoader,
    loadOptions: {
      cesiumIon: {
        accessToken: cesiumToken,
      },
      fetch: {
        headers: {
          Authorization: `Bearer ${cesiumToken}`
        }
      },
      // Memory cap: 512MB
      '3d-tiles': {
        maximumMemoryUsage: 512 * 1024 * 1024
      }
    },
    onTilesetLoad: (tileset) => {
      console.log('Cesium OSM Buildings loaded');
    },
    onTileLoad: (tile) => {
      console.log('Tile loaded');
    },
    // LOD: maximumScreenSpaceError 16 at low zoom, 4 at high zoom
    maximumScreenSpaceError: 16,
    opacity: 1,
    pointSize: 2,
    
    // Performance optimizations
    _subdivisionThreshold: 4,
    
    autoHighlight: true,
    highlightColor: [255, 255, 0, 128],
    
    onViewStateChange
  });

  return tile3dLayer;
}

// Helper to determine LOD based on zoom level
export function getLODScreenSpaceError(zoom: number): number {
  // Return 4 at high zoom (>=10), 16 at low zoom (<10)
  return zoom >= 10 ? 4 : 16;
}