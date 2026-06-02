import { Producer } from '@confluentinc/kafka-javascript';

export interface ProducerConfig {
  brokers: string;
}

export interface ProduceMessage {
  topic: string;
  key?: string;
  value: string;
  partition?: number;
}

// Wrapper class for easier testing
export class ProducerWrapper {
  private producer: any;

  constructor(brokers: string) {
    this.producer = new Producer({
      'bootstrap.servers': brokers
    });
  }

  async produce(message: ProduceMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      this.producer.produce(
        message.topic,
        message.partition ?? -1,
        message.value,
        message.key ?? null,
        Date.now(),
        (err: any, data: any) => {
          if (err) reject(err);
          else resolve(data);
        }
      );
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      this.producer.disconnect(() => resolve());
    });
  }

  getProducer(): any {
    return this.producer;
  }
}

export function createProducer(config: ProducerConfig): ProducerWrapper {
  return new ProducerWrapper(config.brokers);
}