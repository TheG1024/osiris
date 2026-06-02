import { fetchAircraftData } from './client/opensky-client';
import { createAircraftPublisher } from './publisher';
import { TOPICS } from '@osiris/shared';

const POLL_INTERVAL_MS = 10000; // 10 seconds
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
      const startTime = Date.now();
      console.log('Fetching aircraft data from OpenSky...');
      
      const entities = await fetchAircraftData();
      console.log(`Fetched ${entities.length} aircraft`);

      if (entities.length > 0) {
        await publisher.publish(entities);
        console.log(`Published ${entities.length} entities to ${TOPICS.INGEST_AIRCRAFT}`);
      }

      const elapsed = Date.now() - startTime;
      const waitTime = Math.max(0, POLL_INTERVAL_MS - elapsed);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    } catch (error) {
      console.error('Error in ingestion loop:', error);
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  await publisher.disconnect();
  console.log('Aircraft ingestion service stopped.');
}

main().catch(console.error);
