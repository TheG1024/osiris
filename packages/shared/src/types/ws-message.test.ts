import { describe, it, expect } from 'vitest';
import {
  WSMessageType,
  WSMessage,
  EntityBatchPayload,
  AlertPayload,
  StatsPayload,
} from './ws-message';

describe('WebSocket Message Types', () => {
  it('defines WSMessageType union values', () => {
    const messageTypes: WSMessageType[] = [
      'entity_batch',
      'alert',
      'stats',
      'heartbeat',
      'command',
      'error',
    ];

    messageTypes.forEach((type) => {
      expect(['entity_batch', 'alert', 'stats', 'heartbeat', 'command', 'error']).toContain(type);
    });
  });

  it('creates WSMessage with entity_batch type', () => {
    const payload: EntityBatchPayload = {
      entities: [
        { id: 'e1', type: 'aircraft', lat: 40.7, lon: -74.0, timestamp: Date.now() },
        { id: 'e2', type: 'ship', lat: 51.5, lon: -0.1, timestamp: Date.now() },
      ],
      source: 'radar',
      count: 2,
    };

    const message: WSMessage<EntityBatchPayload> = {
      type: 'entity_batch',
      payload,
      timestamp: Date.now(),
    };

    expect(message.type).toBe('entity_batch');
    expect(message.payload.entities).toHaveLength(2);
    expect(message.payload.source).toBe('radar');
    expect(message.payload.count).toBe(2);
  });

  it('creates WSMessage with alert type', () => {
    const payload: AlertPayload = {
      alertId: 'alert-001',
      severity: 'high',
      message: 'Proximity alert detected',
      entityId: 'aircraft-123',
      timestamp: Date.now(),
    };

    const message: WSMessage<AlertPayload> = {
      type: 'alert',
      payload,
      timestamp: Date.now(),
    };

    expect(message.type).toBe('alert');
    expect(message.payload.alertId).toBe('alert-001');
    expect(message.payload.severity).toBe('high');
    expect(message.payload.message).toBe('Proximity alert detected');
  });

  it('creates WSMessage with stats type', () => {
    const payload: StatsPayload = {
      period: '1h',
      totalEntities: 150,
      entitiesByType: {
        aircraft: 50,
        satellite: 25,
        ship: 45,
        weather: 20,
        camera: 10,
      },
      processingLatency: 12.5,
    };

    const message: WSMessage<StatsPayload> = {
      type: 'stats',
      payload,
      timestamp: Date.now(),
    };

    expect(message.type).toBe('stats');
    expect(message.payload.totalEntities).toBe(150);
    expect(message.payload.entitiesByType.aircraft).toBe(50);
    expect(message.payload.processingLatency).toBe(12.5);
  });

  it('creates generic WSMessage with timestamp', () => {
    const timestamp = Date.now();
    const message: WSMessage = {
      type: 'heartbeat',
      payload: { status: 'ok' },
      timestamp,
    };

    expect(message.timestamp).toBe(timestamp);
    expect(message.type).toBe('heartbeat');
  });
});