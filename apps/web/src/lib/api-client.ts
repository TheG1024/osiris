// OSIRIS API Client - Unified data fetching layer
// Handles all data sources with caching and WebSocket support

// Use relative URLs when running in same deployment
// Set NEXT_PUBLIC_API_URL for external API gateway
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

class OsirisAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    // Build the URL
    const paramStr = params ? '?' + new URLSearchParams(params).toString() : '';
    const resolvedUrl = this.baseUrl 
      ? `${this.baseUrl}${endpoint}${paramStr}`
      : `${endpoint.startsWith('/') ? endpoint : '/' + endpoint}${paramStr}`;

    console.log(`[API] Fetching ${resolvedUrl}...`);
    
    const response = await fetch(resolvedUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[API] Success for ${endpoint}`);
    return data as T;
  }

  // Specific data fetchers
  async getFlights(params?: Record<string, string>) {
    return this.fetch<{ flights: any[] }>('/api/v1/flights', params);
  }

  async getShips(params?: Record<string, string>) {
    return this.fetch<{ ships: any[] }>('/api/v1/ships', params);
  }

  async getSatellites(params?: Record<string, string>) {
    return this.fetch<{ satellites: any[] }>('/api/v1/satellites', params);
  }

  async getFires(params?: Record<string, string>) {
    return this.fetch<{ fires: any[] }>('/api/v1/fires', params);
  }

  async getEarthquakes(params?: Record<string, string>) {
    return this.fetch<{ earthquakes: any[] }>('/api/v1/earthquakes', params);
  }

  // Batch fetch for initial load
  async fetchAllData() {
    const [flights, ships, satellites, fires, earthquakes] = await Promise.allSettled([
      this.getFlights(),
      this.getShips(),
      this.getSatellites(),
      this.getFires(),
      this.getEarthquakes(),
    ]);

    return {
      flights: flights.status === 'fulfilled' ? flights.value.flights : [],
      ships: ships.status === 'fulfilled' ? ships.value.ships : [],
      satellites: satellites.status === 'fulfilled' ? satellites.value.satellites : [],
      fires: fires.status === 'fulfilled' ? fires.value.fires : [],
      earthquakes: earthquakes.status === 'fulfilled' ? earthquakes.value.earthquakes : [],
    };
  }
}

// Singleton instance
export const osirisApi = new OsirisAPIClient();

export default osirisApi;