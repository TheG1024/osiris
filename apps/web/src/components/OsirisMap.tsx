'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Map, { NavigationControl, FullscreenControl, ScaleControl, GeolocateControl, Marker } from 'react-map-gl/maplibre';
import { useEntityStore, type GeoEntity } from '@/stores/entityStore';
import { computeSolarTerminator } from '@/lib/terminator';
import { motion } from 'framer-motion';
import { Crosshair, Layers, RotateCcw, Globe, Zap, Target } from 'lucide-react';

// Map styles - dark cyber theme
const MAP_STYLES: Record<string, string> = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  satellite: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  street: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
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

  // Entity points
  const getEntityPoints = () => {
    const points: Array<{lat: number; lon: number; id: string; type: string}> = [];
    
    if (activeLayers['aircraft'] !== false) {
      (entities.aircraft || []).forEach(e => points.push({ lat: e.lat, lon: e.lon, id: e.id, type: 'aircraft' }));
    }
    
    if (activeLayers['ships'] !== false) {
      (entities.ship || []).forEach(e => points.push({ lat: e.lat, lon: e.lon, id: e.id, type: 'ship' }));
    }
    
    return points;
  };

  const entityPoints = getEntityPoints();

  return (
    <div className="relative w-full h-full">
      <Map
        {...viewPort}
        projection={projection}
        mapStyle={MAP_STYLES[mapStyle]}
        onMove={handleMove}
        onMouseMove={handleMouseMove}
        reuseMaps
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl position="bottom-left" unit="metric" />
        <GeolocateControl position="top-right" />

        {/* Entity Markers */}
        {entityPoints.map((point, idx) => (
          <Marker
            key={`${point.id}-${idx}`}
            longitude={point.lon}
            latitude={point.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              selectEntity({ id: point.id, type: point.type as any, lat: point.lat, lon: point.lon, lastUpdate: Date.now() });
            }}
          >
            <div 
              className={`w-3 h-3 rounded-full cursor-pointer ${
                point.type === 'aircraft' ? 'bg-green-400 animate-pulse' : 'bg-blue-400'
              }`}
            />
          </Marker>
        ))}
      </Map>

      {/* Map Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={cycleMapStyle}
          className="p-2 bg-gray-900/90 border border-green-500/30 rounded-lg text-green-400 hover:bg-gray-800"
        >
          <Layers size={18} />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setViewPort({ longitude: 0, latitude: 20, zoom: 2 })}
          className="p-2 bg-gray-900/90 border border-green-500/30 rounded-lg text-green-400 hover:bg-gray-800"
        >
          <RotateCcw size={18} />
        </motion.button>
      </div>

      {/* Coordinates Display */}
      <div className="absolute bottom-4 right-4 px-3 py-2 bg-gray-900/90 border border-green-500/30 rounded-lg">
        <div className="flex items-center gap-2 text-xs font-mono text-green-400">
          <Crosshair size={12} />
          <span>{viewPort.latitude.toFixed(4)}°</span>
          <span>{viewPort.longitude.toFixed(4)}°</span>
          <span className="text-gray-500">|</span>
          <span>Z{viewPort.zoom.toFixed(1)}</span>
        </div>
      </div>

      {/* Projection Badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900/80 border border-green-500/30 rounded-full">
        <div className="flex items-center gap-2 text-xs font-mono text-green-400">
          <Globe size={12} />
          <span>{projection.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}