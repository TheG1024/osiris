import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EntityType = 'satellite' | 'flight' | 'ship';

export interface PinnedEntity {
  id: string;
  type: EntityType;
  data: any;
  pinnedAt: number;
}

interface PinnedEntitiesState {
  entities: PinnedEntity[];
  maxPinned: number;
  
  // Actions
  pinEntity: (entity: PinnedEntity) => boolean;
  unpinEntity: (id: string) => void;
  clearAll: () => void;
  getEntityCount: () => number;
}

export const usePinnedEntities = create<PinnedEntitiesState>()(
  persist(
    (set, get) => ({
      entities: [],
      maxPinned: 6,

      pinEntity: (entity) => {
        const { entities, maxPinned } = get();
        
        // Check if already pinned
        if (entities.some(e => e.id === entity.id && e.type === entity.type)) {
          return false;
        }
        
        // Check if at max capacity
        if (entities.length >= maxPinned) {
          // Remove oldest entry
          const updated = [...entities.slice(1), { ...entity, pinnedAt: Date.now() }];
          set({ entities: updated });
          return true;
        }
        
        // Add new entity
        set({ entities: [...entities, { ...entity, pinnedAt: Date.now() }] });
        return true;
      },

      unpinEntity: (id) => {
        const { entities } = get();
        set({ entities: entities.filter(e => e.id !== id) });
      },

      clearAll: () => {
        set({ entities: [] });
      },

      getEntityCount: () => {
        return get().entities.length;
      },
    }),
    {
      name: 'osiris-pinned-entities',
    }
  )
);

// Helper to get unique entity ID based on type
export function getEntityId(type: EntityType, data: any): string {
  switch (type) {
    case 'satellite':
      return data.noradId || data.name || '';
    case 'flight':
      return data.icao24 || data.callsign || '';
    case 'ship':
      return data.mmsi || data.name || '';
    default:
      return '';
  }
}

// Helper to get entity display name
export function getEntityDisplayName(type: EntityType, data: any): string {
  switch (type) {
    case 'satellite':
      return data.name || 'Unknown Satellite';
    case 'flight':
      return data.callsign || 'Unknown Flight';
    case 'ship':
      return data.name || 'Unknown Ship';
    default:
      return 'Unknown Entity';
  }
}

// Helper to get entity color based on type
export function getEntityColor(type: EntityType): string {
  switch (type) {
    case 'satellite':
      return '#D4AF37'; // Gold
    case 'flight':
      return '#00FFB4'; // Cyan
    case 'ship':
      return '#4FC3F7'; // Blue
    default:
      return '#FFFFFF';
  }
}

// Helper to get entity icon based on type
export function getEntityIcon(type: EntityType): string {
  switch (type) {
    case 'satellite':
      return '🛰️';
    case 'flight':
      return '✈️';
    case 'ship':
      return '🚢';
    default:
      return '📍';
  }
}