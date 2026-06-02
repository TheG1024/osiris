import { useEffect, useState } from 'react';
import { create } from 'zustand';
import type { GeoEntity } from '@osiris/shared';

interface EntityStore {
  entities: GeoEntity[];
  selectedEntity: GeoEntity | null;
  setEntities: (entities: GeoEntity[]) => void;
  selectEntity: (entity: GeoEntity | null) => void;
}

export const useEntityStore = create<EntityStore>((set) => ({
  entities: [],
  selectedEntity: null,
  setEntities: (entities) => set({ entities }),
  selectEntity: (entity) => set({ selectedEntity: entity })
}));

export default function StatsPanel() {
  const entities = useEntityStore(state => state.entities);

  const stats = {
    total: entities.length,
    aircraft: entities.filter(e => e.type === 'aircraft').length,
    satellite: entities.filter(e => e.type === 'satellite').length,
    ship: entities.filter(e => e.type === 'ship').length,
    weather: entities.filter(e => e.type === 'weather').length
  };

  return (
    <div className="absolute bottom-4 left-4 w-80 bg-gray-900/95 backdrop-blur p-4 rounded-lg shadow-xl text-white">
      <h3 className="text-lg font-bold mb-3">Statistics</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-800/50 p-2 rounded">
          <div className="text-gray-400">Total</div>
          <div className="text-xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-gray-800/50 p-2 rounded">
          <div className="text-gray-400">Aircraft</div>
          <div className="text-xl font-bold">{stats.aircraft}</div>
        </div>
        <div className="bg-gray-800/50 p-2 rounded">
          <div className="text-gray-400">Satellites</div>
          <div className="text-xl font-bold">{stats.satellite}</div>
        </div>
        <div className="bg-gray-800/50 p-2 rounded">
          <div className="text-gray-400">Ships</div>
          <div className="text-xl font-bold">{stats.ship}</div>
        </div>
        <div className="bg-gray-800/50 p-2 rounded col-span-2">
          <div className="text-gray-400">Weather</div>
          <div className="text-xl font-bold">{stats.weather}</div>
        </div>
      </div>
    </div>
  );
}
