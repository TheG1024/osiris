import { KafkaConsumer } from '@confluentinc/kafka-javascript';

export interface ConsumerConfig {
  brokers: string;
  groupId: string;
  topics: string[];
  handler?: (message: {
    key: string | null;
    value: string | null;
    topic: string;
    partition: number;
    offset: number;
  }) => void;
}

// Wrapper class for easier mocking
export class ConsumerWrapper {
  private consumer: any;

  constructor(brokers: string, groupId: string) {
    this.consumer = new KafkaConsumer({
      'bootstrap.servers': brokers,
      'group.id': groupId
    });
  }

  subscribe(topics: string[]): void {
    this.consumer.subscribe(topics);
  }

  run(config: { data?: (msg: any) => void }): void {
    this.consumer.run(config);
  }

  getConsumer(): any {
    return this.consumer;
  }
}

export function createConsumer(config: ConsumerConfig): ConsumerWrapper {
  const consumer = new ConsumerWrapper(config.brokers, config.groupId);
  consumer.subscribe(config.topics);

  if (config.handler) {
    consumer.run({
      data: config.handler
    });
  }

  return consumer;
}