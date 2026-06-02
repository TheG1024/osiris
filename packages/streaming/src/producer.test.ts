import { describe, it, expect } from 'vitest';

describe('Producer API - Compile Tests', () => {
  it('producer module compiles and exports are correct', async () => {
    // This test just verifies the module compiles - runtime tests require native Kafka module
    const producerModule = await import('./producer');
    
    expect(producerModule.createProducer).toBeDefined();
    expect(typeof producerModule.createProducer).toBe('function');
    expect(producerModule.ProducerWrapper).toBeDefined();
    // Note: ProducerConfig and ProduceMessage are TypeScript types only, not runtime exports
  });

  it('ProducerWrapper has expected methods (prototype check)', async () => {
    const { ProducerWrapper } = await import('./producer');
    expect(ProducerWrapper.prototype.produce).toBeDefined();
    expect(ProducerWrapper.prototype.disconnect).toBeDefined();
  });
});