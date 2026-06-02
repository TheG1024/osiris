import { describe, it, expect, expectTypeOf } from 'vitest';
import { insertEntity, getEntity, getEntitiesByType, getEntitiesInRadius } from './entity-repository';
import type { Entity, EntityInput } from './entity-repository';

describe('Entity Repository', () => {
  it('should have insertEntity function exported', () => {
    expect(insertEntity).toBeDefined();
    expectTypeOf(insertEntity).toBeFunction();
  });

  it('should have getEntity function exported', () => {
    expect(getEntity).toBeDefined();
    expectTypeOf(getEntity).toBeFunction();
  });

  it('should have getEntitiesByType function exported', () => {
    expect(getEntitiesByType).toBeDefined();
    expectTypeOf(getEntitiesByType).toBeFunction();
  });

  it('should have getEntitiesInRadius function exported', () => {
    expect(getEntitiesInRadius).toBeDefined();
    expectTypeOf(getEntitiesInRadius).toBeFunction();
  });

  it('insertEntity should accept entity data with required fields', () => {
    // Type check: EntityInput should have required fields
    const testEntity: EntityInput = {
      entityType: 'sensor',
      name: 'Test Sensor',
      latitude: 40.7128,
      longitude: -74.0060
    };
    
    expectTypeOf(testEntity).toMatchTypeOf<EntityInput>();
    expectTypeOf(insertEntity).parameter(0).toMatchTypeOf<EntityInput>();
  });

  it('getEntity should return Entity or undefined', () => {
    // Type check: getEntity returns Promise<Entity | undefined>
    expectTypeOf(getEntity).returns.toEqualTypeOf<Promise<Entity | undefined>>();
    expectTypeOf(getEntity).parameter(0).toBeString();
  });

  it('getEntitiesByType should accept entityType and return Entity[]', () => {
    // Type check: returns Promise<Entity[]>
    expectTypeOf(getEntitiesByType).returns.toEqualTypeOf<Promise<Entity[]>>();
    expectTypeOf(getEntitiesByType).parameter(0).toBeString();
  });

  it('getEntitiesInRadius should accept lat, lon, radiusKm and return Entity[]', () => {
    // Type check: accepts coordinates and radius, returns Promise<Entity[]>
    expectTypeOf(getEntitiesInRadius).returns.toEqualTypeOf<Promise<Entity[]>>();
    expectTypeOf(getEntitiesInRadius).parameter(0).toBeNumber();
    expectTypeOf(getEntitiesInRadius).parameter(1).toBeNumber();
    expectTypeOf(getEntitiesInRadius).parameter(2).toBeNumber();
  });
});