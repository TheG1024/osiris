// @deck.gl/core @loaders.gl/core
// Install: npm install @deck.gl/core @loaders.gl/core

import { ScenegraphLayer, TextLayer } from '@deck.gl/core';
import { PathLayer } from '@deck.gl/layers';

interface SatelliteData {
  tle: {
    name: string;
    line1: string;
    line2: string;
  };
  position: {
    name: string;
    noradId: string;
    lat: number;
    lon: number;
    alt: number;
    velocity: number;
    orbitType: 'LEO' | 'MEO' | 'GEO';
    orbitalPeriod: number;
  };
  orbitPath: Array<{
    position: [number, number, number];
  }>;
}

interface SatelliteLayersProps {
  satellites: SatelliteData[];
  zoom: number;
  onSatelliteHover?: (info: any) => void;
}

// Orbit type colors
const LEO_COLOR = [0, 255, 255, 200];     // Cyan #00FFFF
const MEO_COLOR = [212, 175, 55, 200];   // Gold #D4AF37
const GEO_COLOR = [255, 0, 0, 200];      // Red #FF0000

function getOrbitColor(orbitType: 'LEO' | 'MEO' | 'GEO'): [number, number, number, number] {
  switch (orbitType) {
    case 'LEO':
      return LEO_COLOR;
    case 'MEO':
      return MEO_COLOR;
    case 'GEO':
      return GEO_COLOR;
  }
}

export default function SatelliteLayers({
  satellites,
  zoom,
  onSatelliteHover,
}: SatelliteLayersProps) {
  const showLabels = zoom >= 3;

  // Prepare orbit path data for PathLayer
  const orbitPaths = satellites.map(sat => ({
    id: sat.position.noradId,
    path: sat.orbitPath.map(p => p.position),
    orbitType: sat.position.orbitType,
  }));

  // Prepare satellite point data for ScenegraphLayer
  const satellitePoints = satellites.map(sat => ({
    ...sat.position,
    position: [
      sat.position.lon,
      sat.position.lat,
      sat.position.alt * 1000 // Convert km to meters
    ] as [number, number, number],
  }));

  const layers = [
    // Orbit paths
    new PathLayer({
      id: 'satellite-orbit-paths',
      data: orbitPaths,
      getPath: d => d.path,
      getColor: d => getOrbitColor(d.orbitType),
      getWidth: 1,
      widthMinPixels: 1,
      opacity: 0.6,
      rounded: true,
      pickable: false,
    }),

    // Satellite 3D models
    new ScenegraphLayer({
      id: 'satellite-scenegraph',
      data: satellitePoints,
      scenegraph: '/models/satellite.glb',
      getPosition: d => d.position,
      getOrientation: d => [0, 0, 0],
      getColor: d => getOrbitColor(d.orbitType),
      sizeScale: 30,
      opacity: 0.9,
      _lighting: 'pbr',
      pickable: true,
      onHover: onSatelliteHover,
    }),

    // Satellite labels at zoom 3+
    showLabels && new TextLayer({
      id: 'satellite-labels',
      data: satellitePoints,
      getPosition: d => [
        d.position[0],
        d.position[1],
        d.position[2] + 500 // Offset above satellite
      ],
      getText: d => d.name,
      getSize: 10,
      getColor: d => getOrbitColor(d.orbitType),
      getFontFamily: 'monospace',
      getFontWeight: 500,
      getBackgroundColor: [0, 0, 0, 180],
      background: true,
      backgroundPadding: [4, 2],
    }),
  ].filter(Boolean);

  return layers;
}

// Helper to filter satellites by orbit type
export function filterSatellitesByOrbitType(
  satellites: SatelliteData[],
  orbitType: 'LEO' | 'MEO' | 'GEO'
): SatelliteData[] {
  return satellites.filter(sat => sat.position.orbitType === orbitType);
}

// Helper to get satellite count by orbit type
export function getSatelliteCountByOrbitType(
  satellites: SatelliteData[]
): { leo: number; meo: number; geo: number } {
  return satellites.reduce(
    (acc, sat) => {
      switch (sat.position.orbitType) {
        case 'LEO':
          acc.leo++;
          break;
        case 'MEO':
          acc.meo++;
          break;
        case 'GEO':
          acc.geo++;
          break;
      }
      return acc;
    },
    { leo: 0, meo: 0, geo: 0 }
  );
}