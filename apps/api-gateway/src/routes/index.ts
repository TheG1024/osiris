import { Router, Request, Response } from 'express';
import { authenticate, requirePermission, type AuthRequest } from '../middleware/auth';
import { generateToken } from '../middleware/auth';

const router = Router();

// ============ API CACHING (Step 2) ============
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }
}

const apiCache = new ApiCache();

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'api-gateway', timestamp: Date.now() });
});

// Authentication
router.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  const userRoles: Record<string, string> = {
    'admin': 'administrator',
    'op': 'operator',
    'analyst': 'analyst',
    'guest': 'public'
  };
  
  const role = userRoles[username] || 'public';
  const token = generateToken(username, role as any);
  
  res.json({ token, role, expiresIn: 86400 });
});

// Generate mock flight data
function generateFlights(count: number = 50) {
  const airlines = ['UA', 'AA', 'DL', 'BA', 'LH', 'AF', 'EK', 'QF', 'SQ', 'JL'];
  const flights = [];
  
  for (let i = 0; i < count; i++) {
    const lat = (Math.random() - 0.5) * 140;
    const lon = (Math.random() - 0.5) * 340;
    flights.push({
      id: `FL${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      callsign: airlines[Math.floor(Math.random() * airlines.length)] + Math.floor(Math.random() * 9000),
      lat,
      lon,
      altitude: Math.floor(Math.random() * 40000) + 25000,
      speed: Math.floor(Math.random() * 300) + 400,
      heading: Math.floor(Math.random() * 360),
      origin: ['JFK', 'LAX', 'LHR', 'FRA', 'HND', 'SYD'][Math.floor(Math.random() * 6)],
      destination: ['JFK', 'LAX', 'LHR', 'FRA', 'HND', 'SYD'][Math.floor(Math.random() * 6)],
      lastUpdate: Date.now() - Math.floor(Math.random() * 60000)
    });
  }
  return flights;
}

// Generate mock ship data
function generateShips(count: number = 30) {
  const ships = [];
  const types = ['cargo', 'tanker', 'container', 'bulk'];
  
  for (let i = 0; i < count; i++) {
    const lat = (Math.random() - 0.5) * 120;
    const lon = (Math.random() - 0.5) * 280;
    ships.push({
      id: `SHIP${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      name: `MV ${['Pacific', 'Atlantic', 'Arctic', 'Indian', 'Southern'][Math.floor(Math.random() * 5)]} ${['Star', 'Pride', 'Glory', 'Fortune', 'Voyager'][Math.floor(Math.random() * 5)]}`,
      type: types[Math.floor(Math.random() * types.length)],
      lat,
      lon,
      speed: Math.floor(Math.random() * 20) + 5,
      heading: Math.floor(Math.random() * 360),
      destination: ['Shanghai', 'Rotterdam', 'Singapore', 'LA', 'Dubai'][Math.floor(Math.random() * 5)],
      lastUpdate: Date.now() - Math.floor(Math.random() * 300000)
    });
  }
  return ships;
}

// Generate mock satellite data
function generateSatellites(count: number = 20) {
  const sats = [];
  const names = ['ISS', 'HUBBLE', 'LANDSAT-9', 'SENTINEL-2', 'NOAA-20', 'AQUA', 'TERRA', 'GPM-CORE', 'SMAP', 'OCO-3'];
  
  for (let i = 0; i < count; i++) {
    sats.push({
      id: `SAT${i.toString().padStart(4, '0')}`,
      name: names[i % names.length],
      lat: (Math.random() - 0.5) * 180,
      lon: (Math.random() - 0.5) * 360,
      altitude: Math.floor(Math.random() * 600) + 400,
      velocity: Math.floor(Math.random() * 8) + 7,
      period: Math.floor(Math.random() * 30) + 90,
      lastUpdate: Date.now() - Math.floor(Math.random() * 30000)
    });
  }
  return sats;
}

// Generate mock fire data
function generateFires(count: number = 15) {
  const fires = [];
  const regions = ['Mediterranean', 'California', 'Australia', 'Amazon', 'Siberia', 'West Africa', 'Indonesia'];
  
  for (let i = 0; i < count; i++) {
    fires.push({
      id: `FIRE${i.toString().padStart(4, '0')}`,
      lat: (Math.random() - 0.5) * 100,
      lon: (Math.random() - 0.5) * 300,
      brightness: Math.floor(Math.random() * 100) + 250,
      region: regions[Math.floor(Math.random() * regions.length)],
      confidence: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      frp: Math.floor(Math.random() * 100) + 10,
      acqDate: new Date().toISOString().split('T')[0],
      acqTime: `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
    });
  }
  return fires;
}

// Generate mock earthquake data
function generateEarthquakes(count: number = 8) {
  const earthquakes = [];
  const locations = ['Pacific Ring', 'Alpine Fault', 'Himalayan Region', 'Mid-Atlantic Ridge', 'Caribbean', 'Philippine Sea'];
  
  for (let i = 0; i < count; i++) {
    earthquakes.push({
      id: `EQ${Date.now()}-${i}`,
      lat: (Math.random() - 0.5) * 140,
      lon: (Math.random() - 0.5) * 280,
      magnitude: (Math.random() * 5 + 2).toFixed(1),
      depth: Math.floor(Math.random() * 300) + 10,
      location: locations[Math.floor(Math.random() * locations.length)],
      tsunami: Math.random() > 0.8,
      timestamp: Date.now() - Math.floor(Math.random() * 86400000)
    });
  }
  return earthquakes;
}

// Flights (30s TTL)
router.get('/flights', (req: Request, res: Response) => {
  const count = parseInt(req.query.count as string) || 50;
  const cacheKey = `flights:${count}`;

  const cached = apiCache.get<{ flights: unknown[]; count: number; timestamp: number }>(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const flights = generateFlights(count);
  const response = {
    flights,
    count: flights.length,
    timestamp: Date.now()
  };

  apiCache.set(cacheKey, response, 30000); // 30s TTL
  res.json(response);
});

// Ships (30s TTL)
router.get('/ships', (req: Request, res: Response) => {
  const count = parseInt(req.query.count as string) || 30;
  const cacheKey = `ships:${count}`;

  const cached = apiCache.get<{ ships: unknown[]; count: number; timestamp: number }>(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const ships = generateShips(count);
  const response = {
    ships,
    count: ships.length,
    timestamp: Date.now()
  };

  apiCache.set(cacheKey, response, 30000); // 30s TTL
  res.json(response);
});

// Satellites (60s TTL)
router.get('/satellites', (req: Request, res: Response) => {
  const count = parseInt(req.query.count as string) || 20;
  const cacheKey = `satellites:${count}`;

  const cached = apiCache.get<{ satellites: unknown[]; count: number; timestamp: number }>(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const satellites = generateSatellites(count);
  const response = {
    satellites,
    count: satellites.length,
    timestamp: Date.now()
  };

  apiCache.set(cacheKey, response, 60000); // 60s TTL
  res.json(response);
});

// Fires (120s TTL)
router.get('/fires', (req: Request, res: Response) => {
  const count = parseInt(req.query.count as string) || 15;
  const cacheKey = `fires:${count}`;

  const cached = apiCache.get<{ fires: unknown[]; count: number; timestamp: number }>(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const fires = generateFires(count);
  const response = {
    fires,
    count: fires.length,
    timestamp: Date.now()
  };

  apiCache.set(cacheKey, response, 120000); // 120s TTL
  res.json(response);
});

// Earthquakes (120s TTL)
router.get('/earthquakes', (req: Request, res: Response) => {
  const count = parseInt(req.query.count as string) || 8;
  const cacheKey = `earthquakes:${count}`;

  const cached = apiCache.get<{ earthquakes: unknown[]; count: number; timestamp: number }>(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const earthquakes = generateEarthquakes(count);
  const response = {
    earthquakes,
    count: earthquakes.length,
    timestamp: Date.now()
  };

  apiCache.set(cacheKey, response, 120000); // 120s TTL
  res.json(response);
});

// Overview - all data combined (30s TTL)
router.get('/overview', (req: Request, res: Response) => {
  const cacheKey = 'overview';

  const cached = apiCache.get<{ flights: unknown[]; ships: unknown[]; satellites: unknown[]; fires: unknown[]; earthquakes: unknown[]; stats: Record<string, number>; timestamp: number }>(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const flights = generateFlights(50);
  const ships = generateShips(30);
  const satellites = generateSatellites(20);
  const fires = generateFires(15);
  const earthquakes = generateEarthquakes(8);

  const response = {
    flights,
    ships,
    satellites,
    fires,
    earthquakes,
    stats: {
      totalFlights: flights.length,
      totalShips: ships.length,
      totalSatellites: satellites.length,
      activeFires: fires.length,
      recentEarthquakes: earthquakes.length
    },
    timestamp: Date.now()
  };

  apiCache.set(cacheKey, response, 30000); // 30s TTL
  res.json(response);
});

// Entities
router.get('/entities', authenticate, async (req: AuthRequest, res: Response) => {
  res.json({
    entities: [],
    count: 0,
    timestamp: Date.now()
  });
});

router.get('/entities/:id', authenticate, requirePermission('read:entities'), async (req: AuthRequest, res: Response) => {
  res.json({ id: req.params.id, status: 'tracked' });
});

// Proximity query
router.get('/query/proximity', authenticate, requirePermission('query:proximity' as any), async (req: AuthRequest, res: Response) => {
  const { lat, lon, radius_km } = req.query;
  
  res.json({
    center: { lat: Number(lat), lon: Number(lon) },
    radius_km: Number(radius_km),
    entities: [],
    count: 0
  });
});

// Stats
router.get('/stats', authenticate, requirePermission('read:stats'), async (req: AuthRequest, res: Response) => {
  const flights = generateFlights(50);
  const ships = generateShips(30);
  const satellites = generateSatellites(20);
  
  res.json({
    total: flights.length + ships.length + satellites.length,
    byType: { aircraft: flights.length, satellite: satellites.length, ship: ships.length, weather: 0 },
    timestamp: Date.now()
  });
});

// Alerts
router.get('/alerts', authenticate, requirePermission('read:alerts' as any), async (req: AuthRequest, res: Response) => {
  const earthquakes = generateEarthquakes(3);
  const alerts = earthquakes.map(eq => ({
    id: eq.id,
    type: 'earthquake',
    severity: eq.magnitude > 5 ? 'high' : 'medium',
    title: `M ${eq.magnitude} Earthquake`,
    description: `${eq.location} - Depth: ${eq.depth}km`,
    lat: eq.lat,
    lon: eq.lon,
    timestamp: eq.timestamp
  }));
  
  res.json({
    alerts,
    count: alerts.length,
    timestamp: Date.now()
  });
});

export default router;