import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useGeofenceStore } from '@/store/geofenceStore';

export default function AlertFeed() {
  const { alerts, dismissAlert, clearAlerts } = useGeofenceStore();
  const activeAlerts = alerts.filter(a => !a.dismissed);

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        position: 'fixed',
        top: 80,
        left: 20,
        zIndex: 100,
        maxWidth: 320,
        maxHeight: '70vh',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        padding: '8px 12px',
        background: 'rgba(255, 50, 50, 0.2)',
        border: '1px solid #FF3232',
        borderRadius: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <AlertTriangle size={16} color="#FF3232" />
          </motion.div>
          <span style={{
            color: '#FF3232',
            fontFamily: 'monospace',
            fontSize: 12,
            fontWeight: 600,
          }}>
            ALERTS ({activeAlerts.length})
          </span>
        </div>
        <button
          onClick={clearAlerts}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#FF6464',
            cursor: 'pointer',
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Alert Cards */}
      <AnimatePresence>
        {activeAlerts.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDismiss={() => dismissAlert(alert.id)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

function AlertCard({ 
  alert, 
  onDismiss 
}: { 
  alert: {
    id: string;
    geofenceName: string;
    entityType: string;
    entityId: string;
    entityName: string;
    timestamp: number;
    lat: number;
    lon: number;
  };
  onDismiss: () => void;
}) {
  const timeAgo = formatDistanceToNow(alert.timestamp, { addSuffix: true });

  const icon = alert.entityType === 'satellite' ? '🛰️' 
    : alert.entityType === 'flight' ? '✈️' 
    : '🚢';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10, height: 0 }}
      style={{
        background: 'rgba(20, 10, 10, 0.95)',
        border: '1px solid #FF323280',
        borderRadius: 6,
        padding: '10px 12px',
        marginBottom: 6,
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{
            color: '#FF6464',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'monospace',
          }}>
            {alert.entityName}
          </span>
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#664444',
            cursor: 'pointer',
            padding: 2,
          }}
        >
          <X size={12} />
        </button>
      </div>

      <div style={{
        fontSize: 10,
        color: '#888',
        fontFamily: 'monospace',
        display: 'grid',
        gap: 2,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Zone:</span>
          <span style={{ color: '#D4AF37' }}>{alert.geofenceName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Time:</span>
          <span>{timeAgo}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Position:</span>
          <span>
            {alert.lat.toFixed(4)}°, {alert.lon.toFixed(4)}°
          </span>
        </div>
      </div>
    </motion.div>
  );
}