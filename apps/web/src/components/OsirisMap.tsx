'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Map, { NavigationControl, FullscreenControl, ScaleControl, GeolocateControl, Marker } from 'react-map-gl/maplibre';
import { useEntityStore, type GeoEntity } from '@/stores/entityStore';
import { motion } from 'framer-motion';
import { Crosshair, Layers, RotateCcw, Globe, Target, Plane, Ship, Satellite, Zap } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

// Map styles
const MAP_STYLES: Record<string, string> = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  satellite: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  street: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
};

// Entity type colors matching design system
const ENTITY_COLORS = {
  aircraft: { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)', label: 'Aircraft' },
  ship: { color: '#22d3ee', glow: 'rgba(34, 211, 238, 0.5)', label: 'Ship' },
  satellite: { color: '#f97316', glow: 'rgba(249, 115, 22, 0.5)', label: 'Satellite' },
  camera: { color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.5)', label: 'Camera' },
};

interface OsirisMapProps {
  onEntityClick?: (entity: GeoEntity) => void;
  onMouseCoords?: (coords: { lat: number; lng: number }) => void;
}

export default function OsirisMap({ onEntityClick, onMouseCoords }: OsirisMapProps) {
  const { 
    entities, 
    activeLayers, 
    viewState, 
    setViewState,
    projection, 
    mapStyle,
    setMapStyle,
    selectEntity,
    selectedEntity,
  } = useEntityStore();

  const [viewPort, setViewPort] = useState({
    longitude: viewState.longitude,
    latitude: viewState.latitude,
    zoom: viewState.zoom,
  });

  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);

  // Handle view state changes
  const handleMove = useCallback((evt: any) => {
    setViewPort(evt.viewState);
    setViewState({
      longitude: evt.viewState.longitude,
      latitude: evt.viewState.latitude,
      zoom: evt.viewState.zoom,
    });
  }, [setViewState]);

  // Handle mouse move for coordinates
  const handleMouseMove = useCallback((evt: any) => {
    if (evt.lngLat && onMouseCoords) {
      onMouseCoords({ lat: evt.lngLat.lat, lng: evt.lngLat.lng });
    }
  }, [onMouseCoords]);

  // Cycle map styles
  const cycleMapStyle = useCallback(() => {
    setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark');
  }, [mapStyle, setMapStyle]);

  // Reset view
  const resetView = useCallback(() => {
    setViewPort({ longitude: 20, latitude: 0, zoom: 2 });
    setViewState({ longitude: 20, latitude: 0, zoom: 2 });
  }, [setViewState]);

  // Entity points
  const getEntityPoints = () => {
    const points: Array<{lat: number; lon: number; id: string; type: string}> = [];
    
    if (activeLayers['aircraft'] !== false) {
      (entities.aircraft || []).forEach(e => points.push({ lat: e.lat, lon: e.lon, id: e.id, type: 'aircraft' }));
    }
    
    if (activeLayers['ships'] !== false) {
      (entities.ship || []).forEach(e => points.push({ lat: e.lat, lon: e.lon, id: e.id, type: 'ship' }));
    }

    if (activeLayers['satellites'] !== false) {
      (entities.satellite || []).forEach(e => points.push({ lat: e.lat, lon: e.lon, id: e.id, type: 'satellite' }));
    }
    
    return points;
  };

  const entityPoints = getEntityPoints();

  // Get entity icon based on type
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'aircraft':
        return <Plane size={10} className="text-cyan-400" />;
      case 'ship':
        return <Ship size={10} className="text-cyan-300" />;
      case 'satellite':
        return <Satellite size={10} className="text-orange-400" />;
      default:
        return <Zap size={10} className="text-green-400" />;
    }
  };

  // Get entity color
  const getEntityColor = (type: string) => {
    return ENTITY_COLORS[type as keyof typeof ENTITY_COLORS] || ENTITY_COLORS.aircraft;
  };

  return (
    <div className="relative w-full h-full bg-osiris-bg grid-tactical">
      <Map
        {...viewPort}
        projection={projection}
        mapStyle={MAP_STYLES[mapStyle]}
        onMove={handleMove}
        onMouseMove={handleMouseMove}
        reuseMaps
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* Map Controls - styled to match design system */}
        <NavigationControl position="top-right" showCompass={true} showZoom={true} />
        <FullscreenControl position="top-right" />
        <ScaleControl position="bottom-left" unit="metric" />

        {/* Entity Markers */}
        {entityPoints.map((point, idx) => {
          const entityColor = getEntityColor(point.type);
          const isSelected = selectedEntity?.id === point.id;
          const isHovered = hoveredEntity === point.id;
          
          return (
            <Marker
              key={`${point.id}-${idx}`}
              longitude={point.lon}
              latitude={point.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                selectEntity({ id: point.id, type: point.type as any, lat: point.lat, lon: point.lon, lastUpdate: Date.now() });
                onEntityClick?.({ id: point.id, type: point.type as any, lat: point.lat, lon: point.lon, lastUpdate: Date.now() });
              }}
            >
              <div 
                className="relative cursor-pointer"
                onMouseEnter={() => setHoveredEntity(point.id)}
                onMouseLeave={() => setHoveredEntity(null)}
              >
                {/* Glow effect for selected/hovered */}
                {(isSelected || isHovered) && (
                  <div 
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ 
                      backgroundColor: entityColor.glow,
                      animationDuration: '2s',
                    }}
                  />
                )}
                
                {/* Marker dot */}
                <div 
                  className={`
                    relative flex items-center justify-center rounded-full border-2
                    transition-all duration-200
                    ${isSelected ? 'scale-150' : isHovered ? 'scale-125' : 'scale-100'}
                  `}
                  style={{ 
                    width: isSelected || isHovered ? 16 : 12,
                    height: isSelected || isHovered ? 16 : 12,
                    backgroundColor: `${entityColor.color}33`,
                    borderColor: entityColor.color,
                    boxShadow: `0 0 ${isSelected ? 15 : 8}px ${entityColor.glow}`,
                  }}
                >
                  <div 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: entityColor.color }}
                  />
                </div>

                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-osiris-surface-elevated border border-osiris-border text-[9px] font-mono whitespace-nowrap z-[9999]">
                    <div className="flex items-center gap-1.5">
                      {getEntityIcon(point.type)}
                      <span className="text-osiris-text">{entityColor.label}</span>
                      <span className="text-osiris-text-muted">#{point.id.slice(0, 6)}</span>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-osiris-border" />
                  </div>
                )}
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* ═══════════════════════════════════════════════════════════
          MAP CONTROLS OVERLAY
          ═══════════════════════════════════════════════════════════ */}
      
      {/* Left Controls */}
      <div className="absolute top-20 left-4 flex flex-col gap-2 z-10">
        {/* Layer Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={cycleMapStyle}
          className="group relative"
          title="Toggle map style"
        >
          <div className="p-2.5 glass-panel border-osiris-border rounded-lg hover:border-osiris-accent/50 transition-all">
            <Layers size={18} className="text-osiris-text-dim group-hover:text-osiris-accent transition-colors" />
          </div>
        </motion.button>
        
        {/* Reset View */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetView}
          className="group"
          title="Reset view"
        >
          <div className="p-2.5 glass-panel border-osiris-border rounded-lg hover:border-osiris-accent/50 transition-all">
            <RotateCcw size={18} className="text-osiris-text-dim group-hover:text-osiris-accent transition-colors" />
          </div>
        </motion.button>
      </div>

      {/* Center Projection Badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-2 px-4 py-1.5 glass-panel rounded-full border-osiris-border">
          <div className="w-2 h-2 rounded-full bg-osiris-accent animate-pulse" />
          <Globe size={12} className="text-osiris-accent" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-osiris-text-dim">
            {projection.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Entity Count Legend */}
      {entityPoints.length > 0 && (
        <div className="absolute bottom-16 left-4 z-10">
          <div className="glass-panel rounded-lg border-osiris-border p-3">
            <div className="text-[9px] font-mono uppercase tracking-wider text-osiris-text-muted mb-2">
              Active Entities
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-osiris-aircraft" />
                <span className="text-[10px] font-mono text-osiris-text-dim">
                  {(entities.aircraft || []).length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-osiris-ship" />
                <span className="text-[10px] font-mono text-osiris-text-dim">
                  {(entities.ship || []).length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-osiris-satellite" />
                <span className="text-[10px] font-mono text-osiris-text-dim">
                  {(entities.satellite || []).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}