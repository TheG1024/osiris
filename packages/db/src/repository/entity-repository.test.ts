import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  upsertEntity,
  upsertEntities,
  insertPosition,
  getEntity,
  getEntitiesByType,
  getEntitiesInRadius,
} from './entity-repository';
import type { Entity, EntityInput, PositionInput } from './entity-repository';

describe('Entity Repository', () => {
  it('exports upsert helpers', () => {
    expect(upsertEntity).toBeDefined();
    expectTypeOf(upsertEntity).toBeFunction();
    expect(upsertEntities).toBeDefined();
    expectTypeOf(upsertEntities).toBeFunction();
    expect(insertPosition).toBeDefined();
    expectTypeOf(insertPosition).toBeFunction();
  });

  it('exports read helpers', () => {
    expect(getEntity).toBeDefined();
    expect(getEntity).toBeTypeOf('function');
    expect(getEntitiesByType).toBeDefined();
    expect(getEntitiesInRadius).toBeDefined();
  });

  it('EntityInput requires entityType, sourceId, name, lat, lon', () => {
    const e: EntityInput = {
      entityType: 'aircraft',
      sourceId: 'abc123',
      name: 'UAL123',
      latitude: 40.7,
      longitude: -74.0,
    };
    expectTypeOf(e).toMatchTypeOf<EntityInput>();
  });

  it('PositionInput shape', () => {
    const p: PositionInput = {
      entityId: '00000000-0000-0000-0000-000000000000',
      entityType: 'aircraft',
      sourceId: 'abc123',
      latitude: 40.7,
      longitude: -74.0,
    };
    expectTypeOf(p).toMatchTypeOf<PositionInput>();
  });

  it('getEntity returns Promise<Entity | undefined>', () => {
    expectTypeOf(getEntity).returns.toEqualTypeOf<Promise<Entity | undefined>>();
    expectTypeOf(getEntity).parameter(0).toBeString();
  });

  it('getEntitiesByType(entityType) returns Promise<Entity[]>', () => {
    expectTypeOf(getEntitiesByType).returns.toEqualTypeOf<Promise<Entity[]>>();
    expectTypeOf(getEntitiesByType).parameter(0).toBeString();
  });

  it('getEntitiesInRadius(lat, lon, radiusKm) returns Promise<Entity[]>', () => {
    expectTypeOf(getEntitiesInRadius).returns.toEqualTypeOf<Promise<Entity[]>>();
    expectTypeOf(getEntitiesInRadius).parameter(0).toBeNumber();
    expectTypeOf(getEntitiesInRadius).parameter(1).toBeNumber();
    expectTypeOf(getEntitiesInRadius).parameter(2).toBeNumber();
  });
});
