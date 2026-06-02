/**
 * Tests for Haversine distance utility
 */
import { describe, it, expect } from 'vitest';
import { haversineDistance } from './haversine';

describe('Haversine Distance Utility', () => {
  it('should calculate correct distance between two points', () => {
    // Test with known coordinates
    const lat1 = 40.7128; // New York City
    const lon1 = -74.0060;
    const lat2 = 51.5074; // London
    const lon2 = -0.1278;

    const distance = haversineDistance(lat1, lon1, lat2, lon2);
    
    // NYC to London is approximately 5570 km
    expect(distance).toBeGreaterThan(5500);
    expect(distance).toBeLessThan(5650);
  });

  it('should return approximately 5570 km for NYC to London', () => {
    // NYC: 40.7128° N, 74.0060° W
    // London: 51.5074° N, 0.1278° W
    const distance = haversineDistance(40.7128, -74.0060, 51.5074, -0.1278);
    
    // Allow ±10km tolerance
    expect(distance).toBeCloseTo(5570, -1);
  });

  it('should return 0 for the same point', () => {
    const distance = haversineDistance(40.7128, -74.0060, 40.7128, -74.0060);
    expect(distance).toBe(0);
  });
});