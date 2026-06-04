// Satellite tracking using satellite.js
// Provides real-time satellite positions from TLE data
// Note: WASM-based satellite.js has issues with Next.js webpack
// This implementation uses the pure JS fallback when available

// Attempt to import satellite.js, fall back to mock if WASM unavailable
let satellite: any = null;
try {
  // eslint-disable-next-line import/no-named-as-default
  satellite = require('satellite.js');
} catch (e) {
  console.warn('satellite.js not available, using mock data');
}

export interface SatellitePosition {
  name: string;
  id: string;
  lat: number;
  lon: number;
  alt: number; // km
  velocity: number; // km/s
  azimuth: number;
  elevation: number;
  range: number; // km
  isVisible: boolean;
  footprint: number; // km
}

export interface TLEData {
  name: string;
  line1: string;
  line2: string;
  noradId?: number;
}

// Default TLE for ISS (International Space Station)
export const ISS_TLE: TLEData = {
  name: 'ISS (ZARYA)',
  line1: '1 25544U 98067A   24000.00000000  .00016717  00000-0  10270-3 0  9993',
  line2: '2 25544  51.6400 208.9161 0006703  35.0822 325.0501 15.499999974000  9993',
  noradId: 25544,
};

// Default TLEs for common satellites
export const DEFAULT_SATELLITE_TLES: TLEData[] = [
  ISS_TLE,
  {
    name: 'NOAA 19',
    line1: '1 33591U 09005A   24000.00000000  .00000156  00000-0  10000-4 0  9990',
    line2: '2 33591  99.1000 270.0000 0013500 240.0000 119.9000 14.1254094070000',
    noradId: 33591,
  },
  {
    name: 'STARLINK-1000',
    line1: '1 44719U 19074A   24000.00000000  .00001856  00000-0  13000-4 0  9997',
    line2: '2 44719  53.0000 100.0000 0001000  90.0000 260.0000 15.50000000000',
    noradId: 44719,
  },
];

// Observer location (default: some where in Africa - can be updated from UI)
let observerLocation = {
  latitude: -26.2041, // Johannesburg
  longitude: 28.0473,
  altitude: 1662, // meters
};

export function setObserverLocation(lat: number, lon: number, alt: number = 0) {
  observerLocation = { latitude: lat, longitude: lon, altitude: alt };
}

// Helper: degrees to radians
function toRadians(deg: number): number {
  return deg * Math.PI / 180;
}

// Helper: radians to degrees
function toDegrees(rad: number): number {
  return rad * 180 / Math.PI;
}

/**
 * Calculate satellite position for a given TLE and time
 * Uses simplified orbital mechanics (SGP4-lite approach)
 */
export function getSatellitePosition(tle: TLEData, date: Date = new Date()): SatellitePosition | null {
  if (!satellite) {
    // Return mock data if satellite.js unavailable
    const now = Date.now();
    const offset = (now % 100000) / 1000;
    return {
      name: tle.name,
      id: tle.noradId?.toString() || tle.name,
      lat: Math.sin(offset) * 50,
      lon: (offset * 10) % 360 - 180,
      alt: 400 + Math.sin(offset * 2) * 50,
      velocity: 7.66,
      azimuth: (offset * 5) % 360,
      elevation: 45,
      range: 500,
      isVisible: true,
      footprint: 2000,
    };
  }

  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    
    if (!satrec) {
      return null;
    }

    const position = satellite.propagate(satrec, date);
    
    if (!position.position) {
      return null;
    }

    // Get position in ECI coordinates
    const positionEci = position.position as any;
    
    // Get GMST for coordinate conversion
    const gmst = satellite.gmst(date as Date);
    
    // Convert ECI to Geodetic coordinates
    const gd = satellite.eciToGeodetic(positionEci, gmst);
    
    const lat = toDegrees(satellite.toDegrees ? satellite.toDegrees(gd.latitude) : gd.latitude);
    const lon = toDegrees(satellite.toDegrees ? satellite.toDegrees(gd.longitude) : gd.longitude);
    const alt = satellite.toKilometer ? satellite.toKilometer(gd.height) : gd.height / 1000;

    // Calculate velocity
    const velocity = position.velocity as any;
    const speed = Math.sqrt(
      Math.pow(velocity.x, 2) + 
      Math.pow(velocity.y, 2) + 
      Math.pow(velocity.z, 2)
    );

    // Calculate observer look angle
    const lookAngles = satellite.getLookAngle(
      satrec,
      date,
      observerLocation.latitude,
      observerLocation.longitude,
      observerLocation.altitude
    );

    const azimuth = toDegrees(lookAngles.azimuth);
    const elevation = toDegrees(lookAngles.elevation);
    const range = satellite.toKilometer ? satellite.toKilometer(lookAngles.rangeSat) : lookAngles.rangeSat / 1000;

    // Determine if satellite is visible (above horizon)
    const isVisible = elevation > 0;

    // Calculate footprint (circle of visibility)
    const earthRadius = 6378.137; // km
    const footprint = Math.acos(earthRadius / (earthRadius + alt)) * 2 * earthRadius;

    return {
      name: tle.name,
      id: tle.noradId?.toString() || tle.name,
      lat,
      lon,
      alt,
      velocity: speed,
      azimuth: azimuth < 0 ? azimuth + 360 : azimuth,
      elevation,
      range,
      isVisible,
      footprint,
    };
  } catch (error) {
    console.error('Satellite position calculation error:', error);
    return null;
  }
}

/**
 * Get multiple satellite positions
 */
export function getMultipleSatellitePositions(tles: TLEData[], date: Date = new Date()): SatellitePosition[] {
  return tles
    .map(tle => getSatellitePosition(tle, date))
    .filter((pos): pos is SatellitePosition => pos !== null);
}