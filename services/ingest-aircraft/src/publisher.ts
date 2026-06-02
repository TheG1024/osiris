     1|import { createProducer, type ProducerConfig } from '@osiris/streaming';
     2|import { GeoEntity } from '@osiris/shared';
     3|
     4|export interface PublisherConfig extends ProducerConfig {
     5|  topic: string;
     6|}
     7|
     8|export function createAircraftPublisher(config: PublisherConfig) {
     9|  const producer = createProducer(config);
    10|
    11|  return {
    12|    async publish(entities: GeoEntity[]): Promise<void> {
    13|      for (const entity of entities) {
    14|        await producer.produce({
    15|          topic: config.topic,
    16|          key: entity.id,
    17|          value: JSON.stringify(entity)
    18|        });
    19|      }
    20|    },
    21|    async disconnect(): Promise<void> {
    22|      await producer.disconnect();
    23|    }
    24|  };
    25|}
    26|