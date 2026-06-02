import { fetchAircraftData } from './client/opensky-client';
import { createAircraftPublisher } from './publisher';
import { TOPICS } from '@osiris/shared';

const POLL_INTERVAL_MS = 10000;
const BROKERS = process.env.REDPANDA_BROKERS || 'localhost:9092';

async function main() {
  console.log('Starting aircraft ingestion service...');
  
  const publisher = createAircraftPublisher({
    brokers: BROKERS,
    topic: TOPICS.INGEST_AIRCRAFT
  });

  let shuttingDown = false;

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    shuttingDown = true;
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    shuttingDown = true;
  });

  while (!shuttingDown) {
    try {
      const entities = await fetchAircraftData();
      if (entities.length > 0) {
        await publisher.publish(entities);
        console.log(`Published ${entities.length} aircraft`);
      }
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    } catch (error) {
      console.error('Error fetching aircraft data:', error);
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  await publisher.disconnect();
}

main().catch(console.error);
