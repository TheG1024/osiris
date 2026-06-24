// ponytail: Redpanda publisher is no longer wired in src/index.ts.
// Ingestion now writes directly to Postgres via db-writer.ts.
// Kept here for the future "fan-out to analytics" case.
import { createProducer } from '@osiris/streaming';
import { GeoEntity } from '@osiris/shared';

export interface PublisherConfig {
  brokers: string;
  topic: string;
}

export function createAircraftPublisher(config: PublisherConfig) {
  const producer = createProducer({ brokers: config.brokers });

  return {
    async publish(entities: GeoEntity[]): Promise<void> {
      for (const entity of entities) {
        await producer.produce({
          topic: config.topic,
          key: entity.id,
          value: JSON.stringify(entity)
        });
      }
    },
    async disconnect(): Promise<void> {
      await producer.disconnect();
    }
  };
}