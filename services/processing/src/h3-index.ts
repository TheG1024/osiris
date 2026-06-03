import { latLngToCell, isValidCell, cellToLatLng } from 'h3-js';

export const H3_RESolutions = {
  CITY: 7,      // ~5km hexagons
  REGION: 5,    // ~26km hexagons
  CONTINENT: 3  // ~154km hexagons
};

export function indexPosition(lat: number, lon: number, resolution: number = H3_RESolutions.CITY): string {
  return latLngToCell(lat, lon, resolution);
}

export function isValidH3Index(h3Index: string): boolean {
  return isValidCell(h3Index);
}

export function h3ToLocation(h3Index: string): { lat: number; lon: number } {
  const [lat, lon] = cellToLatLng(h3Index);
  return { lat, lon };
}

export function getNeighbors(h3Index: string): string[] {
  // Would use h3.gridDisk in production
  return [h3Index]; // Simplified for now
}
