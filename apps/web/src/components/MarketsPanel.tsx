'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  Briefcase,
  Factory,
  Bomb,
  Package,
  RefreshCw
} from 'lucide-react';

// Sample market data - in production this would come from an API
const generateMarketData = () => ({
  defense: [
    { symbol: 'LMT', name: 'Lockheed Martin', price: 452.32, change: 2.14, changePct: 0.47 },
    { symbol: 'BA', name: 'Boeing', price: 184.56, change: -1.23, changePct: -0.66 },
    { symbol: 'RTX', name: 'Raytheon', price: 89.45, change: 0.87, changePct: 0.98 },
    { symbol: 'NOC', name: 'Northrop', price: 412.78, change: 3.21, changePct: 0.78 },
  ],
  commodities: [
    { symbol: 'GOLD', name: 'Gold', price: 2342.50, change: 12.30, changePct: 0.53 },
    { symbol: 'OIL', name: 'Crude Oil', price: 78.45, change: -0.65, changePct: -0.82 },
    { symbol: 'NAT_GAS', name: 'Natural Gas', price: 2.89, change: 0.12, changePct: 4.34 },
    { symbol: 'WHEAT', name: 'Wheat', price: 612.25, change: -4.50, changePct: -0.73 },
  ],
  aerospace: [
    { symbol: 'UAL', name: 'United Airlines', price: 52.34, change: 0.45, changePct: 0.87 },
    { symbol: 'DAL', name: 'Delta', price: 48.67, change: -0.32, changePct: -0.65 },
    { symbol: 'AAL', name: 'American', price: 15.23, change: 0.18, changePct: 1.20 },
  ],
});

type Category = 'defense' | 'commodities' | 'aerospace';

export default function MarketsPanel() {
  const [activeCategory, setActiveCategory] = useState<Category>('defense');
  const [marketData, setMarketData] = useState(generateMarketData());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API refresh
    setTimeout(() => {
      setMarketData(generateMarketData());
      setLastUpdate(new Date());
      setIsLoading(false);
    }, 800);
  };

  const categories: Array<{ id: Category; label: string; icon: React.ElementType }> = [
    { id: 'defense', label: 'Defense', icon: Bomb },
    { id: 'commodities', label: 'Commodities', icon: Package },
    { id: 'aerospace', label: 'Aerospace', icon: Activity },
  ];

  const currentData = marketData[activeCategory];

  return (
    <div className="flex flex-col h-full bg-osiris-bg">
      {/* Header */}
      <div className="p-4 border-b border-osiris-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Briefcase size={14} className="text-osiris-accent" />
            <span className="text-xs font-mono uppercase tracking-wider text-osiris-text-dim">
              Market Data
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-osiris-surface/50 text-osiris-text-muted hover:text-osiris-accent transition-all"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        {/* Category Tabs */}
        <div className="flex gap-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-1 py-2 px-2 text-[10px] font-mono uppercase tracking-wider rounded transition-all ${
                activeCategory === cat.id
                  ? 'bg-osiris-accent/10 text-osiris-accent border border-osiris-accent/30'
                  : 'text-osiris-text-muted hover:text-osiris-text hover:bg-osiris-surface/30 border border-transparent'
              }`}
            >
              <cat.icon size={10} className="inline mr-1" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Last Update */}
      <div className="px-4 py-2 text-[9px] font-mono text-osiris-text-faint">
        Last update: {lastUpdate.toLocaleTimeString('en-US', { hour12: false })} UTC
      </div>

      {/* Market List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {currentData.map(item => (
          <div
            key={item.symbol}
            className="p-3 rounded-lg bg-osiris-surface/40 border border-osiris-border/30 hover:border-osiris-accent/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-osiris-text">{item.symbol}</span>
                <span className="text-[9px] font-mono text-osiris-text-faint truncate max-w-[100px]">
                  {item.name}
                </span>
              </div>
              <div className={`flex items-center gap-1 ${
                item.change >= 0 ? 'text-osiris-alert-green' : 'text-osiris-alert-red'
              }`}>
                {item.change >= 0 ? (
                  <TrendingUp size={10} />
                ) : (
                  <TrendingDown size={10} />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-osiris-text">
                ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-mono ${
                item.change >= 0 ? 'text-osiris-alert-green' : 'text-osiris-alert-red'
              }`}>
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePct >= 0 ? '+' : ''}{item.changePct.toFixed(2)}%)
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-osiris-border/50">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-osiris-surface/30">
            <div className="text-[9px] font-mono text-osiris-text-faint uppercase">Sector</div>
            <div className="text-xs font-mono text-osiris-text capitalize">{activeCategory}</div>
          </div>
          <div className="p-2 rounded bg-osiris-surface/30">
            <div className="text-[9px] font-mono text-osiris-text-faint uppercase">Active</div>
            <div className="text-xs font-mono text-osiris-text">{currentData.length} symbols</div>
          </div>
        </div>
      </div>
    </div>
  );
}