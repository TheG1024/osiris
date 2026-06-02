import { createProducer } from '@osiris/streaming';
import { GeoEntity } from '@osiris/shared';

export function createSatellitePublisher(config: { brokers: string; topic: string }) {
  const producer = createProducer(config);

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
