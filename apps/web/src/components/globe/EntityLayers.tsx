// Placeholder for EntityLayers - uses basic IconLayer from deck.gl/layers

// Icons for entity types
export const ENTITY_ICONS = {
  aircraft: '✈️',
  ship: '🚢',
  satellite: '🛰️',
  event: '⚠️',
};

// Entity type colors
export const ENTITY_COLORS = {
  aircraft: [6, 182, 212] as [number, number, number],
  ship: [34, 211, 238] as [number, number, number],
  satellite: [249, 115, 22] as [number, number, number],
  event: [239, 68, 68] as [number, number, number],
};

export interface FlightEntity {
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

export interface ShipEntity {
  id: string;
  name: string;
  mmsi: string;
  shipType: string;
  lat: number;
  lon: number;
  speed: number;
  heading: number;
  destination: string;
}

// Empty export to satisfy imports
export default function EntityLayers() {
  return null;
}