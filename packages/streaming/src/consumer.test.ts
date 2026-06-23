import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createConsumer, ConsumerWrapper, createProducer, ProducerWrapper } from './consumer';

// ponytail: integration tests need Redpanda. Set INTEGRATION=1 to run.
// CI doesn't have Redpanda, so default is skip.
const itIntegration = process.env.INTEGRATION === '1' ? it : it.skip;

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

  itIntegration('should connect to Kafka and subscribe to topics', async () => {
    await consumer.connect();
  });

  itIntegration('should disconnect from Kafka', async () => {
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

  itIntegration('should connect to Kafka', async () => {
    await producer.connect();
  });

  itIntegration('should produce a message', async () => {
    await producer.connect();
    await producer.produce({
      topic: 'test-topic',
      key: 'key',
      value: 'value',
    });
  });
});