// OSIRIS API Client - Unified data fetching layer
// Handles all data sources with caching, retry, and WebSocket support

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://osiris-2zpj.onrender.com';

interface FetchOptions {
  cache?: RequestCache;
  revalidate?: number;
  retry?: number;
  timeout?: number;
}

class OsirisAPIClient {
  private baseUrl: string;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private ws: WebSocket | null = null;
  private wsReconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private getCacheKey(endpoint: string, params?: Record<string, string>) {
    const paramStr = params ? '?' + new URLSearchParams(params).toString() : '';
    return `${endpoint}${paramStr}`;
  }

  private isCacheValid(key: string, maxAge: number = 60000): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < maxAge;
  }

  async fetch<T>(endpoint: string, params?: Record<string, string>, options: FetchOptions = {}): Promise<T> {
    const { cache = 'force-cache', revalidate = 60, retry = 2, timeout = 10000 } = options;
    const key = this.getCacheKey(endpoint, params);

    // Check memory cache first
    if (options.revalidate && this.isCacheValid(key, options.revalidate * 1000)) {
      return this.cache.get(key)!.data as T;
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const url = `${this.baseUrl}${endpoint}${params ? '?' + new URLSearchParams(params).toString() : ''}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache,
          ...(revalidate ? { next: { revalidate } } : {}),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Update cache
        this.cache.set(key, { data, timestamp: Date.now() });
        
        return data as T;
      } catch (error) {
        lastError = error as Error;
        if (attempt < retry) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    // Return stale cache if available
    const stale = this.cache.get(key);
    if (stale) {
      console.warn(`API ${endpoint} failed, returning stale cache`);
      return stale.data as T;
    }

    throw lastError;
  }

  // Real-time WebSocket connection
  connectWebSocket(onMessage?: (data: unknown) => void) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return this.ws;
    }

    const wsUrl = this.baseUrl.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws';
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('OSIRIS WebSocket connected');
        this.wsReconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Route to listeners
          if (message.type && this.listeners.has(message.type)) {
            this.listeners.get(message.type)!.forEach(cb => cb(message.data));
          }
          
          onMessage?.(message);
        } catch (e) {
          console.error('WS message parse error:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('OSIRIS WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('OSIRIS WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.attemptReconnect();
    }

    return this.ws;
  }

  private attemptReconnect() {
    if (this.wsReconnectAttempts < this.maxReconnectAttempts) {
      this.wsReconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.wsReconnectAttempts), 30000);
      console.log(`Reconnecting in ${delay}ms (attempt ${this.wsReconnectAttempts})`);
      setTimeout(() => this.connectWebSocket(), delay);
    }
  }

  subscribe(type: string, callback: (data: unknown) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
    
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Specific data fetchers (matching original OSIRIS sources)
  async getFlights(params?: Record<string, string>) {
    return this.fetch('/api/v1/flights', params);
  }

  async getShips(params?: Record<string, string>) {
    return this.fetch('/api/v1/ships', params);
  }

  async getSatellites() {
    return this.fetch('/api/v1/satellites');
  }

  async getFires(params?: Record<string, string>) {
    return this.fetch('/api/v1/fires', params);
  }

  async getEarthquakes(params?: Record<string, string>) {
    return this.fetch('/api/v1/earthquakes', params);
  }

  async getFrontlines() {
    return this.fetch('/api/v1/frontlines');
  }

  async getLiveNews(params?: Record<string, string>) {
    return this.fetch('/api/v1/live-news', params);
  }

  async getCyberThreats() {
    return this.fetch('/api/v1/cyber-threats');
  }

  async getHealthData() {
    return this.fetch('/api/v1/health');
  }

  async getAirQuality(params?: Record<string, string>) {
    return this.fetch('/api/v1/air-quality', params);
  }

  async getMarkets() {
    return this.fetch('/api/v1/markets');
  }

  async getCountryRisk() {
    return this.fetch('/api/v1/country-risk');
  }

  async queryAI(prompt: string, context?: Record<string, unknown>) {
    return this.fetch('/api/v1/ai', { prompt }, { cache: 'no-store' });
  }

  // Batch fetch for initial load
  async fetchAllData() {
    const [flights, ships, satellites, fires, earthquakes, frontlines, cyber, markets] = await Promise.allSettled([
      this.getFlights(),
      this.getShips(),
      this.getSatellites(),
      this.getFires(),
      this.getEarthquakes(),
      this.getFrontlines(),
      this.getCyberThreats(),
      this.getMarkets(),
    ]);

    return {
      flights: flights.status === 'fulfilled' ? flights.value : [],
      ships: ships.status === 'fulfilled' ? ships.value : [],
      satellites: satellites.status === 'fulfilled' ? satellites.value : [],
      fires: fires.status === 'fulfilled' ? fires.value : [],
      earthquakes: earthquakes.status === 'fulfilled' ? earthquakes.value : [],
      frontlines: frontlines.status === 'fulfilled' ? frontlines.value : [],
      cyber: cyber.status === 'fulfilled' ? cyber.value : [],
      markets: markets.status === 'fulfilled' ? markets.value : [],
    };
  }
}

// Singleton instance
export const osirisApi = new OsirisAPIClient();

export default osirisApi;