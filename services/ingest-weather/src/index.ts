import { fetchMETARData, metarToEntity } from './client/noaa-metar-client';
import { createDbWriter } from './db-writer';

const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || String(5 * 60 * 1000), 10);
const HOURS = parseInt(process.env.HOURS || '1', 10);
const STATION_LIMIT = parseInt(process.env.STATION_LIMIT || '500', 10);

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  console.log(`Starting weather ingestion (hours=${HOURS} limit=${STATION_LIMIT} poll=${POLL_INTERVAL_MS}ms)`);

  const writer = createDbWriter();
  let shuttingDown = false;

  process.on('SIGTERM', () => { console.log('SIGTERM'); shuttingDown = true; });
  process.on('SIGINT', () => { console.log('SIGINT'); shuttingDown = true; });

  while (!shuttingDown) {
    try {
      const metars = await fetchMETARData(undefined, HOURS);
      const slice = metars.slice(0, STATION_LIMIT);
      const entities = slice.map(metarToEntity);
      if (entities.length > 0) {
        const { upserted, positions } = await writer.write(entities);
        console.log(`[weather] upserted=${upserted} positions=${positions}`);
      } else {
        console.log('[weather] no METAR returned');
      }
    } catch (error) {
      console.error('[weather] tick failed:', (error as Error).message);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  console.log('weather ingestion stopped');
}

main().catch((e) => { console.error('fatal:', e); process.exit(1); });