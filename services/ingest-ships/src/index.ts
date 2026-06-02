import { AisStreamClient } from './client/aisstream-client';
import { GeoEntity } from '@osiris/shared';
import { createShipsPublisher } from './publisher';
import { TOPICS } from '@osiris/shared';

async function main() {
  console.log('Starting ships ingestion service...');
  
  const apiKey = process.env.AISSTREAM_API_KEY;
  if (!apiKey) {
    console.error('AISSTREAM_API_KEY not set. Exiting.');
    process.exit(1);
  }

  const publisher = createShipsPublisher({
    brokers: process.env.REDPANDA_BROKERS || 'localhost:9092',
    topic: TOPICS.INGEST_SHIPS
  });

  const client = new AisStreamClient(/* apiKey */);

  let shuttingDown = false;

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down...');
    shuttingDown = true;
    client.disconnect();
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down...');
    shuttingDown = true;
    client.disconnect();
  });

  try {
    await client.connect();
    console.log('Listening for AIS messages...');

    client.on('message', async (entity: GeoEntity) => {
      await publisher.publish([entity]);
    });

    // Keep process running
    while (!shuttingDown) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('AISStream error:', error);
  } finally {
    await publisher.disconnect();
    console.log('Ships ingestion service stopped.');
  }
}

main().catch(console.error);
