import { fetchSatelliteTLEs, tleToEntity } from './client/celestrak-client';
import { createSatellitePublisher } from './publisher';
import { TOPICS } from '@osiris/shared';

const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

async function main() {
  console.log('Starting satellite ingestion service...');
  
  const publisher = createSatellitePublisher({
    brokers: process.env.REDPANDA_BROKERS || 'localhost:9092',
    topic: TOPICS.INGEST_SATELLITE
  });

  let shuttingDown = false;

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down...');
    shuttingDown = true;
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down...');
    shuttingDown = true;
  });

  while (!shuttingDown) {
    try {
      console.log('Fetching satellite TLEs from CelesTrak...');
      
      const tles = await fetchSatelliteTLEs('active');
      console.log(`Fetched ${tles.length} TLEs`);

      const entities = tles.map(tleToEntity);
      
      if (entities.length > 0) {
        await publisher.publish(entities);
        console.log(`Published ${entities.length} satellite entities`);
      }

      console.log(`Next refresh in ${REFRESH_INTERVAL_MS / (60 * 60 * 1000)} hours`);
      await new Promise(resolve => setTimeout(resolve, REFRESH_INTERVAL_MS));
    } catch (error) {
      console.error('Error in satellite ingestion:', error);
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  }

  await publisher.disconnect();
  console.log('Satellite ingestion service stopped.');
}

main().catch(console.error);
