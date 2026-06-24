import { GeoEntity } from '@osiris/shared';
import { upsertEntities, insertPosition, EntityInput } from '@osiris/db';

/**
 * Direct-to-DB writer for aircraft. Replaces the Redpanda publisher.
 * ponytail: one INSERT ON CONFLICT + per-row position write per tick.
 *           Cap positions to the first N to avoid hammering the DB on big ticks.
 */
export interface DbWriter {
  write(entities: GeoEntity[]): Promise<{ upserted: number; positions: number }>;
}

const POSITION_LOG_CAP = parseInt(process.env.POSITION_LOG_CAP || '500', 10);

export function createDbWriter(): DbWriter {
  return {
    async write(entities: GeoEntity[]) {
      if (entities.length === 0) return { upserted: 0, positions: 0 };

      const inputs: EntityInput[] = entities.map((e) => ({
        entityType: 'aircraft',
        sourceId: e.id,
        name: (e.metadata?.callsign as string) || e.id.toUpperCase(),
        description: `${(e.metadata?.country as string) || 'unknown'} (${e.id})`,
        latitude: e.lat,
        longitude: e.lon,
        altitude: e.altitude,
        status: e.metadata?.onGround ? 'ground' : 'airborne',
        metadata: {
          velocity: e.velocity,
          heading: e.heading,
          callsign: e.metadata?.callsign,
          country: e.metadata?.country,
          onGround: e.metadata?.onGround,
          lastContact: e.timestamp,
        },
      }));

      const upserted = await upsertEntities(inputs);

      // Time-series samples — cap to keep DB writes bounded.
      const samples = upserted.slice(0, POSITION_LOG_CAP);
      for (const row of samples) {
        const src = entities.find((e) => e.id === row.sourceId);
        if (!src) continue;
        await insertPosition({
          entityId: row.id,
          entityType: row.entityType,
          sourceId: row.sourceId,
          latitude: src.lat,
          longitude: src.lon,
          altitude: src.altitude,
          velocity: src.velocity,
          heading: src.heading,
          time: new Date(src.timestamp),
        });
      }
      return { upserted: upserted.length, positions: samples.length };
    },
  };
}
