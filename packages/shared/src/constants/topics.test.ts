/**
 * Tests for Redpanda topic constants
 */
import { describe, it, expect } from 'vitest';
import { TOPICS } from './topics';

describe('Topic Constants', () => {
  it('should have TOPICS object defined', () => {
    expect(TOPICS).toBeDefined();
    expect(typeof TOPICS).toBe('object');
  });

  it('should have all required topics', () => {
    const requiredTopics = [
      'INGEST_AIRCRAFT',
      'INGEST_SATELLITE',
      'INGEST_SHIPS',
      'INGEST_WEATHER',
      'ENTITIES_PROCESSED',
      'ALERTS'
    ];

    requiredTopics.forEach(topic => {
      expect(TOPICS).toHaveProperty(topic);
      expect(typeof TOPICS[topic as keyof typeof TOPICS]).toBe('string');
    });
  });
});