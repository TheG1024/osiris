'use client';

import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEntityStore, type Alert } from '@/stores/entityStore';
import { 
  AlertTriangle, 
  X, 
  Zap, 
  Activity,
  Waves,
  Shield,
  Bomb,
  Radio,
  Heart,
  CloudLightning,
  Anchor,
  Plane,
  Wifi,
  Server,
  Clock
} from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

const ALERT_ICONS: Record<Alert['type'], React.ElementType> = {
  fire: Zap,
  earthquake: Activity,
  conflict: Bomb,
  cyber: Wifi,
  maritime: Anchor,
  air: Plane,
  infrastructure: Server,
  health: Heart,
};

const SEVERITY_COLORS: Record<Alert['severity'], string> = {
  low: 'border-yellow-500/50 text-yellow-400',
  medium: 'border-orange-500/50 text-orange-400',
  high: 'border-red-500/50 text-red-400',
  critical: 'border-red-600 bg-red-900/30 text-red-300 animate-pulse',
};

const ALERT_TYPE_LABELS: Record<Alert['type'], string> = {
  fire: 'Fire',
  earthquake: 'Earthquake',
  conflict: 'Conflict',
  cyber: 'Cyber Threat',
  maritime: 'Maritime',
  air: 'Air Activity',
  infrastructure: 'Infrastructure',
  health: 'Health Alert',
};

interface LiveAlertsProps {
  maxHeight?: string;
  maxAlerts?: number;
}

const _LiveAlerts = memo(function LiveAlerts({ 
  maxHeight = 'max-h-96', 
  maxAlerts = 50 
}: LiveAlertsProps) {
  const { alerts, alertFilters, dismissAlert, setAlertFilter } = useEntityStore();
  const [filterOpen, setFilterOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const filteredAlerts = alerts
    .filter(a => alertFilters[a.type])
    .slice(0, maxAlerts);
  
  const criticalCount = filteredAlerts.filter(a => a.severity === 'critical').length;
  
  // Play sound for critical alerts
  useEffect(() => {
    if (criticalCount > 0 && soundEnabled) {
      // Could add sound here
      console.log('Critical alert sound');
    }
  }, [criticalCount, soundEnabled]);

  return (
    <div className={clsx("flex flex-col h-full", maxHeight)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-green-500/20 bg-gray-900/50">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-red-400" size={18} />
          <h3 className="font-bold text-white text-sm">LIVE ALERTS</h3>
          {criticalCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full"
            >
              {criticalCount} CRITICAL
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={clsx(
              "p-1.5 rounded transition-colors",
              soundEnabled ? "text-green-400 bg-green-500/20" : "text-gray-500 hover:text-gray-300"
            )}
            title="Sound Alerts"
          >
            <Activity size={14} />
          </button>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={clsx(
              "p-1.5 rounded transition-colors",
              filterOpen ? "text-green-400 bg-green-500/20" : "text-gray-500 hover:text-gray-300"
            )}
            title="Filter Alerts"
          >
            <Waves size={14} />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-green-500/20 bg-gray-900/80 overflow-hidden"
          >
            <div className="p-2 grid grid-cols-4 gap-1">
              {Object.entries(alertFilters).map(([type, enabled]) => (
                <button
                  key={type}
                  onClick={() => setAlertFilter(type, !enabled)}
                  className={clsx(
                    "px-2 py-1 text-xs rounded transition-colors",
                    enabled 
                      ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                      : "bg-gray-800 text-gray-500 border border-gray-700"
                  )}
                >
                  {ALERT_TYPE_LABELS[type as Alert['type']]}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert List */}
      <div className={clsx("flex-1 overflow-y-auto", maxHeight)}>
        <AnimatePresence mode="popWait">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Shield size={32} className="mb-2 opacity-50" />
              <p className="text-sm">No active alerts</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const Icon = ALERT_ICONS[alert.type];
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={clsx(
                    "p-3 border-b border-green-500/10 hover:bg-gray-800/50 transition-colors cursor-pointer",
                    SEVERITY_COLORS[alert.severity]
                  )}
                  onClick={() => dismissAlert(alert.id)}
                >
                  <div className="flex items-start gap-2">
                    <Icon size={16} className="mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs">{alert.title}</span>
                        <span className={clsx(
                          "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold",
                          alert.severity === 'critical' && "bg-red-600 text-white",
                          alert.severity === 'high' && "bg-red-500/30 text-red-400",
                          alert.severity === 'medium' && "bg-orange-500/30 text-orange-400",
                          alert.severity === 'low' && "bg-yellow-500/30 text-yellow-400"
                        )}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{alert.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                        </span>
                        <span>•</span>
                        <span>{alert.source}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissAlert(alert.id);
                      }}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-green-500/20 bg-gray-900/50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{filteredAlerts.length} alerts</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            LIVE
          </span>
        </div>
      </div>
    </div>
  );
});

_LiveAlerts.displayName = 'LiveAlerts';

export const LiveAlerts = _LiveAlerts;

export default LiveAlerts;