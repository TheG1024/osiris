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
  });

  it('should disconnect from Kafka', async () => {
    await consumer.connect();
    await consumer.disconnect();
  });
});

describe('ProducerWrapper', () => {
  let producer: ProducerWrapper;

  beforeEach(() => {
    producer = createProducer({
      brokers: 'localhost:9092',
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
  });

  it('should produce a message', async () => {
    await producer.connect();
    await producer.produce({
      topic: 'test-topic',
      key: 'key',
      value: 'value',
    });
  });
});