import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type GeofenceType = 'circle' | 'polygon';
export type EntityType = 'flight' | 'ship' | 'satellite';

export interface Geofence {
  id: string;
  name: string;
  type: GeofenceType;
  center?: { lat: number; lon: number }; // For circles
  radius?: number; // In meters, for circles
  coordinates?: Array<[number, number]>; // For polygons
  watchTypes: EntityType[];
  active: boolean;
  createdAt: number;
}

export interface Alert {
  id: string;
  geofenceId: string;
  geofenceName: string;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  timestamp: number;
  lat: number;
  lon: number;
  dismissed: boolean;
}

interface GeofenceState {
  geofences: Geofence[];
  alerts: Alert[];
  
  // Actions
  addGeofence: (geofence: Omit<Geofence, 'id' | 'createdAt'>) => string;
  updateGeofence: (id: string, updates: Partial<Geofence>) => void;
  removeGeofence: (id: string) => void;
  toggleGeofence: (id: string) => void;
  
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'dismissed'>) => void;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
  
  getActiveGeofences: () => Geofence[];
  getActiveAlerts: () => Alert[];
}

export const useGeofenceStore = create<GeofenceState>()(
  persist(
    (set, get) => ({
      geofences: [],
      alerts: [],

      addGeofence: (geofence) => {
        const id = `geo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newGeofence: Geofence = {
          ...geofence,
          id,
          createdAt: Date.now(),
        };
        set(state => ({ geofences: [...state.geofences, newGeofence] }));
        return id;
      },

      updateGeofence: (id, updates) => {
        set(state => ({
          geofences: state.geofences.map(g => 
            g.id === id ? { ...g, ...updates } : g
          ),
        }));
      },

      removeGeofence: (id) => {
        set(state => ({
          geofences: state.geofences.filter(g => g.id !== id),
          alerts: state.alerts.filter(a => a.geofenceId !== id),
        }));
      },

      toggleGeofence: (id) => {
        set(state => ({
          geofences: state.geofences.map(g =>
            g.id === id ? { ...g, active: !g.active } : g
          ),
        }));
      },

      addAlert: (alert) => {
        const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newAlert: Alert = {
          ...alert,
          id,
          timestamp: Date.now(),
          dismissed: false,
        };
        set(state => ({ alerts: [newAlert, ...state.alerts].slice(0, 100) }));
      },

      dismissAlert: (id) => {
        set(state => ({
          alerts: state.alerts.map(a =>
            a.id === id ? { ...a, dismissed: true } : a
          ),
        }));
      },

      clearAlerts: () => {
        set({ alerts: [] });
      },

      getActiveGeofences: () => {
        return get().geofences.filter(g => g.active);
      },

      getActiveAlerts: () => {
        return get().alerts.filter(a => !a.dismissed);
      },
    }),
    {
      name: 'osiris-geofences',
    }
  )
);

// Geofence type colors
export const GEOFENCE_COLORS = {
  fill: [212, 175, 55, 20],   // Gold with 20 opacity
  stroke: [212, 175, 55, 255], // Gold solid
};

// Helper to generate random geofence ID
export function generateGeofenceId(): string {
  return `geo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}