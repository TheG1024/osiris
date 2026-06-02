/**
 * Aircraft Data Ingestion Service
 * Ingests aircraft tracking data from OpenSky Network API
 */

import { logger } from '@osiris/common';

async function main() {
  logger.info('Starting aircraft ingestion service...');
  
  // TODO: Implement main ingestion loop
  logger.info('Aircraft ingestion service initialized');
}

main().catch((error) => {
  logger.error('Fatal error in aircraft ingestion service', error);
  process.exit(1);
});