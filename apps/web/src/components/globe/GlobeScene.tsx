'use client';

import { useState, useCallback, useMemo } from 'react';
import { Deck } from '@deck.gl/core';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// Hooks
import use3DMode from '@/hooks/use3DMode';
import useFlightEntities from '@/hooks/useFlightEntities';
import useShipEntities from '@/hooks/useShipEntities';
import useSatelliteEntities from '@/hooks/useSatelliteEntities';
import useEntityPicker from '@/hooks/useEntityPicker';
import useGeofenceDraw from '@/hooks/useGeofenceDraw';
import useGeofenceDetection from '@/hooks/useGeofenceDetection';

// Layers
import TerrainLayer from '@/components/globe/TerrainLayer';
import Tile3DLayer from '@/components/globe/Tile3DLayer';
import GeofenceLayer from '@/components/globe/GeofenceLayer';
import DrawLayer from '@/components/globe/DrawLayer';
import EntityLayers from '@/components/globe/EntityLayers';
import SatelliteLayers from '@/components/globe/SatelliteLayers';

// Popups
import SatellitePopup from '@/components/globe/SatellitePopup';
import FlightPopup from '@/components/globe/FlightPopup';
import ShipPopup from '@/components/globe/ShipPopup';

// Panels
import EntityComparePanel from '@/components/panels/EntityComparePanel';
import AlertFeed from '@/components/panels/AlertFeed';
import GeofencePanel from '@/components/panels/GeofencePanel';
import DrawToolbar from '@/components/panels/DrawToolbar';

// Store
import { usePinnedEntities } from '@/store/pinnedEntities';
import { useGeofenceStore } from '@/store/geofenceStore';

// Icons
import { Box } from 'lucide-react';

// Map style
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

interface GlobeSceneProps {
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
  };
}

const DEFAULT_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 2,
  pitch: 0,
  bearing: 0,
};

