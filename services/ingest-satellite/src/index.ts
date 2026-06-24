import { fetchSatelliteTLEs, tleToEntity } from './client/celestrak-client';
import { createDbWriter } from './db-writer';

const REFRESH_INTERVAL_MS = parseInt(process.env.REFRESH_INTERVAL_MS || String(6 * 60 * 60 * 1000), 10);
const CATEGORY = process.env.CATEGORY || 'active';
const SAT_LIMIT = parseInt(process.env.SAT_LIMIT || '500', 10);

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  console.log(`Starting satellite ingestion (category=${CATEGORY} limit=${SAT_LIMIT} refresh=${REFRESH_INTERVAL_MS}ms)`);

  const writer = createDbWriter();
  let shuttingDown = false;

  process.on('SIGTERM', () => { console.log('SIGTERM'); shuttingDown = true; });
  process.on('SIGINT', () => { console.log('SIGINT'); shuttingDown = true; });

  while (!shuttingDown) {
    try {
      const tles = await fetchSatelliteTLEs(CATEGORY);
      const tleSlice = tles.slice(0, SAT_LIMIT);
      const entities = tleSlice.map(tleToEntity);
      if (entities.length > 0) {
        const { upserted, positions } = await writer.write(entities);
        console.log(`[satellite] upserted=${upserted} positions=${positions}`);
      } else {
        console.log('[satellite] no TLEs propagated to entities');
      }
    } catch (error) {
      console.error('[satellite] tick failed:', (error as Error).message);
    }
    await new Promise((r) => setTimeout(r, REFRESH_INTERVAL_MS));
  }
  console.log('satellite ingestion stopped');
}

main().catch((e) => { console.error('fatal:', e); process.exit(1); });
