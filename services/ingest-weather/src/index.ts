import { fetchMETARData, metarToEntity } from './client/noaa-metar-client';
import { createWeatherPublisher } from './publisher';
import { TOPICS } from '@osiris/shared';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function main() {
  console.log('Starting weather ingestion service...');
  
  const publisher = createWeatherPublisher({
    brokers: process.env.REDPANDA_BROKERS || 'localhost:9092',
    topic: TOPICS.INGEST_WEATHER
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
      console.log('Fetching METAR data from NOAA...');
      
      const metars = await fetchMETARData(undefined, 1);
      console.log(`Fetched ${metars.length} METAR reports`);

      const entities = metars.map(metarToEntity);
      
      if (entities.length > 0) {
        await publisher.publish(entities);
        console.log(`Published ${entities.length} weather entities`);
      }

      console.log(`Next poll in ${POLL_INTERVAL_MS / (60 * 1000)} minutes`);
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    } catch (error) {
      console.error('Error in weather ingestion:', error);
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  }

  await publisher.disconnect();
  console.log('Weather ingestion service stopped.');
}

main().catch(console.error);
