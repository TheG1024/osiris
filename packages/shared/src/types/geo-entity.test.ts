import { describe, it, expect } from 'vitest';
import { EntityType, GeoEntity, ProcessedEntity } from './geo-entity';

describe('GeoEntity', () => {
  it('creates valid aircraft entity with required fields', () => {
    const aircraft: GeoEntity = {
      id: 'aircraft-001',
      type: 'aircraft' as EntityType,
      lat: 37.7749,
      lon: -122.4194,
      timestamp: Date.now(),
    };

    expect(aircraft.id).toBe('aircraft-001');
    expect(aircraft.type).toBe('aircraft');
    expect(aircraft.lat).toBe(37.7749);
    expect(aircraft.lon).toBe(-122.4194);
    expect(aircraft.timestamp).toBeDefined();
  });

  it('accepts all entity types', () => {
    const baseTimestamp = Date.now();
    
    const aircraft: GeoEntity = { id: 'a1', type: 'aircraft', lat: 0, lon: 0, timestamp: baseTimestamp };
    const satellite: GeoEntity = { id: 's1', type: 'satellite', lat: 0, lon: 0, timestamp: baseTimestamp };
    const ship: GeoEntity = { id: 'sh1', type: 'ship', lat: 0, lon: 0, timestamp: baseTimestamp };
    const weather: GeoEntity = { id: 'w1', type: 'weather', lat: 0, lon: 0, timestamp: baseTimestamp };
    const camera: GeoEntity = { id: 'c1', type: 'camera', lat: 0, lon: 0, timestamp: baseTimestamp };

    expect(aircraft.type).toBe('aircraft');
    expect(satellite.type).toBe('satellite');
    expect(ship.type).toBe('ship');
    expect(weather.type).toBe('weather');
    expect(camera.type).toBe('camera');
  });

  it('creates ProcessedEntity extending GeoEntity', () => {
    const processed: ProcessedEntity = {
      id: 'processed-001',
      type: 'aircraft',
      lat: 40.7128,
      lon: -74.0060,
      timestamp: Date.now(),
      processedAt: Date.now(),
      confidence: 0.95,
    };

    expect(processed.id).toBe('processed-001');
    expect(processed.processedAt).toBeDefined();
    expect(processed.confidence).toBe(0.95);
  });
});