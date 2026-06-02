import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createConsumer, ConsumerWrapper, createProducer, ProducerWrapper } from './consumer';

describe('ConsumerWrapper', () => {
  let consumer: ConsumerWrapper;

  beforeEach(() => {
    consumer = createConsumer({
      brokers: ['localhost:9092'],
      groupId: 'test-group',
      topics: ['test-topic'],
      fromBeginning: true,
    });
  });

  afterEach(async () => {
    await consumer.disconnect();
  });

  it('should create a consumer with correct config', () => {
    expect(consumer).toBeInstanceOf(ConsumerWrapper);
  });

  it('should connect to Kafka and subscribe to topics', async () => {
    await consumer.connect();
    // Connection should not throw
  });

  it('should disconnect from Kafka', async () => {
    await consumer.connect();
    await consumer.disconnect();
    // Should not throw
  });
});

describe('ProducerWrapper', () => {
  let producer: ProducerWrapper;

  beforeEach(() => {
    producer = createProducer({
      brokers: ['localhost:9092'],
    });
  });

  afterEach(async () => {
    await producer.disconnect();
  });

  it('should create a producer', () => {
    expect(producer).toBeInstanceOf(ProducerWrapper);
  });

  it('should connect to Kafka', async () => {
    await producer.connect();
    // Should not throw
  });

  it('should send a message', async () => {
    await producer.connect();
    await producer.send('test-topic', 'key', { data: 'value' });
    // Should not throw
  });

  it('should send batch messages', async () => {
    await producer.connect();
    await producer.sendBatch('test-topic', [
      { key: 'key1', value: { data: 'value1' } },
      { key: 'key2', value: { data: 'value2' } },
    ]);
    // Should not throw
  });
});