'use client';

import { useState, useEffect } from 'react';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// Store
import { useEntityStore } from '@/stores/entityStore';

// Map style
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const DEFAULT_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 2,
  pitch: 0,
  bearing: 0,
};

export default function GlobeScene() {
  const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);
  const { entities, activeLayers } = useEntityStore();

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        reuseMaps
      />
    </div>
  );
}