'use client';

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEntityStore } from '@/stores/entityStore';
import { 
  Search, 
  X, 
  Filter,
  MapPin,
  Calendar,
  ExternalLink,
  Clock,
  TrendingUp,
  FileText,
  Shield,
  Database,
  ChevronRight
} from 'lucide-react';
import clsx from 'clsx';

interface OsintPanelProps {
  onSelectResult?: (result: unknown) => void;
}

interface SearchResult {
  id: string;
  type: 'flight' | 'ship' | 'satellite' | 'earthquake' | 'fire' | 'alert' | 'article';
  title: string;
  subtitle: string;
  location?: { lat: number; lon: number };
  timestamp?: number;
  url?: string;
  confidence?: number;
}

const _OsintPanel = memo(function OsintPanel({ onSelectResult }: OsintPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { alerts, entities } = useEntityStore();

  const categories = [
    { id: 'all', label: 'All', icon: Database },
    { id: 'flight', label: 'Aircraft', icon: Filter },
    { id: 'maritime', label: 'Maritime', icon: Filter },
    { id: 'satellite', label: 'Satellites', icon: Filter },
    { id: 'alert', label: 'Alerts', icon: Shield },
    { id: 'news', label: 'News', icon: FileText },
  ];

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    // Demo search results
    const demoResults: SearchResult[] = [
      {
        id: '1',
        type: 'flight',
        title: 'UAL1234',
        subtitle: 'United Airlines - Boeing 787',
        location: { lat: 40.7128, lon: -74.006 },
        confidence: 0.95,
      },
      {
        id: '2', 
        type: 'ship',
        title: 'MAERSK ALABAMA',
        subtitle: 'Container Ship - Flag: Denmark',
        location: { lat: 25.7617, lon: -80.1918 },
        confidence: 0.98,
      },
      {
        id: '3',
        type: 'earthquake',
        title: 'M 4.5 - Pacific Ocean',
        subtitle: 'USGS Earthquake Alert',
        location: { lat: 34.0522, lon: -118.2437 },
        timestamp: Date.now() - 3600000,
      }
    ];
    
    // Filter by query
    const filtered = demoResults.filter(r => 
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.subtitle.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(filtered);
    setIsSearching(false);
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch(type) {
      case 'flight': return '✈️';
      case 'ship': return '🚢';
      case 'satellite': return '🛰️';
      case 'earthquake': return '🌋';
      case 'fire': return '🔥';
      case 'alert': return '⚠️';
      case 'article': return '📰';
      default: return '📍';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-green-500/20 bg-gray-900/50">
        <div className="flex items-center gap-2 mb-3">
          <Search className="text-green-400" size={18} />
          <h3 className="font-bold text-white text-sm">INTELLIGENCE SEARCH</h3>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search flights, ships, satellites..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pl-9 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-2 top-2.5 text-gray-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category Filters */}
      <div className="p-2 border-b border-green-500/10 bg-gray-900/30">
        <div className="flex flex-wrap gap-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={clsx(
                "px-2 py-1 text-xs rounded transition-colors",
                selectedCategory === cat.id 
                  ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popWait">
          {searchResults.length > 0 ? (
            searchResults.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 border-b border-green-500/10 hover:bg-gray-800/50 cursor-pointer transition-colors"
                onClick={() => onSelectResult?.(result)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getResultIcon(result.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{result.title}</span>
                      {result.confidence && (
                        <span className="text-[10px] text-green-400">
                          {Math.round(result.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{result.subtitle}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                      {result.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} />
                          {result.location.lat.toFixed(2)}, {result.location.lon.toFixed(2)}
                        </span>
                      )}
                      {result.timestamp && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-600" />
                </div>
              </motion.div>
            ))
          ) : searchQuery.length > 0 && !isSearching ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Search size={24} className="mb-2 opacity-50" />
              <p className="text-sm">No results found</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <TrendingUp size={24} className="mb-2 opacity-50" />
              <p className="text-sm">Search the OSINT database</p>
              <p className="text-xs text-gray-600 mt-1">Flights, ships, satellites & more</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Stats */}
      <div className="p-3 border-t border-green-500/20 bg-gray-900/50">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-green-400">{alerts.length}</div>
            <div className="text-[10px] text-gray-500">ALERTS</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-400">{entities.aircraft?.length || 0}</div>
            <div className="text-[10px] text-gray-500">FLIGHTS</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-400">{entities.satellite?.length || 0}</div>
            <div className="text-[10px] text-gray-500">SATELLITES</div>
          </div>
        </div>
      </div>
    </div>
  );
});

_OsintPanel.displayName = 'OsintPanel';

export const OsintPanel = _OsintPanel;

export default OsintPanel;