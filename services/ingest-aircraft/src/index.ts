import { fetchAircraftData } from './client/opensky-client';
import { createDbWriter } from './db-writer';

const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '10000', 10);
const BOUNDING_BOX = process.env.BBOX
  ? (process.env.BBOX.split(',').map(Number) as [number, number, number, number])
  : undefined;
// OpenSky /states/all defaults to global; we can scope to a bbox via lamin/lomin/lamax/lomax.

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  console.log(`Starting aircraft ingestion (poll=${POLL_INTERVAL_MS}ms bbox=${BOUNDING_BOX || 'global'})`);

  const writer = createDbWriter();
  let shuttingDown = false;
  let consecutiveErrors = 0;

  process.on('SIGTERM', () => { console.log('SIGTERM'); shuttingDown = true; });
  process.on('SIGINT', () => { console.log('SIGINT'); shuttingDown = true; });

  while (!shuttingDown) {
    try {
      const entities = await fetchAircraftData(...(BOUNDING_BOX || []));
      if (entities.length > 0) {
        const { upserted, positions } = await writer.write(entities);
        console.log(`[aircraft] upserted=${upserted} positions=${positions}`);
      } else {
        console.log('[aircraft] no states returned');
      }
      consecutiveErrors = 0;
    } catch (error) {
      consecutiveErrors++;
      console.error(`[aircraft] tick failed (#${consecutiveErrors}):`, (error as Error).message);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  console.log('aircraft ingestion stopped');
}

main().catch((e) => { console.error('fatal:', e); process.exit(1); });
