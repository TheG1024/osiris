'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useEntityStore, type MapLayer } from '@/stores/entityStore';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Plane, 
  Anchor, 
  Satellite, 
  Zap, 
  Activity, 
  Bomb, 
  Camera,
  Route,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import clsx from 'clsx';

const LAYER_ICONS: Record<string, React.ElementType> = {
  aircraft: Plane,
  ships: Anchor,
  satellites: Satellite,
  fires: Zap,
  earthquakes: Activity,
  conflict: Bomb,
  cameras: Camera,
  flightPaths: Route,
};

interface LayerPanelProps {
  compact?: boolean;
}

const _LayerPanel = memo(function LayerPanel({ compact = false }: LayerPanelProps) {
  const { layers, activeLayers, toggleLayer, setLayer } = useEntityStore();

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1 p-2">
        {layers.map(layer => {
          const Icon = LAYER_ICONS[layer.id] || Layers;
          const isActive = activeLayers[layer.id] !== false;
          return (
            <motion.button
              key={layer.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleLayer(layer.id)}
              className={clsx(
                "p-2 rounded-lg transition-colors",
                isActive 
                  ? "bg-green-500/20 border border-green-500/30 text-green-400" 
                  : "bg-gray-800/50 border border-gray-700 text-gray-500"
              )}
              title={layer.name}
            >
              <Icon size={16} />
            </motion.button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-green-500/20 bg-gray-900/50">
        <Layers className="text-green-400" size={18} />
        <h3 className="font-bold text-white text-sm">MAP LAYERS</h3>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {layers.map(layer => {
          const Icon = LAYER_ICONS[layer.id] || Layers;
          const isActive = activeLayers[layer.id] !== false;
          
          return (
            <motion.div
              key={layer.id}
              whileHover={{ scale: 1.01 }}
              className={clsx(
                "flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer",
                isActive 
                  ? "bg-green-500/10 border-green-500/30" 
                  : "bg-gray-800/30 border-gray-700/50"
              )}
              onClick={() => toggleLayer(layer.id)}
            >
              <div 
                className="w-8 h-8 rounded flex items-center justify-center"
                style={{ backgroundColor: `${layer.color}20` }}
              >
                <Icon size={16} style={{ color: layer.color }} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{layer.name}</div>
                <div className="text-xs text-gray-500 capitalize">{layer.type}</div>
              </div>
              
              <div className={clsx(
                "p-1 rounded transition-colors",
                isActive ? "text-green-400" : "text-gray-600"
              )}>
                {isActive ? <Eye size={16} /> : <EyeOff size={16} />}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-green-500/20 bg-gray-900/30">
        <div className="text-xs text-gray-500 mb-2">LEGEND</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="text-[10px] text-gray-400">Aircraft</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
            <span className="text-[10px] text-gray-400">Ships</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-400"></div>
            <span className="text-[10px] text-gray-400">Satellites</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-[10px] text-gray-400">Fires</span>
          </div>
        </div>
      </div>
    </div>
  );
});

_LayerPanel.displayName = 'LayerPanel';

export const LayerPanel = _LayerPanel;

export default LayerPanel;