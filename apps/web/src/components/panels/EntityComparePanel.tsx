import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, RotateCcw } from 'lucide-react';
import { usePinnedEntities, getEntityColor, getEntityIcon, EntityType } from '@/store/pinnedEntities';

export default function EntityComparePanel() {
  const { entities, unpinEntity, clearAll } = usePinnedEntities();

  if (entities.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: 80,
        right: 20,
        background: 'rgba(10, 10, 15, 0.9)',
        border: '1px solid #333',
        borderRadius: 8,
        padding: '16px 20px',
        minWidth: 240,
        zIndex: 100,
        fontFamily: 'monospace',
        color: '#666',
        fontSize: 12,
      }}>
        Click entities on the map to compare
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={{
        position: 'fixed',
        top: 80,
        right: 20,
        background: 'rgba(10, 10, 15, 0.95)',
        border: '1px solid #333',
        borderRadius: 8,
        padding: 16,
        maxWidth: 320,
        maxHeight: '70vh',
        overflowY: 'auto',
        zIndex: 100,
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: '1px solid #333',
      }}>
        <span style={{
          color: '#D4AF37',
          fontFamily: 'monospace',
          fontSize: 13,
          fontWeight: 600,
        }}>
          Compare ({entities.length}/6)
        </span>
        <button
          onClick={clearAll}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            padding: 4,
          }}
          title="Clear all"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Entity Cards */}
      <AnimatePresence>
        {entities.map((entity, index) => (
          <EntityCard
            key={entity.id}
            entity={entity}
            onRemove={() => unpinEntity(entity.id)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

function EntityCard({ 
  entity, 
  onRemove 
}: { 
  entity: { id: string; type: EntityType; data: any; pinnedAt: number };
  onRemove: () => void;
}) {
  const color = getEntityColor(entity.type);
  const icon = getEntityIcon(entity.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10, height: 0 }}
      style={{
        background: 'rgba(20, 20, 25, 0.8)',
        border: `1px solid ${color}40`,
        borderRadius: 6,
        padding: '10px 12px',
        marginBottom: 8,
      }}
    >
      {/* Card Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{
            color,
            fontFamily: 'monospace',
            fontSize: 12,
            fontWeight: 600,
          }}>
            {entity.data.name || entity.data.callsign || entity.data.mmsi}
          </span>
        </div>
        <button
          onClick={onRemove}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#444',
            cursor: 'pointer',
            padding: 2,
          }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Entity-specific stats */}
      <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#888', gap: 4 }}>
        {entity.type === 'satellite' && (
          <>
            <Stat line={`NORAD: ${entity.data.noradId || 'N/A'}`} />
            <Stat line={`Orbit: ${entity.data.orbitType || 'N/A'}`} />
            <Stat line={`Alt: ${entity.data.alt?.toFixed(1) || 'N/A'} km`} />
            <Stat line={`Vel: ${entity.data.velocity?.toFixed(2) || 'N/A'} km/s`} />
          </>
        )}
        {entity.type === 'flight' && (
          <>
            <Stat line={`ICAO: ${entity.data.icao24 || 'N/A'}`} />
            <Stat line={`Alt: ${entity.data.altitude?.toFixed(0) || 'N/A'} ft`} />
            <Stat line={`Spd: ${entity.data.speed?.toFixed(0) || 'N/A'} kts`} />
            <Stat line={`Hdg: ${entity.data.heading?.toFixed(0) || 'N/A'}°`} />
          </>
        )}
        {entity.type === 'ship' && (
          <>
            <Stat line={`MMSI: ${entity.data.mmsi || 'N/A'}`} />
            <Stat line={`Type: ${entity.data.shipType || 'N/A'}`} />
            <Stat line={`Spd: ${entity.data.speed?.toFixed(0) || 'N/A'} kts`} />
            <Stat line={`Pos: ${entity.data.lat?.toFixed(4)}°, ${entity.data.lon?.toFixed(4)}°`} />
          </>
        )}
      </div>
    </motion.div>
  );
}

function Stat({ line }: { line: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
    }}>
      {line}
    </div>
  );
}