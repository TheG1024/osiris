'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useEntityStore } from '@/stores/entityStore';
import { osirisApi } from '@/lib/api-client';
import { 
  Layers, 
  BarChart3, 
  Newspaper, 
  Search, 
  X, 
  Globe, 
  MapPinned, 
  Radar, 
  Satellite, 
  Moon, 
  ExternalLink, 
  AlertTriangle, 
  Activity, 
  Database, 
  Wifi, 
  Play,
  Menu,
  Settings,
  HelpCircle,
  Maximize2,
  Minimize2,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import clsx from 'clsx';

// Dynamic imports for heavy components
const OsirisMap = dynamic(() => import('@/components/OsirisMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="text-green-400 flex items-center gap-2">
        <Activity className="animate-spin" size={20} />
        <span className="font-mono text-sm">INITIALIZING MAP...</span>
      </div>
    </div>
  )
});

const LiveAlerts = dynamic(() => import('@/components/LiveAlerts'), { ssr: false });
const LayerPanel = dynamic(() => import('@/components/LayerPanel'), { ssr: false });
const OsintPanel = dynamic(() => import('@/components/OsintPanel'), { ssr: false });

type Panel = 'alerts' | 'layers' | 'intel' | 'markets' | 'scm' | 'search' | null;

export default function Home() {
  const { 
    sidebarOpen, 
    toggleSidebar, 
    activePanel, 
    setActivePanel,
    isDemoMode,
    setEntities,
    setAlerts,
    setWsConnected,
    alerts,
    entities,
    activeLayers,
    viewState,
  } = useEntityStore();

  const [mouseCoords, setMouseCoords] = useState({ lat: 0, lng: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Update clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch all data in parallel
        const data = await osirisApi.fetchAllData();
        
        // Set entities from API response
        const flights = Array.isArray(data.flights) ? data.flights : [];
        const ships = Array.isArray(data.ships) ? data.ships : [];
        const satellites = Array.isArray(data.satellites) ? data.satellites : [];
        const fires = Array.isArray(data.fires) ? data.fires : [];
        const earthquakes = Array.isArray(data.earthquakes) ? data.earthquakes : [];
        
        setEntities('aircraft', flights);
        setEntities('ship', ships);
        setEntities('satellite', satellites);
        setEntities('event', [...fires, ...earthquakes]);
        
        // Convert to alerts
        const newAlerts = [
          ...(fires.map((f: any) => ({
            id: `fire-${Date.now()}-${Math.random()}`,
            type: 'fire' as const,
            severity: 'high' as const,
            title: 'Fire Detected',
            description: f.description || 'Active fire hotspot detected',
            location: { lat: f.lat || 0, lon: f.lon || 0 },
            source: 'OSIRIS',
            timestamp: Date.now(),
          }))),
          ...(earthquakes.map((e: any) => ({
            id: `eq-${Date.now()}-${Math.random()}`,
            type: 'earthquake' as const,
            severity: 'medium' as const,
            title: `M ${e.magnitude || 4.0} Earthquake`,
            description: e.description || 'Seismic activity detected',
            location: { lat: e.lat || 0, lon: e.lon || 0 },
            source: 'USGS',
            timestamp: Date.now() - 3600000,
          }))),
        ];
        setAlerts(newAlerts);
        
        setWsConnected(true);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [setEntities, setAlerts, setWsConnected]);

  // Panel buttons
  const panelButtons: Array<{ id: Panel; icon: React.ElementType; label: string }> = [
    { id: 'alerts', icon: AlertTriangle, label: 'Alerts' },
    { id: 'layers', icon: Layers, label: 'Layers' },
    { id: 'intel', icon: Search, label: 'Intel' },
    { id: 'markets', icon: BarChart3, label: 'Markets' },
    { id: 'scm', icon: MapPinned, label: 'Supply' },
  ];

  const handleEntityClick = useCallback((entity: any) => {
    console.log('Entity clicked:', entity);
    // Could fly to location or show detail
  }, []);

  const handleMouseCoords = useCallback((coords: { lat: number; lng: number }) => {
    setMouseCoords(coords);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Count active entities
  const entityCount = Object.values(entities).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      {/* Top Bar */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-green-500/20 bg-gray-900/80 backdrop-blur z-50">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
              <Globe size={18} className="text-black" />
            </div>
            <span className="font-bold text-lg tracking-wider text-green-400">OSIRIS</span>
            <span className="text-xs text-gray-500 font-mono">REDUX</span>
          </div>
          
          {/* Status indicators */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-green-400">
              <Wifi size={12} className={isLoading ? 'animate-pulse' : ''} />
              <span className="font-mono">{isLoading ? 'SYNC' : 'LIVE'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-400">
              <Database size={12} />
              <span className="font-mono">{entityCount} ENTITIES</span>
            </div>
            <div className="flex items-center gap-1.5 text-orange-400">
              <Satellite size={12} />
              <span className="font-mono">TLE ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Clock */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
            <Clock size={12} />
            {currentTime.toISOString().split('T')[1].split('.')[0]} UTC
          </div>
          
          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          
          {/* Settings */}
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Settings size={16} />
          </button>
          
          {/* Help */}
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <HelpCircle size={16} />
          </button>
          
          {/* Menu toggle */}
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel Sidebar */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-green-500/20 bg-gray-900/90 backdrop-blur flex flex-col overflow-hidden"
            >
              {/* Panel Tabs */}
              <div className="flex border-b border-green-500/20">
                {panelButtons.map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => setActivePanel(btn.id === activePanel ? null : btn.id)}
                    className={clsx(
                      "flex-1 p-2 flex flex-col items-center gap-1 text-xs transition-colors",
                      activePanel === btn.id
                        ? "text-green-400 bg-green-500/10"
                        : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                    )}
                  >
                    <btn.icon size={16} />
                    <span className="text-[10px]">{btn.label}</span>
                  </button>
                ))}
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-hidden">
                {activePanel === 'alerts' && <LiveAlerts />}
                {activePanel === 'layers' && <LayerPanel />}
                {activePanel === 'intel' && <OsintPanel />}
                {activePanel === 'markets' && (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Markets Panel</p>
                      <p className="text-xs text-gray-600 mt-1">Coming soon</p>
                    </div>
                  </div>
                )}
                {activePanel === 'scm' && (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <MapPinned size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Supply Chain</p>
                      <p className="text-xs text-gray-600 mt-1">Coming soon</p>
                    </div>
                  </div>
                )}
                {!activePanel && (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Radar size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Select a panel</p>
                      <p className="text-xs text-gray-600 mt-1">Click a tab above</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Map Area */}
        <main className="flex-1 relative">
          <OsirisMap
            onEntityClick={handleEntityClick}
            onMouseCoords={handleMouseCoords}
          />
          
          {/* Loading Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-900/80 backdrop-blur flex items-center justify-center z-50"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Globe size={48} className="text-green-400 mx-auto" />
                  </motion.div>
                  <div className="mt-4 font-mono text-green-400 text-sm">INITIALIZING OSIRIS...</div>
                  <div className="mt-2 text-xs text-gray-500">Loading telemetry data</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-8 flex items-center justify-between px-4 border-t border-green-500/20 bg-gray-900/80 backdrop-blur text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <span>Lat:</span>
            <span className="font-mono text-green-400">{mouseCoords.lat.toFixed(4)}</span>
            <span>Lon:</span>
            <span className="font-mono text-green-400">{mouseCoords.lng.toFixed(4)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="font-mono">Z{viewState.zoom.toFixed(1)}</span>
            <span>•</span>
            <span>EPSG:4326</span>
          </div>
          <div className="flex items-center gap-1.5 text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="font-mono">CONNECTED</span>
          </div>
        </div>
      </footer>
    </div>
  );
}