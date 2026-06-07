'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useEntityStore } from '@/stores/entityStore';
import { osirisApi } from '@/lib/api-client';
import { 
  Layers, 
  BarChart3, 
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
  Settings,
  HelpCircle,
  Maximize2,
  Minimize2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Zap,
  Target,
  Radio
} from 'lucide-react';
import clsx from 'clsx';

// Dynamic imports for heavy components
const OsirisMap = dynamic(() => import('@/components/OsirisMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-osiris-bg grid-tactical">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 border border-osiris-accent/20 rounded-full animate-ping" />
          <div className="absolute inset-2 border border-osiris-accent/30 rounded-full" />
          <div className="absolute inset-4 border border-osiris-accent/40 rounded-full animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Globe className="w-10 h-10 text-osiris-accent animate-pulse" />
          </div>
        </div>
        <div className="font-mono text-xs text-osiris-accent tracking-[0.3em] uppercase animate-pulse">
          Initializing Map...
        </div>
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
    setEntities,
    setAlerts,
    setWsConnected,
    alerts,
    entities,
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
        console.log('[Page] Starting data load...');
        const data = await osirisApi.fetchAllData();
        console.log('[Page] Data received:', data);
        
        const flights = Array.isArray(data.flights) ? data.flights : [];
        const ships = Array.isArray(data.ships) ? data.ships : [];
        const satellites = Array.isArray(data.satellites) ? data.satellites : [];
        const fires = Array.isArray(data.fires) ? data.fires : [];
        const earthquakes = Array.isArray(data.earthquakes) ? data.earthquakes : [];
        
        setEntities('aircraft', flights);
        console.log('[Page] Set flights:', flights.length);
        setEntities('ship', ships);
        console.log('[Page] Set ships:', ships.length);
        setEntities('satellite', satellites);
        console.log('[Page] Set satellites:', satellites.length);
        setEntities('event', [...fires, ...earthquakes]);
        console.log('[Page] Set events:', [...fires, ...earthquakes].length);
        
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
        console.error('[Page] Failed to load data:', error);
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

  // Status for connection
  const isConnected = !isLoading && entityCount > 0;

  return (
    <div className="flex flex-col h-screen bg-osiris-bg text-white overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════
          TOP BAR — Tactical Header
          ═══════════════════════════════════════════════════════════ */}
      <header className="h-14 flex items-center justify-between px-5 border-b glass-panel-active z-50">
        {/* Left: Logo & Status */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-osiris-accent/20 to-osiris-accent/5 border border-osiris-accent/30 flex items-center justify-center">
                <Globe className="w-5 h-5 text-osiris-accent" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-osiris-accent rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold tracking-[0.2em] text-osiris-text uppercase">
                OSIRIS
              </h1>
              <p className="text-[8px] font-mono text-osiris-text-muted uppercase tracking-[0.25em]">
                REDUX
              </p>
            </div>
          </div>
          
          {/* Status Pills */}
          <div className="hidden md:flex items-center gap-3">
            {/* Live Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-osiris-surface/60 border border-osiris-border/50">
              <span className="relative flex h-2 w-2">
                <span className={clsx(
                  "absolute inline-flex h-full w-full rounded-full",
                  isConnected ? "bg-osiris-accent animate-ping" : "bg-osiris-warning"
                )} />
                <span className={clsx(
                  "relative inline-flex rounded-full h-2 w-2",
                  isConnected ? "bg-osiris-accent" : "bg-osiris-warning"
                )} />
              </span>
              <Wifi size={12} className={isConnected ? "text-osiris-accent" : "text-osiris-warning"} />
              <span className="font-mono text-[10px] font-medium tracking-wider text-osiris-text-dim">
                {isLoading ? 'SYNC' : 'LIVE'}
              </span>
            </div>

            {/* Entity Count */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-osiris-surface/60 border border-osiris-border/50">
              <Database size={12} className="text-osiris-aircraft" />
              <span className="font-mono text-[10px] font-medium tracking-wider text-osiris-text-dim">
                {entityCount.toLocaleString()} ENTITIES
              </span>
            </div>

            {/* TLE Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-osiris-surface/60 border border-osiris-border/50">
              <Satellite size={12} className="text-osiris-satellite" />
              <span className="font-mono text-[10px] font-medium tracking-wider text-osiris-text-dim">
                TLE ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Right: Clock & Controls */}
        <div className="flex items-center gap-3">
          {/* UTC Clock */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-osiris-surface/60 border border-osiris-border/50">
            <Clock size={12} className="text-osiris-text-muted" />
            <span className="font-mono text-[11px] text-osiris-text-dim tracking-wider">
              {currentTime.toISOString().split('T')[1].split('.')[0]} UTC
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={toggleFullscreen}
              className="btn-icon"
              title="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            
            <button className="btn-icon" title="Settings">
              <Settings size={16} />
            </button>
            
            <button className="btn-icon" title="Help">
              <HelpCircle size={16} />
            </button>

            {/* Menu Toggle */}
            <button
              onClick={toggleSidebar}
              className={clsx("btn-icon ml-2", sidebarOpen && "active")}
              title="Toggle sidebar"
            >
              {sidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ═══════════════════════════════════════════════════════════
            SIDEBAR PANEL
            ═══════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="border-r glass-panel flex flex-col overflow-hidden z-40"
            >
              {/* Panel Tab Navigation */}
              <div className="flex border-b border-osiris-border/50">
                {panelButtons.map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => setActivePanel(btn.id === activePanel ? null : btn.id)}
                    className={clsx(
                      "flex-1 py-3 flex flex-col items-center gap-1.5 transition-all duration-200 relative",
                      activePanel === btn.id
                        ? "text-osiris-accent bg-osiris-accent/5"
                        : "text-osiris-text-muted hover:text-osiris-text hover:bg-osiris-surface/30"
                    )}
                  >
                    <btn.icon size={18} />
                    <span className="text-[9px] font-mono uppercase tracking-wider">{btn.label}</span>
                    {activePanel === btn.id && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-osiris-accent rounded-full shadow-[0_0_10px_var(--osiris-accent-glow)]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {activePanel === 'alerts' && (
                    <motion.div
                      key="alerts"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="h-full"
                    >
                      <LiveAlerts />
                    </motion.div>
                  )}
                  {activePanel === 'layers' && (
                    <motion.div
                      key="layers"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="h-full"
                    >
                      <LayerPanel />
                    </motion.div>
                  )}
                  {activePanel === 'intel' && (
                    <motion.div
                      key="intel"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="h-full"
                    >
                      <OsintPanel />
                    </motion.div>
                  )}
                  {activePanel === 'markets' && (
                    <motion.div
                      key="markets"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="h-full"
                    >
                      <div className="flex items-center justify-center h-full text-osiris-text-muted">
                        <div className="text-center p-8">
                          <div className="relative mx-auto w-16 h-16 mb-4">
                            <div className="absolute inset-0 border border-osiris-accent/20 rounded-full" />
                            <div className="absolute inset-2 border border-osiris-accent/30 rounded-full animate-ping opacity-50" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <BarChart3 size={24} className="text-osiris-text-muted" />
                            </div>
                          </div>
                          <p className="text-sm font-mono uppercase tracking-wider text-osiris-text-dim">Markets Panel</p>
                          <p className="text-xs text-osiris-text-faint mt-2">Integration coming soon</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {activePanel === 'scm' && (
                    <motion.div
                      key="scm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="h-full"
                    >
                      <div className="flex items-center justify-center h-full text-osiris-text-muted">
                        <div className="text-center p-8">
                          <div className="relative mx-auto w-16 h-16 mb-4">
                            <div className="absolute inset-0 border border-osiris-accent/20 rounded-full" />
                            <div className="absolute inset-2 border border-osiris-accent/30 rounded-full animate-pulse" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <MapPinned size={24} className="text-osiris-text-muted" />
                            </div>
                          </div>
                          <p className="text-sm font-mono uppercase tracking-wider text-osiris-text-dim">Supply Chain</p>
                          <p className="text-xs text-osiris-text-faint mt-2">Integration coming soon</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {!activePanel && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center h-full text-osiris-text-muted"
                    >
                      <div className="text-center">
                        <div className="relative mx-auto w-20 h-20 mb-4">
                          <Radar className="w-full h-full text-osiris-accent/20" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Target size={20} className="text-osiris-accent/40" />
                          </div>
                        </div>
                        <p className="text-sm font-mono uppercase tracking-wider text-osiris-text-dim">Select a panel</p>
                        <p className="text-xs text-osiris-text-faint mt-2">Click a tab above to view</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════
            MAP AREA
            ═══════════════════════════════════════════════════════════ */}
        <main className="flex-1 relative bg-osiris-bg-deep">
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
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-osiris-bg/90 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <div className="text-center">
                  {/* Radar Animation */}
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 border-2 border-osiris-accent/20 rounded-full" />
                    <div className="absolute inset-2 border-2 border-osiris-accent/30 rounded-full" />
                    <div className="absolute inset-4 border-2 border-osiris-accent/40 rounded-full" />
                    <div className="absolute inset-6 border border-osiris-accent rounded-full" />
                    <div 
                      className="absolute inset-0 border border-osiris-accent/60 rounded-full"
                      style={{
                        animation: 'radar-sweep 2s linear infinite'
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-osiris-accent" />
                    </div>
                  </div>
                  <div className="font-display text-sm tracking-[0.3em] text-osiris-accent uppercase animate-pulse">
                    Initializing Osiris
                  </div>
                  <div className="mt-2 font-mono text-xs text-osiris-text-muted">
                    Loading telemetry data
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BOTTOM STATUS BAR — Tactical Footer
          ═══════════════════════════════════════════════════════════ */}
      <footer className="h-10 flex items-center justify-between px-5 border-t glass-panel text-[10px]">
        {/* Left: Coordinates */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-osiris-text-muted">LAT</span>
            <span className="text-osiris-accent font-medium">{mouseCoords.lat.toFixed(4)}°</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-osiris-text-muted">LON</span>
            <span className="text-osiris-accent font-medium">{mouseCoords.lng.toFixed(4)}°</span>
          </div>
        </div>

        {/* Center: Version */}
        <div className="flex items-center gap-2 font-mono text-osiris-text-faint">
          <Radio size={10} className="text-osiris-accent/50" />
          <span>OSIRIS v1.0.0</span>
        </div>

        {/* Right: Status */}
        <div className="flex items-center gap-4">
          {/* Zoom Level */}
          <div className="flex items-center gap-2 font-mono text-osiris-text-muted">
            <span>Z</span>
            <span className="text-osiris-accent">{viewState.zoom.toFixed(1)}</span>
          </div>

          {/* Projection */}
          <div className="font-mono text-osiris-text-faint">
            EPSG:4326
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <span className={clsx(
              "status-dot",
              isConnected ? "online" : "warning"
            )} />
            <span className={clsx(
              "font-mono uppercase tracking-wider",
              isConnected ? "text-osiris-accent" : "text-osiris-warning"
            )}>
              {isConnected ? 'Connected' : 'Demo'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}