import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';

/**
 * Configuration for Kafka consumer
 */
export interface ConsumerConfig {
  brokers: string[];
  groupId: string;
  topics: string[];
  fromBeginning?: boolean;
}

/**
 * Kafka Consumer Wrapper using kafkajs
 */
export class ConsumerWrapper {
  private kafka: Kafka;
  private consumer: Consumer;
  private config: ConsumerConfig;

  constructor(config: ConsumerConfig) {
    this.config = config;
    this.kafka = new Kafka({
      clientId: 'osiris-streaming',
      brokers: config.brokers,
    });
    this.consumer = this.kafka.consumer({
      groupId: config.groupId,
    });
  }

  /**
   * Connect to Kafka and start consuming messages
   */
  async connect(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topics: this.config.topics,
      fromBeginning: this.config.fromBeginning ?? false,
    });

    console.log(`Consumer connected to ${this.config.brokers.join(', ')}`);
  }

  /**
   * Start consuming messages
   */
  async consume(
    handler: (payload: EachMessagePayload) => Promise<void>
  ): Promise<void> {
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          await handler(payload);
        } catch (error) {
          console.error('Error processing message:', error);
          throw error;
        }
      },
    });
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }
}

/**
 * Configuration for Kafka producer
 */
export interface ProducerConfig {
  brokers: string[];
  clientId?: string;
}

/**
 * Kafka Producer Wrapper using kafkajs
 */
export class ProducerWrapper {
  private kafka: Kafka;
  private producer: Producer;

  constructor(config: ProducerConfig) {
    this.kafka = new Kafka({
      clientId: config.clientId ?? 'osiris-streaming',
      brokers: config.brokers,
    });
    this.producer = this.kafka.producer();
  }

  /**
   * Connect to Kafka
   */
  async connect(): Promise<void> {
    await this.producer.connect();
    console.log('Producer connected');
  }

  /**
   * Send a message to a topic (backwards compatible API)
   */
  async produce(args: { topic: string; key?: string; value: string; partition?: number }): Promise<void> {
    const msg: any = {
      topic: args.topic,
      messages: [{ value: args.value }] as any,
    };
    if (args.key) msg.messages[0].key = args.key;
    if (typeof args.partition === 'number') msg.messages[0].partition = args.partition;
    await this.producer.send(msg);
  }

  /**
   * Send a message to a topic
   */
  async send(
    topic: string,
    key: string,
    value: Record<string, unknown>
  ): Promise<void> {
    await this.producer.send({
      topic,
      messages: [
        {
          key,
          value: JSON.stringify(value),
        },
      ],
    });
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }
}

/**
 * Factory function to create a consumer
 */
export function createConsumer(config: ConsumerConfig): ConsumerWrapper {
  return new ConsumerWrapper(config);
}

/**
 * Factory function to create a producer
 */
export function createProducer(config: { brokers: string }): ProducerWrapper {
  // Accept string for backwards compatibility, split by comma
  const brokers = config.brokers.split(',').map(b => b.trim());
  return new ProducerWrapper({ brokers });
}