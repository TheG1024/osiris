import { motion, AnimatePresence } from 'framer-motion';

interface ShipPopupProps {
  data: {
    name: string;
    mmsi: string;
    shipType: string;
    speed: number;
    heading: number;
    lat: number;
    lon: number;
  } | null;
  x: number;
  y: number;
  visible: boolean;
}

const theme = {
  bg: 'rgba(10, 10, 15, 0.95)',
  border: '#4FC3F7',
  text: '#4FC3F7',
  secondary: '#8B8B8B',
};

export default function ShipPopup({ data, x, y, visible }: ShipPopupProps) {
  if (!visible || !data) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          left: x + 15,
          top: y - 10,
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: '12px 16px',
          minWidth: 220,
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          fontFamily: 'monospace',
        }}
      >
        {/* Header */}
        <div style={{
          color: theme.text,
          fontSize: 14,
          fontWeight: 600,
          borderBottom: `1px solid ${theme.border}40`,
          paddingBottom: 8,
          marginBottom: 8,
        }}>
          🚢 {data.name}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gap: 6 }}>
          <StatRow label="MMSI" value={data.mmsi} />
          <StatRow label="Type" value={data.shipType} />
          <StatRow 
            label="Speed" 
            value={data.speed ? `${data.speed.toFixed(0)} kts` : 'N/A'} 
          />
          <StatRow 
            label="Heading" 
            value={data.heading ? `${data.heading.toFixed(0)}°` : 'N/A'} 
          />
          <StatRow 
            label="Position" 
            value={data.lat && data.lon 
              ? `${data.lat.toFixed(4)}°, ${data.lon.toFixed(4)}°` 
              : 'N/A'
            } 
          />
        </div>

        {/* Click hint */}
        <div style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: `1px solid ${theme.border}40`,
          fontSize: 10,
          color: theme.secondary,
          textAlign: 'center',
        }}>
          Click to compare
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
    }}>
      <span style={{ color: '#8B8B8B' }}>{label}</span>
      <span style={{ color: '#4FC3F7', fontWeight: 500 }}>{value}</span>
    </div>
  );
}