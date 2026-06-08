import { useState, useCallback } from 'react';

export type EntityType = 'satellite' | 'flight' | 'ship';

export interface EntityPickerInfo {
  type: EntityType;
  id: string;
  data: any;
  x: number;
  y: number;
}

export interface UseEntityPickerReturn {
  hoveredEntity: EntityPickerInfo | null;
  onHover: (info: any) => void;
  onClick: (info: any) => void;
  clearHover: () => void;
}

export default function useEntityPicker(
  onPinEntity?: (entity: EntityPickerInfo) => void
): UseEntityPickerReturn {
  const [hoveredEntity, setHoveredEntity] = useState<EntityPickerInfo | null>(null);

  const determineEntityType = (layerId: string): EntityType | null => {
    if (layerId.startsWith('satellite')) return 'satellite';
    if (layerId.startsWith('flight')) return 'flight';
    if (layerId.startsWith('ship')) return 'ship';
    return null;
  };

  const onHover = useCallback((info: any) => {
    if (!info.object || !info.layer) {
      setHoveredEntity(null);
      return;
    }

    const entityType = determineEntityType(info.layer.id);
    if (!entityType) {
      setHoveredEntity(null);
      return;
    }

    setHoveredEntity({
      type: entityType,
      id: getEntityId(entityType, info.object),
      data: info.object,
      x: info.x,
      y: info.y,
    });
  }, []);

  const onClick = useCallback((info: any) => {
    if (!info.object || !info.layer) return;

    const entityType = determineEntityType(info.layer.id);
    if (!entityType) return;

    const entityInfo: EntityPickerInfo = {
      type: entityType,
      id: getEntityId(entityType, info.object),
      data: info.object,
      x: info.x,
      y: info.y,
    };

    // Pin entity to compare panel if handler provided
    if (onPinEntity) {
      onPinEntity(entityInfo);
    }
  }, [onPinEntity]);

  const clearHover = useCallback(() => {
    setHoveredEntity(null);
  }, []);

  return {
    hoveredEntity,
    onHover,
    onClick,
    clearHover,
  };
}

function getEntityId(type: EntityType, data: any): string {
  switch (type) {
    case 'satellite':
      return data.noradId || data.name || '';
    case 'flight':
      return data.icao24 || data.callsign || '';
    case 'ship':
      return data.mmsi || data.name || '';
    default:
      return '';
  }
}

// Helper to format entity data for display
export function formatEntityData(type: EntityType, data: any): Record<string, string> {
  switch (type) {
    case 'satellite':
      return {
        name: data.name || 'Unknown',
        noradId: data.noradId || 'N/A',
        orbitType: data.orbitType || 'Unknown',
        altitude: data.alt ? `${data.alt.toFixed(1)} km` : 'N/A',
        velocity: data.velocity ? `${data.velocity.toFixed(2)} km/s` : 'N/A',
        period: data.orbitalPeriod ? `${data.orbitalPeriod.toFixed(1)} min` : 'N/A',
        position: data.lat && data.lon 
          ? `${data.lat.toFixed(4)}°, ${data.lon.toFixed(4)}°` 
          : 'N/A',
      };
    case 'flight':
      return {
        callsign: data.callsign || 'Unknown',
        icao24: data.icao24 || 'N/A',
        altitude: data.altitude ? `${data.altitude.toFixed(0)} ft` : 'N/A',
        speed: data.speed ? `${data.speed.toFixed(0)} kts` : 'N/A',
        heading: data.heading ? `${data.heading.toFixed(0)}°` : 'N/A',
        route: data.origin && data.destination 
          ? `${data.origin} → ${data.destination}` 
          : 'N/A',
      };
    case 'ship':
      return {
        name: data.name || 'Unknown',
        mmsi: data.mmsi || 'N/A',
        shipType: data.shipType || 'Unknown',
        speed: data.speed ? `${data.speed.toFixed(0)} kts` : 'N/A',
        heading: data.heading ? `${data.heading.toFixed(0)}°` : 'N/A',
        position: data.lat && data.lon 
          ? `${data.lat.toFixed(4)}°, ${data.lon.toFixed(4)}°` 
          : 'N/A',
      };
  }
}