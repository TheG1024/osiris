// Satellite tracking using satellite.js
// Provides real-time satellite positions from TLE data

import { satellite } from 'satellite.js';

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

/**
 * Calculate satellite position for a given TLE and time
 */
export function getSatellitePosition(tle: TLEData, date: Date = new Date()): SatellitePosition | null {
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    
    if (!satrec) {
      console.error('Invalid TLE data');
      return null;
    }

    const position = satellite.propagate(satrec, date);
    
    if (!position.position) {
      return null;
    }

    // Get position in ECI coordinates
    const positionEci = position.position as satellite.EciVec3<number>;
    
    // Get GMST for coordinate conversion
    const gmst = satellite.gmst(date as Date);
    
    // Convert ECI to Geodetic coordinates
    const gd = satellite.eciToGeodetic(positionEci, gmst);
    
    const lat = satellite.toDegrees(gd.latitude);
    const lon = satellite.toDegrees(gd.longitude);
    const alt = satellite.toKilometer(gd.height);

    // Calculate velocity
    const velocity = position.velocity as satellite.EciVec3<number>;
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

    const azimuth = satellite.toDegrees(lookAngles.azimuth);
    const elevation = satellite.toDegrees(lookAngles.elevation);
    const range = satellite.toKilometer(lookAngles.rangeSat);

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

/**
 * Predict satellite passes for the next N days
 */
export function predictPasses(
  tle: TLEData, 
  days: number = 7,
  minElevation: number = 10
): Array<{ rise: Date; culmination: Date; set: Date; maxElevation: number }> {
  const passes: Array<{ rise: Date; culmination: Date; set: Date; maxElevation: number }> = [];
  const now = new Date();
  const endTime = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  // Check every 30 seconds
  const checkInterval = 30; // seconds
  let currentTime = now;
  let inPass = false;
  let passStart: Date | null = null;
  let maxElevInPass = 0;

  while (currentTime < endTime) {
    const position = getSatellitePosition(tle, currentTime);
    
    if (position) {
      if (position.elevation > minElevation) {
        if (!inPass) {
          inPass = true;
          passStart = new Date(currentTime);
          maxElevInPass = position.elevation;
        } else {
          maxElevInPass = Math.max(maxElevInPass, position.elevation);
        }
      } else if (inPass && position.elevation < minElevation - 5) {
        // Exit pass with some hysteresis
        inPass = false;
        if (passStart) {
          passes.push({
            rise: passStart,
            culmination: new Date(passStart.getTime() + (currentTime.getTime() - passStart.getTime()) / 2),
            set: new Date(currentTime),
            maxElevation: maxElevInPass,
          });
        }
        passStart = null;
        maxElevInPass = 0;
      }
    }

    currentTime = new Date(currentTime.getTime() + checkInterval * 1000);
  }

  return passes;
}

/**
 * Generate solar terminator line for globe visualization
 */
export function computeSolarTerminator(): [number, number][] {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  
  // Solar declination (approximate)
  const declination = -23.44 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));
  const decRad = declination * Math.PI / 180;
  
  // Subsolar point longitude
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
  const subsolarLng = (12 - utcHours) * 15;
  
  const points: [number, number][] = [];
  
  // Calculate terminator points
  for (let lng = -180; lng <= 180; lng += 2) {
    const lngRad = (lng - subsolarLng) * Math.PI / 180;
    const lat = Math.atan(-Math.cos(lngRad) / Math.tan(decRad)) * 180 / Math.PI;
    points.push([lng, lat]);
  }
  
  // Close the loop
  const darkSide = declination >= 0 ? -90 : 90;
  points.push([180, darkSide]);
  points.push([-180, darkSide]);
  points.push(points[0]);
  
  return points;
}