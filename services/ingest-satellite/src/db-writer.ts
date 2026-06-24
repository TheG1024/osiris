import { GeoEntity } from '@osiris/shared';
import { upsertEntities, insertPosition, EntityInput } from '@osiris/db';

/**
 * Direct-to-DB writer for satellites. Same shape as aircraft writer.
 * ponytail: CelesTrak returns thousands of TLEs; cap with SAT_LIMIT.
 */
export interface DbWriter {
  write(entities: GeoEntity[]): Promise<{ upserted: number; positions: number }>;
}

const POSITION_LOG_CAP = parseInt(process.env.POSITION_LOG_CAP || '200', 10);

export function createDbWriter(): DbWriter {
  return {
    async write(entities) {
      if (entities.length === 0) return { upserted: 0, positions: 0 };
      const inputs: EntityInput[] = entities.map((e) => ({
        entityType: 'satellite',
        sourceId: e.id,
        name: e.id,
        latitude: e.lat,
        longitude: e.lon,
        altitude: e.altitude, // already in km when propagated
        status: 'tracked',
        metadata: e.metadata,
      }));
      const upserted = await upsertEntities(inputs);
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
          time: new Date(src.timestamp),
        });
      }
      return { upserted: upserted.length, positions: samples.length };
    },
  };
}
