import { motion, AnimatePresence } from 'framer-motion';

interface FlightPopupProps {
  data: {
    callsign: string;
    icao24: string;
    altitude: number;
    speed: number;
    heading: number;
    origin?: string;
    destination?: string;
  } | null;
  x: number;
  y: number;
  visible: boolean;
}

const theme = {
  bg: 'rgba(10, 10, 15, 0.95)',
  border: '#00FFB4',
  text: '#00FFB4',
  secondary: '#8B8B8B',
};

export default function FlightPopup({ data, x, y, visible }: FlightPopupProps) {
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
          ✈️ {data.callsign}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gap: 6 }}>
          <StatRow label="ICAO" value={data.icao24} />
          <StatRow 
            label="Altitude" 
            value={data.altitude ? `${data.altitude.toFixed(0)} ft` : 'N/A'} 
          />
          <StatRow 
            label="Speed" 
            value={data.speed ? `${data.speed.toFixed(0)} kts` : 'N/A'} 
          />
          <StatRow 
            label="Heading" 
            value={data.heading ? `${data.heading.toFixed(0)}°` : 'N/A'} 
          />
          {data.origin && data.destination && (
            <StatRow 
              label="Route" 
              value={`${data.origin} → ${data.destination}`} 
            />
          )}
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
      <span style={{ color: '#00FFB4', fontWeight: 500 }}>{value}</span>
    </div>
  );
}