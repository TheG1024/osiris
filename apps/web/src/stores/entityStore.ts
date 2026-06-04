// OSIRIS Global State Store
// Uses Zustand v5 with better performance and SSR support

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface GeoEntity {
  id: string;
  type: 'aircraft' | 'ship' | 'satellite' | 'weather' | 'camera' | 'event';
  lat: number;
  lon: number;
  altitude?: number;
  heading?: number;
  velocity?: number;
  meta?: Record<string, unknown>;
  lastUpdate: number;
}

export interface Alert {
  id: string;
  type: 'fire' | 'earthquake' | 'conflict' | 'cyber' | 'maritime' | 'air' | 'infrastructure' | 'health';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: { lat: number; lon: number };
  source: string;
  timestamp: number;
}

export interface MapLayer {
  id: string;
  name: string;
  enabled: boolean;
  type: 'points' | 'heat' | 'clusters' | 'arcs' | 'flow';
  color: string;
}

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
}

interface EntityStore {
  // Entities by type
  entities: Record<string, GeoEntity[]>;
  selectedEntity: GeoEntity | null;
  hoveredEntity: GeoEntity | null;
  
  // Alerts
  alerts: Alert[];
  alertFilters: Record<string, boolean>;
  
  // Map layers
  layers: MapLayer[];
  activeLayers: Record<string, boolean>;
  
  // View state
  viewState: ViewState;
  projection: 'mercator' | 'globe';
  mapStyle: 'dark' | 'satellite' | 'street';
  
  // UI state
  sidebarOpen: boolean;
  activePanel: 'alerts' | 'layers' | 'intel' | 'markets' | 'scm' | 'search' | null;
  isDemoMode: boolean;
  
  // Connection state
  wsConnected: boolean;
  lastDataUpdate: number;
  
  // Actions
  setEntities: (type: string, entities: GeoEntity[]) => void;
  addEntity: (type: string, entity: GeoEntity) => void;
  removeEntity: (type: string, id: string) => void;
  selectEntity: (entity: GeoEntity | null) => void;
  hoverEntity: (entity: GeoEntity | null) => void;
  
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  dismissAlert: (id: string) => void;
  setAlertFilter: (type: string, enabled: boolean) => void;
  
  setLayer: (layer: MapLayer) => void;
  toggleLayer: (id: string) => void;
  
  setViewState: (view: Partial<ViewState>) => void;
  setProjection: (proj: 'mercator' | 'globe') => void;
  setMapStyle: (style: 'dark' | 'satellite' | 'street') => void;
  
  toggleSidebar: () => void;
  setActivePanel: (panel: EntityStore['activePanel']) => void;
  setDemoMode: (enabled: boolean) => void;
  
  setWsConnected: (connected: boolean) => void;
  updateDataTimestamp: () => void;
}

export const useEntityStore = create<EntityStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    entities: {
      aircraft: [],
      ship: [],
      satellite: [],
      weather: [],
      camera: [],
      event: [],
    },
    selectedEntity: null,
    hoveredEntity: null,
    
    alerts: [],
    alertFilters: {
      fire: true,
      earthquake: true,
      conflict: true,
      cyber: true,
      maritime: true,
      air: true,
      infrastructure: true,
      health: true,
    },
    
    layers: [
      { id: 'aircraft', name: 'Aircraft', enabled: true, type: 'points', color: '#00ff88' },
      { id: 'ships', name: 'Maritime', enabled: true, type: 'points', color: '#00aaff' },
      { id: 'satellites', name: 'Satellites', enabled: true, type: 'points', color: '#ffaa00' },
      { id: 'fires', name: 'Fires', enabled: true, type: 'heat', color: '#ff4400' },
      { id: 'earthquakes', name: 'Earthquakes', enabled: true, type: 'clusters', color: '#ff0044' },
      { id: 'conflict', name: 'Conflict Zones', enabled: true, type: 'arcs', color: '#ff0000' },
      { id: 'cameras', name: 'CCTV Feeds', enabled: false, type: 'points', color: '#aa00ff' },
      { id: 'flightPaths', name: 'Flight Paths', enabled: false, type: 'flow', color: '#00ff88' },
    ],
    activeLayers: {},
    
    viewState: {
      longitude: 0,
      latitude: 20,
      zoom: 2,
      pitch: 45,
      bearing: 0,
    },
    projection: 'globe',
    mapStyle: 'dark',
    
    sidebarOpen: true,
    activePanel: null,
    isDemoMode: true,
    
    wsConnected: false,
    lastDataUpdate: 0,
    
    // Actions
    setEntities: (type, entities) => set((state) => ({
      entities: { ...state.entities, [type]: entities }
    })),
    
    addEntity: (type, entity) => set((state) => ({
      entities: {
        ...state.entities,
        [type]: [...(state.entities[type] || []), entity]
      }
    })),
    
    removeEntity: (type, id) => set((state) => ({
      entities: {
        ...state.entities,
        [type]: (state.entities[type] || []).filter(e => e.id !== id)
      }
    })),
    
    selectEntity: (entity) => set({ selectedEntity: entity }),
    hoverEntity: (entity) => set({ hoveredEntity: entity }),
    
    setAlerts: (alerts) => set({ alerts }),
    addAlert: (alert) => set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 500) // Keep last 500
    })),
    dismissAlert: (id) => set((state) => ({
      alerts: state.alerts.filter(a => a.id !== id)
    })),
    setAlertFilter: (type, enabled) => set((state) => ({
      alertFilters: { ...state.alertFilters, [type]: enabled }
    })),
    
    setLayer: (layer) => set((state) => ({
      layers: state.layers.map(l => l.id === layer.id ? layer : l)
    })),
    toggleLayer: (id) => set((state) => ({
      activeLayers: { ...state.activeLayers, [id]: !state.activeLayers[id] }
    })),
    
    setViewState: (view) => set((state) => ({
      viewState: { ...state.viewState, ...view }
    })),
    setProjection: (projection) => set({ projection }),
    setMapStyle: (mapStyle) => set({ mapStyle }),
    
    toggleSidebar: () => set((state) => ({
      sidebarOpen: !state.sidebarOpen
    })),
    setActivePanel: (activePanel) => set({ activePanel }),
    setDemoMode: (isDemoMode) => set({ isDemoMode }),
    
    setWsConnected: (wsConnected) => set({ wsConnected }),
    updateDataTimestamp: () => set({ lastDataUpdate: Date.now() }),
  }))
);

// Selectors for performance
export const selectEntitiesByType = (type: string) => 
  (state: EntityStore) => state.entities[type] || [];

export const selectActiveAlerts = () => 
  (state: EntityStore) => {
    const { alerts, alertFilters } = state;
    return alerts.filter(a => alertFilters[a.type]);
  };

export const selectVisibleLayers = () =>
  (state: EntityStore) => state.layers.filter(l => state.activeLayers[l.id] !== false);