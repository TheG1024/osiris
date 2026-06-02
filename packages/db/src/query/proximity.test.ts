import { describe, it, expect } from 'vitest';
import { findEntitiesInRadius } from './proximity';

describe('findEntitiesInRadius', () => {
  it('function exists and is callable', () => {
    expect(findEntitiesInRadius).toBeDefined();
    expect(typeof findEntitiesInRadius).toBe('function');
  });

  it('returns entities within radius sorted by distance', () => {
    const centerLat = 40.7128; // NYC
    const centerLon = -74.0060;
    const radiusKm = 1000; // Large radius to include all test entities

    const entities = [
      { id: '1', latitude: 40.7128, longitude: -74.0060 }, // Same point, 0 km
      { id: '2', latitude: 40.8, longitude: -73.9 }, // ~15 km from NYC
      { id: '3', latitude: 41.0, longitude: -74.5 }, // ~50 km from NYC
      { id: '4', latitude: 42.0, longitude: -75.0 }, // ~150 km from NYC
    ];

    const results = findEntitiesInRadius(centerLat, centerLon, radiusKm, entities);

    expect(results.length).toBe(4); // All within 1000km
    expect(results[0]?.id).toBe('1'); // Closest first (0 km)
    expect(results[0]?.distanceKm).toBeCloseTo(0, 2);
    // Verify sorted by distance ascending
    results.forEach((r, i) => {
      if (i > 0 && results[i - 1]) {
        expect(r.distanceKm).toBeGreaterThanOrEqual(results[i - 1]!.distanceKm);
      }
    });
  });

  it('returns empty array when no entities in radius', () => {
    const entities = [
      { id: '1', latitude: 50.0, longitude: -100.0 }, // Canada, very far from NYC
    ];

    const results = findEntitiesInRadius(40.7128, -74.0060, 1, entities); // Only 1km radius

    expect(results).toHaveLength(0);
  });

  it('includes distance in results', () => {
    const entities = [
      { id: '1', latitude: 40.7128, longitude: -74.0060 },
    ];

    const results = findEntitiesInRadius(40.7128, -74.0060, 100, entities);

    expect(results).toHaveLength(1);
    const first = results[0]!;
    expect(first).toHaveProperty('distanceKm');
    expect(typeof first.distanceKm).toBe('number');
  });
});

describe('PROXIMITY_SQL constants', () => {
  it('PROXIMITY_SQL_WHERE is defined', async () => {
    const { PROXIMITY_SQL_WHERE } = await import('./proximity');
    expect(PROXIMITY_SQL_WHERE).toBeDefined();
    expect(typeof PROXIMITY_SQL_WHERE).toBe('string');
    expect(PROXIMITY_SQL_WHERE).toContain('ST_DWithin');
  });

  it('PROXIMITY_SQL_ORDER is defined', async () => {
    const { PROXIMITY_SQL_ORDER } = await import('./proximity');
    expect(PROXIMITY_SQL_ORDER).toBeDefined();
    expect(typeof PROXIMITY_SQL_ORDER).toBe('string');
    expect(PROXIMITY_SQL_ORDER).toContain('ST_Distance');
  });
});