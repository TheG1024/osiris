     1|import { fetchAircraftData } from './client/opensky-client';
     2|import { createAircraftPublisher } from './publisher';
     3|import { TOPICS } from '@osiris/shared';
     4|
     5|const POLL_INTERVAL_MS = 10000; // 10 seconds
     6|const BROKERS = process.env.REDPANDA_BROKERS || 'localhost:9092';
     7|
     8|async function main() {
     9|  console.log('Starting aircraft ingestion service...');
    10|  
    11|  const publisher = createAircraftPublisher({
    12|    brokers: BROKERS,
    13|    topic: TOPICS.INGEST_AIRCRAFT
    14|  });
    15|
    16|  let shuttingDown = false;
    17|
    18|  process.on('SIGTERM', () => {
    19|    console.log('Received SIGTERM, shutting down gracefully...');
    20|    shuttingDown = true;
    21|  });
    22|
    23|  process.on('SIGINT', () => {
    24|    console.log('Received SIGINT, shutting down gracefully...');
    25|    shuttingDown = true;
    26|  });
    27|
    28|  while (!shuttingDown) {
    29|    try {
    30|      const startTime = Date.now();
    31|      console.log('Fetching aircraft data from OpenSky...');
    32|      
    33|      const entities = await fetchAircraftData();
    34|      console.log(`Fetched ${entities.length} aircraft`);
    35|
    36|      if (entities.length > 0) {
    37|        await publisher.publish(entities);
    38|        console.log(`Published ${entities.length} entities to ${TOPICS.INGEST_AIRCRAFT}`);
    39|      }
    40|
    41|      const elapsed = Date.now() - startTime;
    42|      const waitTime = Math.max(0, POLL_INTERVAL_MS - elapsed);
    43|      
    44|      if (waitTime > 0) {
    45|        await new Promise(resolve => setTimeout(resolve, waitTime));
    46|      }
    47|    } catch (error) {
    48|      console.error('Error in ingestion loop:', error);
    49|      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    50|    }
    51|