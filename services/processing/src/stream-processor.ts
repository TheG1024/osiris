import { createConsumer, type ConsumerConfig } from '@osiris/streaming';
import { indexPosition } from './h3-index';
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
        // Stub: would call insertEntity from @osiris/db
        // await insertEntity({...});
        console.log('Would write to DB');
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

  // Start the consumer loop in the background; errors are caught and logged
  // inside the handler so the run() promise resolves immediately.
  consumer.consume(async (payload) => {
    const message: any = payload.message;
    await handler(message);
  }).catch((err) => {
    console.error('Consumer loop failed:', err);
  });

  return {
    getStats() {
      return { processed: processedCount, errors: errorCount };
    },
    async shutdown() {
      console.log(`Stream processor shutting down. Processed: ${processedCount}, Errors: ${errorCount}`);
      try {
        await consumer.disconnect();
      } catch (err) {
        console.error('Error disconnecting consumer:', err);
      }
    }
  };
}
