// @deck.gl/core @deck.gl/mesh-layers @loaders.gl/core
// Install: npm install @deck.gl/core @deck.gl/mesh-layers @loaders.gl/core

import { ScenegraphLayer, IconLayer, TextLayer } from '@deck.gl/core';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';

interface FlightEntity {
  id: string;
  callsign: string;
  icao24: string;
  lat: number;
  lon: number;
  altitude: number;
  speed: number;
  heading: number;
  origin: string;
  destination: string;
}

interface ShipEntity {
  id: string;
  name: string;
  mmsi: string;
  shipType: string;
  lat: number;
  lon: number;
  speed: number;
  heading: number;
}

interface EntityLayersProps {
  flights: FlightEntity[];
  ships: ShipEntity[];
  zoom: number;
  onFlightHover?: (info: any) => void;
  onShipHover?: (any: any) => void;
}

// Icon mapping for fallback at low zoom
const ICON_MAPPING = {
  flight: { x: 0, y: 0, width: 128, height: 128 },
  ship: { x: 128, y: 0, width: 128, height: 128 },
};

const ICON_URL = '/icons/entity-icons.png';

// Colors
const FLIGHT_COLOR = [0, 255, 180, 200]; // Cyan #00FFB4
const SHIP_COLOR = [79, 195, 247, 200];   // Blue #4FC3F7
const LABEL_COLOR = [212, 175, 55, 255]; // Gold #D4AF37

export default function EntityLayers({
  flights,
  ships,
  zoom,
  onFlightHover,
  onShipHover,
}: EntityLayersProps) {
  const show3D = zoom >= 6;
  const showLabels = zoom >= 6;

  const layers = [
    // Flight 3D models (at high zoom)
    show3D && new ScenegraphLayer({
      id: 'flight-scenegraph',
      data: flights,
      scenegraph: '/models/aircraft.glb',
      getPosition: d => [d.lon, d.lat, d.altitude * 0.3048], // Convert feet to meters
      getOrientation: d => [0, -d.heading + 90, 90],
      getColor: FLIGHT_COLOR,
      sizeScale: 100,
      opacity: 0.9,
      _lighting: 'pbr',
      pickable: true,
      onHover: onFlightHover,
    }),

    // Flight Icon layer fallback (at low zoom)
    !show3D && new IconLayer({
      id: 'flight-icons',
      data: flights,
      iconMapping: ICON_MAPPING,
      getIcon: () => 'flight',
      getPosition: d => [d.lon, d.lat, d.altitude * 0.3048 * 0.1], // Lower altitude for icons
      getColor: FLIGHT_COLOR,
      getSize: 32,
      sizeScale: 1,
      pickable: true,
      onHover: onFlightHover,
    }),

    // Ship 3D models (at high zoom)
    show3D && new ScenegraphLayer({
      id: 'ship-scenegraph',
      data: ships,
      scenegraph: '/models/ship.glb',
      getPosition: d => [d.lon, d.lat, 10], // Sea level + 10m
      getOrientation: d => [0, -d.heading + 90, 0],
      getColor: SHIP_COLOR,
      sizeScale: 50,
      opacity: 0.9,
      _lighting: 'pbr',
      pickable: true,
      onHover: onShipHover,
    }),

    // Ship Icon layer fallback (at low zoom)
    !show3D && new IconLayer({
      id: 'ship-icons',
      data: ships,
      iconMapping: ICON_MAPPING,
      getIcon: () => 'ship',
      getPosition: d => [d.lon, d.lat, 100],
      getColor: SHIP_COLOR,
      getSize: 32,
      sizeScale: 1,
      pickable: true,
      onHover: onShipHover,
    }),

    // Labels at zoom 6+
    showLabels && new TextLayer({
      id: 'flight-labels',
      data: flights,
      getPosition: d => [d.lon, d.lat, d.altitude * 0.3048 + 200],
      getText: d => d.callsign,
      getSize: 12,
      getColor: LABEL_COLOR,
      getFontFamily: 'monospace',
      getFontWeight: 600,
      getBackgroundColor: [0, 0, 0, 180],
      background: true,
      backgroundPadding: [4, 2],
    }),

    showLabels && new TextLayer({
      id: 'ship-labels',
      data: ships,
      getPosition: d => [d.lon, d.lat, 200],
      getText: d => d.name,
      getSize: 12,
      getColor: LABEL_COLOR,
      getFontFamily: 'monospace',
      getFontWeight: 600,
      getBackgroundColor: [0, 0, 0, 180],
      background: true,
      backgroundPadding: [4, 2],
    }),
  ].filter(Boolean);

  return layers;
}

// Helper functions for entity data transformation
export function transformFlightToEntity(flight: any): FlightEntity {
  return {
    id: flight.id,
    callsign: flight.callsign,
    icao24: flight.icao24,
    lat: flight.lat,
    lon: flight.lon,
    altitude: flight.altitude,
    speed: flight.speed,
    heading: flight.heading,
    origin: flight.origin,
    destination: flight.destination,
  };
}

export function transformShipToEntity(ship: any): ShipEntity {
  return {
    id: ship.id,
    name: ship.name,
    mmsi: ship.mmsi,
    shipType: ship.shipType,
    lat: ship.lat,
    lon: ship.lon,
    speed: ship.speed,
    heading: ship.heading,
  };
}