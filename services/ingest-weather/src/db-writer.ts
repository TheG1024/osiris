import { GeoEntity } from '@osiris/shared';
import { upsertEntities, insertPosition, EntityInput } from '@osiris/db';

const POSITION_LOG_CAP = parseInt(process.env.POSITION_LOG_CAP || '100', 10);

export interface DbWriter {
  write(entities: GeoEntity[]): Promise<{ upserted: number; positions: number }>;
}

export function createDbWriter(): DbWriter {
  return {
    async write(entities) {
      if (entities.length === 0) return { upserted: 0, positions: 0 };
      const inputs: EntityInput[] = entities.map((e) => ({
        entityType: 'weather',
        sourceId: e.id,
        name: e.id,
        latitude: e.lat,
        longitude: e.lon,
        altitude: e.altitude ?? 0,
        status: 'active',
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
          time: new Date(src.timestamp),
        });
      }
      return { upserted: upserted.length, positions: samples.length };
    },
  };
}