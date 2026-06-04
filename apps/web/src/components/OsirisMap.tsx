'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import Map, { 
  Source, 
  Layer, 
  NavigationControl, 
  FullscreenControl,
  ScaleControl,
  GeolocateControl,
  Marker,
  Popup,
  Atmosphere,
  Fog
} from 'react-map-gl/maplibre';
import { useEntityStore, type GeoEntity, type Alert } from '@/stores/entityStore';
import { computeSolarTerminator } from '@/lib/satellite-tracker';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crosshair, 
  Maximize2, 
  Minimize2, 
  Layers, 
  RotateCcw,
  Globe,
  Navigation,
  Target,
  Zap
} from 'lucide-react';
import clsx from 'clsx';

// Map styles - dark cyber theme
const MAP_STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  satellite: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  street: 'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json',
};

// Layer paint configurations
const LAYER_STYLES = {
  aircraft: {
    type: 'circle' as const,
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        2, 3,
        8, 6,
        15, 10
      ],
      'circle-color': '#00ff88',
      'circle-stroke-width': 1,
      'circle-stroke-color': '#00ff88',
      'circle-opacity': 0.9,
    }
  },
  ships: {
    type: 'circle' as const,
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        2, 2,
        8, 5,
        15, 8
      ],
      'circle-color': '#00aaff',
      'circle-stroke-width': 1,
      'circle-stroke-color': '#00aaff',
      'circle-opacity': 0.8,
    }
  },
  satellites: {
    type: 'circle' as const,
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        2, 4,
        8, 8,
        15, 12
      ],
      'circle-color': '#ffaa00',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffaa00',
      'circle-opacity': 1,
      'circle-pitch-alignment': 'map' as const,
    }
  },
  fires: {
    type: 'heatmap' as const,
    paint: {
      'heatmap-weight': 1,
      'heatmap-intensity': [
        'interpolate', ['linear'], ['zoom'],
        0, 0.5,
        9, 1
      ],
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0,0,0,0)',
        0.2, 'rgba(255,255,0,0.3)',
        0.4, 'rgba(255,127,0,0.5)',
        0.6, 'rgba(255,0,0,0.7)',
        0.8, 'rgba(255,0,127,0.9)',
        1, 'rgba(255,0,0,1)'
      ],
      'heatmap-radius': [
        'interpolate', ['linear'], ['zoom'],
        0, 10,
        9, 30,
        15, 80
      ],
      'heatmap-opacity': 0.7,
    }
  },
  earthquakes: {
    type: 'circle' as const,
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        2, 4,
        8, 10,
        15, 20
      ],
      'circle-color': [
        'interpolate', ['linear'], ['get', 'magnitude'],
        3, '#ffaa00',
        5, '#ff4400',
        7, '#ff0000',
      ],
      'circle-opacity': 0.7,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
    }
  },
  cameras: {
    type: 'circle' as const,
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        2, 2,
        8, 4,
        15, 8
      ],
      'circle-color': '#aa00ff',
      'circle-stroke-width': 1,
      'circle-stroke-color': '#aa00ff',
      'circle-opacity': 0.6,
    }
  },
  flightPaths: {
    type: 'line' as const,
    paint: {
      'line-color': '#00ff88',
      'line-width': 2,
      'line-opacity': 0.5,
      'line-dasharray': [2, 2],
    }
  },
  conflict: {
    type: 'line' as const,
    paint: {
      'line-color': '#ff0000',
      'line-width': 3,
      'line-opacity': 0.8,
      'line-blur': 2,
    }
  },
  terminator: {
    type: 'line' as const,
    paint: {
      'line-color': 'rgba(255,255,255,0.3)',
      'line-width': 1,
      'line-dasharray': [4, 4],
    }
  }
};

interface OsirisMapProps {
  onEntityClick?: (entity: GeoEntity) => void;
  onMouseCoords?: (coords: { lat: number; lng: number }) => void;
  onRightClick?: (coords: { lat: number; lng: number }) => void;
  flyToLocation?: { lat: number; lng: number; ts: number } | null;
}

