import { useState, useEffect, useCallback } from 'react';

interface Ship {
  id: string;
  name: string;
  mmsi: string;
  shipType: string;
  lat: number;
  lon: number;
  speed: number; // knots
  heading: number; // degrees
  lastUpdate: number;
}

interface UseShipEntitiesReturn {
  ships: Ship[];
  loading: boolean;
  error: string | null;
  lastUpdate: number | null;
}

const SHIP_REFRESH_INTERVAL = 15000; // 15 seconds

export default function useShipEntities(): UseShipEntitiesReturn {
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const fetchShips = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/ships');
      if (!response.ok) {
        throw new Error(`Failed to fetch ships: ${response.statusText}`);
      }
      const data = await response.json();
      setShips(data.ships || []);
      setLastUpdate(Date.now());
      setError(null);
    } catch (err) {
      console.error('Error fetching ships:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchShips();

    // Set up polling interval
    const interval = setInterval(fetchShips, SHIP_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchShips]);

  return {
    ships,
    loading,
    error,
    lastUpdate
  };
}

// Helper to calculate ship position after time delta
export function updateShipPosition(
  ship: Ship,
  timeDeltaMs: number
): Ship {
  const timeDeltaSeconds = timeDeltaMs / 1000;
  const speedKnots = ship.speed;
  const speedMs = speedKnots * 0.514444; // Convert knots to m/s
  
  // Calculate distance traveled in meters
  const distanceMeters = speedMs * timeDeltaSeconds;
  
  // Convert to degrees (rough approximation at current latitude)
  const latDelta = distanceMeters / 111320;
  const lonDelta = distanceMeters / (111320 * Math.cos(ship.lat * Math.PI / 180));
  
  // Apply heading direction
  const headingRad = ship.heading * Math.PI / 180;
  const newLat = ship.lat + latDelta * Math.cos(headingRad);
  const newLon = ship.lon + lonDelta * Math.sin(headingRad);
  
  return {
    ...ship,
    lat: newLat,
    lon: newLon,
    lastUpdate: Date.now()
  };
}

// Ship type categories for rendering
export const ShipTypeCategories = {
  CARGO: ['cargo', 'bulk carrier', 'container ship'],
  TANKER: ['tanker', 'oil tanker', 'chemical tanker'],
  PASSENGER: ['passenger', 'cruise', 'ferry'],
  FISHING: ['fishing', 'fishing vessel'],
  PLEASURE: ['pleasure', 'yacht', 'sailing'],
  OTHER: ['other', 'unknown']
} as const;

export function getShipCategory(shipType: string): string {
  const typeLower = shipType.toLowerCase();
  for (const [category, types] of Object.entries(ShipTypeCategories)) {
    if (types.some(t => typeLower.includes(t))) {
      return category;
    }
  }
  return 'OTHER';
}