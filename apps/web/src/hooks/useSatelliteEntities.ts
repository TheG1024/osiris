import { useState, useEffect, useCallback, useMemo } from 'react';

// TLE (Two-Line Element) data structure
interface TLE {
  name: string;
  line1: string;
  line2: string;
}

// Propagated satellite position
interface SatellitePosition {
  name: string;
  noradId: string;
  lat: number;
  lon: number;
  alt: number; // km above Earth's surface
  velocity: number; // km/s
  orbitType: 'LEO' | 'MEO' | 'GEO';
  orbitalPeriod: number; // minutes
}

// Orbit path point
interface OrbitPathPoint {
  position: [number, number, number];
}

// Complete satellite data with position and orbit
interface SatelliteData {
  tle: TLE;
  position: SatellitePosition;
  orbitPath: OrbitPathPoint[];
}

interface UseSatelliteEntitiesReturn {
  satellites: SatelliteData[];
  loading: boolean;
  error: string | null;
  lastUpdate: number | null;
}

const SATELLITE_REFRESH_INTERVAL = 60000; // 60 seconds
const ORBIT_PATH_POINTS = 90; // Number of points for orbit path

// Note: satellite.js will be used when properly installed
// For now, we'll provide stub implementations that work when the package is available

export default function useSatelliteEntities(): UseSatelliteEntitiesReturn {
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const fetchSatellites = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/satellites');
      if (!response.ok) {
        throw new Error(`Failed to fetch satellites: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Process TLE data and propagate positions
      const processedSatellites = await processSatelliteData(data.satellites || []);
      setSatellites(processedSatellites);
      setLastUpdate(Date.now());
      setError(null);
    } catch (err) {
      console.error('Error fetching satellites:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchSatellites();

    // Set up polling interval
    const interval = setInterval(fetchSatellites, SATELLITE_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchSatellites]);

  return {
    satellites,
    loading,
    error,
    lastUpdate
  };
}

// Process TLE data with satellite.js when available
async function processSatelliteData(tleData: TLE[]): Promise<SatelliteData[]> {
  return tleData.map(tle => {
    const position = propagatePosition(tle);
    const orbitPath = computeOrbitPath(tle);
    
    return {
      tle,
      position,
      orbitPath
    };
  });
}

// Propagate satellite position using TLE
function propagatePosition(tle: TLE): SatellitePosition {
  // Determine orbit type based on altitude
  const orbitType = determineOrbitType(tle);
  const altitude = getOrbitAltitude(tle);
  
  // Calculate approximate position
  const now = Date.now();
  const gmst = getGMST(now);
  
  // Simplified orbital calculation (when satellite.js is available, use it properly)
  const position = calculateOrbitalPosition(tle, now);
  
  // Calculate velocity (simplified)
  const velocity = calculateOrbitalVelocity(orbitType);
  
  // Calculate orbital period
  const period = calculateOrbitalPeriod(altitude);
  
  return {
    name: tle.name,
    noradId: extractNoradId(tle),
    lat: position.lat,
    lon: position.lon,
    alt: altitude,
    velocity,
    orbitType,
    orbitalPeriod: period
  };
}

// Determine orbit type from TLE
function determineOrbitType(tle: TLE): 'LEO' | 'MEO' | 'GEO' {
  try {
    // Extract inclination and period from TLE line 2
    // This is simplified - satellite.js does this properly
    const inclination = parseInt(tle.line2.substring(8, 16));
    
    if (inclination > 90) {
      // Sun-synchronous or polar orbit -> likely LEO
      return 'LEO';
    }
    
    // Check for GEO characteristics
    const meanMotion = parseFloat(tle.line2.substring(52, 63));
    const revolutionsPerDay = meanMotion;
    
    if (revolutionsPerDay < 1.5) {
      return 'GEO';
    } else if (revolutionsPerDay < 5) {
      return 'MEO';
    }
    
    return 'LEO';
  } catch {
    return 'LEO'; // Default to LEO
  }
}

// Get approximate orbit altitude in km
function getOrbitAltitude(tle: TLE): number {
  const orbitType = determineOrbitType(tle);
  
  switch (orbitType) {
    case 'GEO':
      return 35786; // km
    case 'MEO':
      return 20200; // km (GPS constellation altitude)
    case 'LEO':
    default:
      return 400; // km (typical LEO)
  }
}

// Calculate orbital position from TLE
function calculateOrbitalPosition(tle: TLE, timestamp: number): { lat: number; lon: number } {
  const gmst = getGMST(timestamp);
  
  // Simplified calculation - in production use satellite.js
  // Extract mean anomaly and right ascension from TLE
  try {
    const meanAnomaly = parseFloat(tle.line2.substring(43, 52)) * (Math.PI / 180);
    const raan = parseFloat(tle.line2.substring(17, 25)) * (Math.PI / 180);
    
    // Calculate longitude
    let lon = (raan + gmst - meanAnomaly) * (180 / Math.PI) % 360;
    if (lon > 180) lon -= 360;
    if (lon < -180) lon += 360;
    
    // Simplified latitude (equatorial orbit approximation)
    const inclination = parseFloat(tle.line2.substring(8, 16)) * (Math.PI / 180);
    const lat = Math.sin(meanAnomaly) * (90 - inclination * (180 / Math.PI)) * 0.3;
    
    return { lat, lon };
  } catch {
    return { lat: 0, lon: 0 };
  }
}

// Compute orbit path (90 points)
function computeOrbitPath(tle: TLE): OrbitPathPoint[] {
  const points: OrbitPathPoint[] = [];
  const orbitType = determineOrbitType(tle);
  const altitude = getOrbitAltitude(tle);
  
  // Calculate period in minutes
  const period = calculateOrbitalPeriod(altitude);
  
  for (let i = 0; i < ORBIT_PATH_POINTS; i++) {
    const fraction = i / ORBIT_PATH_POINTS;
    const time = fraction * period * 60 * 1000; // Convert to ms
    
    const position = calculateOrbitalPositionAtTime(tle, time);
    
    // Convert altitude to meters for deck.gl
    const altitudeMeters = altitude * 1000;
    
    points.push({
      position: [position.lon, position.lat, altitudeMeters]
    });
  }
  
  return points;
}

// Calculate position at specific time
function calculateOrbitalPositionAtTime(tle: TLE, timeMs: number): { lat: number; lon: number } {
  const timestamp = Date.now() + timeMs;
  return calculateOrbitalPosition(tle, timestamp);
}

// Get Greenwich Mean Sidereal Time
function getGMST(timestamp: number): number {
  const j2000 = 946728000000; // Jan 1, 2000 12:00 TT
  const days = (timestamp - j2000) / 86400000;
  const gmst = 280.46061837 + 360.98564736629 * days;
  return (gmst % 360) * (Math.PI / 180);
}

// Calculate orbital velocity in km/s
function calculateOrbitalVelocity(orbitType: 'LEO' | 'MEO' | 'GEO'): number {
  switch (orbitType) {
    case 'GEO':
      return 3.07; // km/s
    case 'MEO':
      return 3.87; // km/s (GPS)
    case 'LEO':
    default:
      return 7.67; // km/s
  }
}

// Calculate orbital period in minutes
function calculateOrbitalPeriod(altitudeKm: number): number {
  // Using Kepler's third law
  const earthRadius = 6371; // km
  const semiMajorAxis = earthRadius + altitudeKm;
  const GM = 398600.4418; // km³/s²
  
  const period = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / GM);
  return period / 60; // Convert to minutes
}

// Extract NORAD ID from TLE
function extractNoradId(tle: TLE): string {
  try {
    return tle.line2.substring(2, 7).trim();
  } catch {
    return '00000';
  }
}

// Get color for orbit type
export function getOrbitColor(orbitType: 'LEO' | 'MEO' | 'GEO'): [number, number, number, number] {
  switch (orbitType) {
    case 'LEO':
      return [0, 255, 255, 200]; // Cyan
    case 'MEO':
      return [212, 175, 55, 200]; // Gold
    case 'GEO':
      return [255, 0, 0, 200]; // Red
  }
}