// OSIRIS Global State Store
// Uses Zustand v5 with persist middleware for localStorage persistence

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// View state type
interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
  transitionDuration?: number;
}

export interface GeoEntity {
  id: string;
  type: 'aircraft' | 'ship' | 'satellite' | 'event';
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
  type: string;
  visible: boolean;
  color?: string;
}

interface EntityStore {
  // Layers - for LayerPanel
  layers: MapLayer[];
  
  // Entities by type
  entities: {
    aircraft: GeoEntity[];
    ship: GeoEntity[];
    satellite: GeoEntity[];
    event: GeoEntity[];
  };
  
  // Map state
  activeLayers: Record<string, boolean>;
  viewState: ViewState;
  projection: 'mercator' | 'globe';
  mapStyle: 'dark' | 'satellite' | 'street';
  
  // Selected entity
  selectedEntity: GeoEntity | null;
  
  // UI state
  sidebarOpen: boolean;
  activePanel: 'alerts' | 'layers' | 'intel' | 'markets' | 'scm' | 'search' | null;
  
  // Alerts
  alerts: Alert[];
  alertFilters: Record<string, boolean>;
  
  // Connection state
  wsConnected: boolean;
  
  // Actions - Layer setters
  setLayers: (layers: MapLayer[]) => void;
  toggleLayer: (id: string) => void;
  setLayer: (id: string, visible: boolean) => void;
  
  // Actions - Entity setters
  setEntities: (type: 'aircraft' | 'ship' | 'satellite' | 'event', entities: GeoEntity[]) => void;
  
  // Actions - Layer and view setters
  setActiveLayers: (layers: Record<string, boolean>) => void;
  setViewState: (view: Partial<ViewState>) => void;
  setProjection: (projection: 'mercator' | 'globe') => void;
  setMapStyle: (mapStyle: 'dark' | 'satellite' | 'street') => void;
  
  // Actions - Entity selection
  selectEntity: (entity: GeoEntity | null) => void;
  setSelectedEntity: (entity: GeoEntity | null) => void;
  
  // Actions - UI setters
  toggleSidebar: () => void;
  setActivePanel: (panel: EntityStore['activePanel']) => void;
  
  // Actions - Alert setters
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  dismissAlert: (id: string) => void;
  setAlertFilter: (filter: string, visible: boolean) => void;
  
  // Actions - Connection
  setWsConnected: (connected: boolean) => void;
}

export const useEntityStore = create<EntityStore>()(
  persist(
    (set) => ({
      // Initial state
      layers: [
        { id: 'aircraft', name: 'Aircraft', type: 'aircraft', visible: true, color: '#06b6d4' },
        { id: 'ships', name: 'Ships', type: 'ship', visible: true, color: '#22d3ee' },
        { id: 'satellites', name: 'Satellites', type: 'satellite', visible: true, color: '#f97316' },
        { id: 'fires', name: 'Fires', type: 'event', visible: true, color: '#ef4444' },
        { id: 'earthquakes', name: 'Earthquakes', type: 'event', visible: true, color: '#a855f7' },
      ],
      
      entities: {
        aircraft: [],
        ship: [],
        satellite: [],
        event: [],
      },
      
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
      
      selectedEntity: null,
      
      sidebarOpen: true,
      activePanel: null,
      
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
      
      wsConnected: false,
      
      // Actions - Entity setters
      setEntities: (type, entities) => set((state) => ({
        entities: { ...state.entities, [type]: entities }
      })),
      
      // Actions - Layer and view setters
      setActiveLayers: (activeLayers) => set({ activeLayers }),
      setViewState: (view) => set((state) => ({
        viewState: { ...state.viewState, ...view }
      })),
      setProjection: (projection) => set({ projection }),
      setMapStyle: (mapStyle) => set({ mapStyle }),
      
      // Actions - Entity selection
      selectEntity: (entity) => set({ selectedEntity: entity }),
      setSelectedEntity: (entity) => set({ selectedEntity: entity }),
      
      // Actions - UI setters
      toggleSidebar: () => set((state) => ({
        sidebarOpen: !state.sidebarOpen
      })),
      setActivePanel: (activePanel) => set({ activePanel }),
      
      // Actions - Alert setters
      setAlerts: (alerts) => set({ alerts }),
      addAlert: (alert) => set((state) => ({
        alerts: [alert, ...state.alerts].slice(0, 500)
      })),
      dismissAlert: (id) => set((state) => ({
        alerts: state.alerts.filter(a => a.id !== id)
      })),
      setAlertFilter: (filter, visible) => set((state) => ({
        alertFilters: { ...state.alertFilters, [filter]: visible }
      })),
      
      // Actions - Connection
      setWsConnected: (wsConnected) => set({ wsConnected }),
      
      // Actions - Layer setters
      setLayers: (layers) => set({ layers }),
      toggleLayer: (id) => set((state) => ({
        layers: state.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
      })),
      setLayer: (id, visible) => set((state) => ({
        layers: state.layers.map(l => l.id === id ? { ...l, visible } : l)
      })),
    }),
    {
      name: 'osiris-entity-store',
      partialize: (state) => ({
        entities: state.entities,
        activeLayers: state.activeLayers,
        viewState: state.viewState,
        projection: state.projection,
        mapStyle: state.mapStyle,
        sidebarOpen: state.sidebarOpen,
        activePanel: state.activePanel,
      }),
    }
  )
);