// Memoized for performance
const _OsirisMap = memo(function OsirisMap({
  onEntityClick,
  onMouseCoords,
  onRightClick,
  flyToLocation,
}: OsirisMapProps) {
  const mapRef = useRef<maplibregl.Map>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
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
    hoveredEntity,
    hoverEntity,
    alerts,
  } = useEntityStore();

  const [viewPort, setViewPort] = useState({
    longitude: viewState.longitude,
    latitude: viewState.latitude,
    zoom: viewState.zoom,
    pitch: viewState.pitch || 45,
    bearing: viewState.bearing || 0,
  });

  const [terminatorLine, setTerminatorLine] = useState<GeoJSON.LineString | null>(null);
  const [showTerminator, setShowTerminator] = useState(true);

  // Compute solar terminator periodically
  useEffect(() => {
    const updateTerminator = () => {
      const points = computeSolarTerminator();
      setTerminatorLine({
        type: 'LineString',
        coordinates: points,
      });
    };
    
    updateTerminator();
    const interval = setInterval(updateTerminator, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  // Fly to location when triggered
  useEffect(() => {
    if (flyToLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [flyToLocation.lng, flyToLocation.lat],
        zoom: 8,
        duration: 2000,
      });
    }
  }, [flyToLocation]);

  // Handle view state changes
  const handleMove = useCallback((evt: { viewState: typeof viewPort }) => {
    setViewPort(evt.viewState);
    setViewState({
      longitude: evt.viewState.longitude,
      latitude: evt.viewState.latitude,
      zoom: evt.viewState.zoom,
      pitch: evt.viewState.pitch,
      bearing: evt.viewState.bearing,
    });
  }, [setViewState]);

  // Handle mouse move for coordinates
  const handleMouseMove = useCallback((evt: maplibregl.MapMouseEvent) => {
    if (evt.lngLat && onMouseCoords) {
      onMouseCoords({ lat: evt.lngLat.lat, lng: evt.lngLat.lng });
    }
  }, [onMouseCoords]);

  // Handle right click
  const handleRightClick = useCallback((evt: maplibregl.MapMouseEvent) => {
    if (evt.lngLat && onRightClick) {
      onRightClick({ lat: evt.lngLat.lat, lng: evt.lngLat.lng });
    }
  }, [onRightClick]);

  // Handle entity click
  const handleClick = useCallback((evt: maplibregl.MapMouseEvent) => {
    const features = mapRef.current?.queryRenderedFeatures(evt.point);
    if (features && features.length > 0) {
      const feature = features[0];
      if (feature.properties) {
        const entity: GeoEntity = {
          id: feature.properties.id || feature.properties.name || 'unknown',
          type: (feature.properties.type as GeoEntity['type']) || 'event',
          lat: feature.geometry.type === 'Point' ? (feature.geometry.coordinates as [number, number])[1] : 0,
          lon: feature.geometry.type === 'Point' ? (feature.geometry.coordinates as [number, number])[0] : 0,
          lastUpdate: Date.now(),
        };
        selectEntity(entity);
        onEntityClick?.(entity);
      }
    }
  }, [selectEntity, onEntityClick]);

  // Map style switcher
  const cycleMapStyle = useCallback(() => {
    const styles: Array<'dark' | 'satellite' | 'street'> = ['dark', 'satellite', 'street'];
    const currentIndex = styles.indexOf(mapStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    setMapStyle(styles[nextIndex]);
  }, [mapStyle, setMapStyle]);

  // Convert entities to GeoJSON
  const getGeoJSON = useCallback((type: string) => {
    const entityList = entities[type] || [];
    return {
      type: 'FeatureCollection' as const,
      features: entityList.map(entity => ({
        type: 'Feature' as const,
        properties: { 
          id: entity.id, 
          type: entity.type,
          ...entity.meta,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [entity.lon, entity.lat],
        },
      })),
    };
  }, [entities]);

  // Get visible layers
  const visibleLayers = Object.entries(activeLayers).filter(([_, v]) => v !== false);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewPort}
        projection={projection}
        mapStyle={MAP_STYLES[mapStyle]}
        onMove={handleMove}
        onMouseMove={handleMouseMove}
        onContextMenu={handleRightClick}
        onClick={handleClick}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
        fog={projection === 'globe' ? {
          'range': [0.8, 8],
          'color': 'rgb(10,10,20)',
          'horizon-blend': 0.1,
        } : undefined}
        atmosphere={projection === 'globe' ? {
          'high-color': 'rgb(20,20,40)',
          'low-color': 'rgb(10,10,20)',
          'horizon-blend': 0.05,
          'space-color': 'rgb(0,0,10)',
          'star-intensity': 0.15,
        } : undefined}
        attributionControl={false}
        reuseMaps
        renderWorldCopies={false}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl position="bottom-left" unit="metric" />
        <GeolocateControl position="top-right" trackUserLocation />

        {/* Solar terminator line */}
        {showTerminator && projection === 'globe' && terminatorLine && (
          <Source
            id="terminator"
            type="geojson"
            data={terminatorLine}
          >
            <Layer
              id="terminator-line"
              {...LAYER_STYLES.terminator}
            />
          </Source>
        )}

        {/* Layer sources */}
        {visibleLayers.map(([layerId]) => {
          const geojson = getGeoJSON(layerId);
          if (geojson.features.length === 0) return null;
          
          return (
            <Source
              key={layerId}
              id={layerId}
              type="geojson"
              data={geojson}
            >
              <Layer
                id={`${layerId}-points`}
                {...LAYER_STYLES[layerId as keyof typeof LAYER_STYLES]}
              />
            </Source>
          );
        })}

        {/* Alerts as a heatmap layer */}
        {alerts.length > 0 && (
          <Source
            id="alerts-source"
            type="geojson"
            data={{
              type: 'FeatureCollection' as const,
              features: alerts.map(alert => ({
                type: 'Feature' as const,
                properties: { magnitude: alert.severity === 'critical' ? 5 : alert.severity === 'high' ? 3 : 1 },
                geometry: {
                  type: 'Point' as const,
                  coordinates: [alert.location.lon, alert.location.lat],
                },
              })),
            }}
          >
            <Layer
              id="alerts-heat"
              {...LAYER_STYLES.fires}
            />
          </Source>
        )}

        {/* Popup for selected entity */}
        <AnimatePresence>
          {selectedEntity && (
            <Popup
              longitude={selectedEntity.lon}
              latitude={selectedEntity.lat}
              anchor="bottom"
              onClose={() => selectEntity(null)}
              closeButton={false}
              className="osiris-popup"
            >
              <div className="bg-gray-900 text-white p-3 rounded shadow-xl min-w-[200px] border border-green-500/30">
                <div className="font-bold text-green-400 flex items-center gap-2">
                  <Target size={14} />
                  {selectedEntity.id}
                </div>
                <div className="text-xs text-gray-400 mt-1 space-y-1">
                  <div>Type: {selectedEntity.type}</div>
                  <div>Lat: {selectedEntity.lat.toFixed(4)}</div>
                  <div>Lon: {selectedEntity.lon.toFixed(4)}</div>
                  {selectedEntity.altitude && <div>Alt: {selectedEntity.altitude}m</div>}
                  {selectedEntity.velocity && <div>Speed: {selectedEntity.velocity}km/h</div>}
                </div>
              </div>
            </Popup>
          )}
        </AnimatePresence>
      </Map>

      {/* Map Controls Overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={cycleMapStyle}
          className="p-2 bg-gray-900/90 backdrop-blur border border-green-500/30 rounded-lg text-green-400 hover:bg-gray-800 transition-colors"
          title="Change Map Style"
        >
          <Layers size={18} />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => mapRef.current?.resetNorth()}
          className="p-2 bg-gray-900/90 backdrop-blur border border-green-500/30 rounded-lg text-green-400 hover:bg-gray-800 transition-colors"
          title="Reset North"
        >
          <Navigation size={18} />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => mapRef.current?.flyTo({ center: [0, 20], zoom: 2, duration: 1500 })}
          className="p-2 bg-gray-900/90 backdrop-blur border border-green-500/30 rounded-lg text-green-400 hover:bg-gray-800 transition-colors"
          title="Reset View"
        >
          <RotateCcw size={18} />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowTerminator(!showTerminator)}
          className={clsx(
            "p-2 bg-gray-900/90 backdrop-blur border rounded-lg transition-colors",
            showTerminator ? "border-green-500/50 text-green-400" : "border-gray-600 text-gray-400"
          )}
          title="Toggle Day/Night Terminator"
        >
          <Zap size={18} />
        </motion.button>
      </div>

      {/* Coordinates Display */}
      <div className="absolute bottom-4 right-4 px-3 py-2 bg-gray-900/90 backdrop-blur border border-green-500/30 rounded-lg">
        <div className="flex items-center gap-2 text-xs font-mono text-green-400">
          <Crosshair size={12} />
          <span>{viewPort.latitude.toFixed(4)}°</span>
          <span>{viewPort.longitude.toFixed(4)}°</span>
          <span className="text-gray-500">|</span>
          <span>Z{viewPort.zoom.toFixed(1)}</span>
        </div>
      </div>

      {/* Projection Badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900/80 backdrop-blur border border-green-500/30 rounded-full">
        <div className="flex items-center gap-2 text-xs font-mono text-green-400">
          <Globe size={12} />
          <span>{projection.toUpperCase()}</span>
          <span className="text-gray-500">|</span>
          <span className="uppercase">{mapStyle}</span>
        </div>
      </div>
    </div>
  );
});

_OsirisMap.displayName = 'OsirisMap';

export const OsirisMap = _OsirisMap;

export default OsirisMap;