export default function GlobeScene({ initialViewState }: GlobeSceneProps) {
  const [viewState, setViewState] = useState(initialViewState || DEFAULT_VIEW_STATE);

  // 3D Mode
  const { is3D, toggle3D, animateTo3D, animateTo2D } = use3DMode();

  // Entity hooks
  const { flights, loading: flightsLoading } = useFlightEntities();
  const { ships, loading: shipsLoading } = useSatelliteEntities();
  const { satellites, loading: satellitesLoading } = useSatelliteEntities();

  // Pinned entities store
  const { pinEntity } = usePinnedEntities();

  // Entity picker
  const { hoveredEntity, onHover, onClick, clearHover } = useEntityPicker(
    (entity) => {
      pinEntity({
        id: entity.id,
        type: entity.type,
        data: entity.data,
        pinnedAt: Date.now(),
      });
    }
  );

  // Draw mode
  const { mode: drawMode, features, draftFeature, setMode: setDrawMode, clearDraft, saveDraftAsGeofence } = useGeofenceDraw();

  // Geofence detection
  useGeofenceDetection({
    flights: flights.map(f => ({ id: f.icao24, name: f.callsign, type: 'flight' as const, lat: f.lat, lon: f.lon })),
    ships: ships.map(s => ({ id: s.mmsi, name: s.name, type: 'ship' as const, lat: s.lat, lon: s.lon })),
    satellites: satellites.map(sat => ({ id: sat.position.noradId, name: sat.position.name, type: 'satellite' as const, lat: sat.position.lat, lon: sat.position.lon })),
  });

  // Handle 3D toggle with animation
  const handle3DToggle = useCallback(() => {
    if (!is3D) {
      animateTo3D();
      setViewState(prev => ({ ...prev, pitch: 45 }));
    } else {
      animateTo2D();
      setViewState(prev => ({ ...prev, pitch: 0 }));
    }
    toggle3D();
  }, [is3D, toggle3D, animateTo3D, animateTo2D]);

  // Deck.gl layers
  const layers = useMemo(() => {
    const allLayers = [];

    // 1. TerrainLayer (3D mode only)
    if (is3D) {
      allLayers.push(TerrainLayer({}));
      allLayers.push(Tile3DLayer({}));
    }

    // 2. GeofenceLayers (circles + polygons)
    allLayers.push(GeofenceLayer({ zoom: viewState.zoom }));

    // 3. DrawLayer
    if (drawMode !== 'view') {
      allLayers.push(...DrawLayer({ features, mode: drawMode }));
    }

    // 4. Flight Layer
    allLayers.push(
      EntityLayers({
        flights,
        ships: [],
        zoom: viewState.zoom,
        onFlightHover: onHover,
        onShipHover: () => {},
      })
    );

    // 5. Ship Layer
    allLayers.push(
      EntityLayers({
        flights: [],
        ships,
        zoom: viewState.zoom,
        onFlightHover: () => {},
        onShipHover: onHover,
      })
    );

    // 6. Satellite Layer
    allLayers.push(
      SatelliteLayers({
        satellites,
        zoom: viewState.zoom,
        onSatelliteHover: onHover,
      })
    );

    return allLayers;
  }, [is3D, drawMode, features, flights, ships, satellites, viewState.zoom, onHover]);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', background: '#0a0a0f' }}>
      {/* Map */}
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Deck.gl layers */}
        <Deck
          viewState={viewState}
          onViewStateChange={evt => setViewState(evt.viewState)}
          controller={{
            inertia: true,
            touchRotate: true,
            dragPan: drawMode === 'view',
          }}
          layers={layers}
          onHover={onHover}
          onClick={onClick}
          getCursor={({ isHovering }) => isHovering ? 'crosshair' : 'grab'}
          style={{ width: '100%', height: '100%' }}
        />
      </Map>

      {/* Popups */}
      <SatellitePopup
        data={hoveredEntity?.type === 'satellite' ? hoveredEntity.data : null}
        x={hoveredEntity?.x || 0}
        y={hoveredEntity?.y || 0}
        visible={hoveredEntity?.type === 'satellite'}
      />
      <FlightPopup
        data={hoveredEntity?.type === 'flight' ? hoveredEntity.data : null}
        x={hoveredEntity?.x || 0}
        y={hoveredEntity?.y || 0}
        visible={hoveredEntity?.type === 'flight'}
      />
      <ShipPopup
        data={hoveredEntity?.type === 'ship' ? hoveredEntity.data : null}
        x={hoveredEntity?.x || 0}
        y={hoveredEntity?.y || 0}
        visible={hoveredEntity?.type === 'ship'}
      />

      {/* UI Panels */}
      <EntityComparePanel />
      <AlertFeed />
      <GeofencePanel />
      <DrawToolbar
        mode={drawMode}
        onModeChange={setDrawMode}
        hasDraft={!!draftFeature}
        onClear={clearDraft}
        onSave={saveDraftAsGeofence}
      />

      {/* 3D Toggle Button */}
      <button
        onClick={handle3DToggle}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: is3D ? '#D4AF37' : 'rgba(10, 10, 15, 0.95)',
          border: '1px solid #D4AF37',
          borderRadius: 8,
          padding: '12px 16px',
          color: is3D ? '#000' : '#D4AF37',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'monospace',
          fontSize: 12,
          zIndex: 100,
        }}
      >
        <Box size={16} />
        {is3D ? '3D' : '2D'}
      </button>

      {/* Loading indicator */}
      {(flightsLoading || shipsLoading || satellitesLoading) && (
        <div style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(10, 10, 15, 0.9)',
          border: '1px solid #333',
          borderRadius: 8,
          padding: '8px 16px',
          color: '#D4AF37',
          fontFamily: 'monospace',
          fontSize: 12,
          zIndex: 100,
        }}>
          Loading entities...
        </div>
      )}
    </div>
  );
}