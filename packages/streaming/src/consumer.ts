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
          throw error; // kafkajs will retry
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
}

/**
 * Kafka Producer Wrapper using kafkajs
 */
export class ProducerWrapper {
  private kafka: Kafka;
  private producer: Producer;

  constructor(config: ProducerConfig) {
    this.kafka = new Kafka({
      clientId: 'osiris-streaming',
      brokers: config.brokers,
    });
    this.producer = this.kafka.producer();
  }

  /**
   * Connect to Kafka
   */
  async connect(): Promise<void> {
    await this.producer.connect();
    console.log(`Producer connected to ${this.producer}`);
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
   * Send multiple messages to a topic
   */
  async sendBatch(
    topic: string,
    messages: Array<{ key: string; value: Record<string, unknown> }>
  ): Promise<void> {
    await this.producer.send({
      topic,
      messages: messages.map((m) => ({
        key: m.key,
        value: JSON.stringify(m.value),
      })),
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
  return new ProducerWrapper(config);
}