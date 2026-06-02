import { createConsumer, type ConsumerConfig } from '@osiris/streaming';
import { indexPosition } from './h3-index';
import { insertEntity } from '@osiris/db';
import { GeoEntity } from '@osiris/shared';

export interface ProcessingConfig extends ConsumerConfig {
  writeToDb: boolean;
}

export function createStreamProcessor(config: ProcessingConfig) {
  const consumer = createConsumer({
    brokers: config.brokers,
    groupId: config.groupId,
    topics: config.topics
  });

  let processedCount = 0;
  let errorCount = 0;

  const handler = async (message: any) => {
    try {
      const entity: GeoEntity = JSON.parse(message.value);
      
      // Add H3 index to metadata
      const h3Index = indexPosition(entity.lat, entity.lon);
      entity.metadata = {
        ...entity.metadata,
        h3Index,
        h3Resolution: 7
      };

      if (config.writeToDb) {
        await insertEntity({
          entityType: entity.type,
          name: entity.id,
          latitude: entity.lat,
          longitude: entity.lon,
          altitude: entity.altitude,
          status: 'active',
          metadata: entity.metadata as any
        });
      }

      processedCount++;
      if (processedCount % 1000 === 0) {
        console.log(`Processed ${processedCount} entities, ${errorCount} errors`);
      }
    } catch (error) {
      errorCount++;
      console.error('Error processing message:', error);
    }
  };

  consumer.run({ data: handler });

  return {
    getStats() {
      return { processed: processedCount, errors: errorCount };
    },
    async shutdown() {
      console.log(`Stream processor shutting down. Processed: ${processedCount}, Errors: ${errorCount}`);
      // Would disconnect consumer here
    }
  };
}
