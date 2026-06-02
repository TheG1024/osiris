import { Kafka, Producer as KafkaProducer } from 'kafkajs';

export interface ProducerConfig {
  brokers: string;
  clientId?: string;
}

export interface ProduceMessage {
  topic: string;
  key?: string;
  value: string;
  partition?: number;
}

// Wrapper class for easier testing
export class ProducerWrapper {
  private producer: KafkaProducer;

  constructor(config: ProducerConfig) {
    const brokers = config.brokers.split(',').map(b => b.trim());
    const kafka = new Kafka({
      clientId: config.clientId ?? 'osiris-streaming',
      brokers,
    });
    this.producer = kafka.producer();
  }

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }

  async produce(message: ProduceMessage): Promise<void> {
    const msg: any = {
      topic: message.topic,
      messages: [
        {
          value: message.value,
        } as any,
      ],
    };
    
    if (message.key) msg.messages[0].key = message.key;
    if (typeof message.partition === 'number') msg.messages[0].partition = message.partition;
    
    await this.producer.send(msg);
  }

  async sendBatch(messages: ProduceMessage[]): Promise<void> {
    // Group by topic
    const byTopic = new Map<string, ProduceMessage[]>();
    for (const msg of messages) {
      if (!byTopic.has(msg.topic)) {
        byTopic.set(msg.topic, []);
      }
      byTopic.get(msg.topic)!.push(msg);
    }

    // Send each topic batch
    for (const [topic, msgs] of byTopic) {
      const sendMsg: any = {
        topic,
        messages: msgs.map(m => {
          const msg: any = { value: m.value };
          if (m.key) msg.key = m.key;
          if (typeof m.partition === 'number') msg.partition = m.partition;
          return msg;
        }),
      };
      await this.producer.send(sendMsg);
    }
  }
}


// Alias for backwards compatibility
export const Producer = createProducer;

export function createProducer(config: ProducerConfig): ProducerWrapper {
  return new ProducerWrapper(config);
}