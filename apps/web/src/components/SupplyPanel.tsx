'use client';

import { useState } from 'react';
import { 
  Anchor, 
  Ship, 
  Box, 
  Truck, 
  Route,
  MapPin,
  Clock,
  AlertTriangle,
  Activity,
  ArrowRight
} from 'lucide-react';

// Sample supply chain data
const supplyRoutes = [
  { 
    id: '1',
    origin: 'Shanghai', 
    destination: 'Los Angeles', 
    vessels: 42, 
    avgDelay: 3.2, 
    status: 'normal',
    volume: '12.4K TEU/day'
  },
  { 
    id: '2', 
    origin: 'Rotterdam', 
    destination: 'New York', 
    vessels: 18, 
    avgDelay: 1.8, 
    status: 'normal',
    volume: '5.2K TEU/day'
  },
  { 
    id: '3', 
    origin: 'Singapore', 
    destination: 'Dubai', 
    vessels: 24, 
    avgDelay: 0.5, 
    status: 'normal',
    volume: '8.1K TEU/day'
  },
  { 
    id: '4', 
    origin: 'Busan', 
    destination: 'Seattle', 
    vessels: 12, 
    avgDelay: 5.1, 
    status: 'delayed',
    volume: '3.8K TEU/day'
  },
  { 
    id: '5', 
    origin: 'Hong Kong', 
    destination: 'Long Beach', 
    vessels: 31, 
    avgDelay: 4.2, 
    status: 'congested',
    volume: '9.6K TEU/day'
  },
];

const portActivity = [
  { port: 'Shanghai', congestion: 4.2, waitTime: '18-22 days', throughput: '45.2K TEU' },
  { port: 'Singapore', congestion: 1.8, waitTime: '1-2 days', throughput: '32.1K TEU' },
  { port: 'Rotterdam', congestion: 2.1, waitTime: '2-3 days', throughput: '28.4K TEU' },
  { port: 'Long Beach', congestion: 3.9, waitTime: '12-15 days', throughput: '18.7K TEU' },
  { port: 'Dubai', congestion: 1.2, waitTime: '1 day', throughput: '14.2K TEU' },
];

type View = 'routes' | 'ports';

export default function SupplyPanel() {
  const [activeView, setActiveView] = useState<View>('routes');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-osiris-alert-green';
      case 'delayed': return 'text-osiris-warning';
      case 'congested': return 'text-osiris-alert-red';
      default: return 'text-osiris-text-muted';
    }
  };

  const getCongestionLevel = (level: number) => {
    if (level < 2) return { label: 'Low', color: 'text-osiris-alert-green' };
    if (level < 3) return { label: 'Medium', color: 'text-osiris-warning' };
    return { label: 'High', color: 'text-osiris-alert-red' };
  };

  return (
    <div className="flex flex-col h-full bg-osiris-bg">
      {/* Header */}
      <div className="p-4 border-b border-osiris-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Anchor size={14} className="text-osiris-accent" />
          <span className="text-xs font-mono uppercase tracking-wider text-osiris-text-dim">
            Supply Chain
          </span>
        </div>
        
        {/* View Tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveView('routes')}
            className={`flex-1 py-2 px-3 text-[10px] font-mono uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1 ${
              activeView === 'routes'
                ? 'bg-osiris-accent/10 text-osiris-accent border border-osiris-accent/30'
                : 'text-osiris-text-muted hover:text-osiris-text hover:bg-osiris-surface/30 border border-transparent'
            }`}
          >
            <Route size={10} />
            Routes
          </button>
          <button
            onClick={() => setActiveView('ports')}
            className={`flex-1 py-2 px-3 text-[10px] font-mono uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1 ${
              activeView === 'ports'
                ? 'bg-osiris-accent/10 text-osiris-accent border border-osiris-accent/30'
                : 'text-osiris-text-muted hover:text-osiris-text hover:bg-osiris-surface/30 border border-transparent'
            }`}
          >
            <MapPin size={10} />
            Ports
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeView === 'routes' ? (
          <div className="p-3 space-y-2">
            {supplyRoutes.map(route => (
              <div
                key={route.id}
                className="p-3 rounded-lg bg-osiris-surface/40 border border-osiris-border/30 hover:border-osiris-accent/30 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <Ship size={12} className="text-osiris-satellite" />
                    <span className="text-xs font-mono text-osiris-text-faint">SEA</span>
                  </div>
                  <span className={`text-[9px] font-mono uppercase ${
                    route.status === 'normal' 
                      ? 'text-osiris-alert-green bg-osiris-alert-green/10 px-1.5 py-0.5 rounded'
                      : route.status === 'delayed'
                      ? 'text-osiris-warning bg-osiris-warning/10 px-1.5 py-0.5 rounded'
                      : 'text-osiris-alert-red bg-osiris-alert-red/10 px-1.5 py-0.5 rounded'
                  }`}>
                    {route.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-osiris-text">{route.origin}</span>
                  <ArrowRight size={10} className="text-osiris-text-faint" />
                  <span className="text-xs font-medium text-osiris-text">{route.destination}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
                  <div>
                    <span className="text-osiris-text-faint block">Vessels</span>
                    <span className="text-osiris-text">{route.vessels}</span>
                  </div>
                  <div>
                    <span className="text-osiris-text-faint block">Avg Delay</span>
                    <span className={route.avgDelay > 3 ? 'text-osiris-warning' : 'text-osiris-text'}>
                      {route.avgDelay}d
                    </span>
                  </div>
                  <div>
                    <span className="text-osiris-text-faint block">Volume</span>
                    <span className="text-osiris-text">{route.volume}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {portActivity.map(port => {
              const congestion = getCongestionLevel(port.congestion);
              return (
                <div
                  key={port.port}
                  className="p-3 rounded-lg bg-osiris-surface/40 border border-osiris-border/30 hover:border-osiris-accent/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <Anchor size={12} className="text-osiris-satellite" />
                      <span className="text-xs font-medium text-osiris-text">{port.port}</span>
                    </div>
                    <span className={`text-[9px] font-mono ${congestion.color}`}>
                      {congestion.label}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                    <div>
                      <span className="text-osiris-text-faint block">Wait Time</span>
                      <span className="text-osiris-text">{port.waitTime}</span>
                    </div>
                    <div>
                      <span className="text-osiris-text-faint block">Throughput</span>
                      <span className="text-osiris-text">{port.throughput}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-osiris-border/50">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded bg-osiris-surface/30 text-center">
            <div className="text-[9px] font-mono text-osiris-text-faint uppercase">Total Routes</div>
            <div className="text-xs font-mono text-osiris-text">{supplyRoutes.length}</div>
          </div>
          <div className="p-2 rounded bg-osiris-surface/30 text-center">
            <div className="text-[9px] font-mono text-osiris-text-faint uppercase">Active</div>
            <div className="text-xs font-mono text-osiris-alert-green">
              {supplyRoutes.filter(r => r.status === 'normal').length}
            </div>
          </div>
          <div className="p-2 rounded bg-osiris-surface/30 text-center">
            <div className="text-[9px] font-mono text-osiris-text-faint uppercase">Delayed</div>
            <div className="text-xs font-mono text-osiris-warning">
              {supplyRoutes.filter(r => r.status !== 'normal').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}