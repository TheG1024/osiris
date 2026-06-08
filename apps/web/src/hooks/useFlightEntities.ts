import { useState, useEffect, useCallback } from 'react';

interface Flight {
  id: string;
  callsign: string;
  icao24: string;
  lat: number;
  lon: number;
  altitude: number; // feet AGL
  speed: number; // knots
  heading: number; // degrees
  origin: string;
  destination: string;
  lastUpdate: number;
}

interface UseFlightEntitiesReturn {
  flights: Flight[];
  loading: boolean;
  error: string | null;
  lastUpdate: number | null;
}

const FLIGHT_REFRESH_INTERVAL = 10000; // 10 seconds

export default function useFlightEntities(): UseFlightEntitiesReturn {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const fetchFlights = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/flights');
      if (!response.ok) {
        throw new Error(`Failed to fetch flights: ${response.statusText}`);
      }
      const data = await response.json();
      setFlights(data.flights || []);
      setLastUpdate(Date.now());
      setError(null);
    } catch (err) {
      console.error('Error fetching flights:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchFlights();

    // Set up polling interval
    const interval = setInterval(fetchFlights, FLIGHT_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchFlights]);

  return {
    flights,
    loading,
    error,
    lastUpdate
  };
}

// Helper to calculate flight position after time delta
export function updateFlightPosition(
  flight: Flight,
  timeDeltaMs: number
): Flight {
  const timeDeltaSeconds = timeDeltaMs / 1000;
  const speedKnots = flight.speed;
  const speedMs = speedKnots * 0.514444; // Convert knots to m/s
  
  // Calculate distance traveled in meters
  const distanceMeters = speedMs * timeDeltaSeconds;
  
  // Convert to degrees (rough approximation at mid-latitudes)
  const latDelta = distanceMeters / 111320;
  const lonDelta = distanceMeters / (111320 * Math.cos(flight.lat * Math.PI / 180));
  
  // Calculate new heading
  const headingRad = flight.heading * Math.PI / 180;
  const newLat = flight.lat + latDelta * Math.cos(headingRad);
  const newLon = flight.lon + lonDelta * Math.sin(headingRad);
  
  return {
    ...flight,
    lat: newLat,
    lon: newLon,
    lastUpdate: Date.now()
  };
}

// Convert altitude from feet to meters for 3D rendering
export function altitudeFeetToMeters(altitudeFeet: number): number {
  return altitudeFeet * 0.3048;
}

// Convert altitude from feet to kilometers for display
export function altitudeFeetToKm(altitudeFeet: number): number {
  return (altitudeFeet * 0.3048) / 1000;
}