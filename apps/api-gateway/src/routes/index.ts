import { Router, Request, Response } from 'express';
import { authenticate, requirePermission, type AuthRequest } from '../middleware/auth';
import { generateToken } from '../middleware/auth';
import { getEntitiesByType, getEntitiesInRadius, type Entity } from '@osiris/db';

const router = Router();

// ============ API CACHING ============
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

// ponytail: shapes the frontend already consumes. Kept stable; if the field
// set changes, update apps/web/src/lib/api-client.ts in the same commit.
function entityToFlight(e: Entity) {
  const m = (e.metadata || {}) as Record<string, unknown>;
  return {
    id: e.sourceId,
    callsign: m.callsign || e.name,
    lat: e.latitude,
    lon: e.longitude,
    altitude: e.altitude,
    speed: m.velocity as number | undefined,
    heading: m.heading as number | undefined,
    onGround: m.onGround as boolean | undefined,
    country: m.country as string | undefined,
    lastUpdate: new Date(e.lastSeenAt).getTime(),
  };
}

function entityToSatellite(e: Entity) {
  const m = (e.metadata || {}) as Record<string, unknown>;
  return {
    id: e.sourceId,
    name: e.name,
    lat: e.latitude,
    lon: e.longitude,
    altitude: e.altitude, // km
    velocity: m.velocity as number | undefined,
    period: m.period as number | undefined,
    lastUpdate: new Date(e.lastSeenAt).getTime(),
  };
}

function entityToWeather(e: Entity) {
  const m = (e.metadata || {}) as Record<string, unknown>;
  return {
    id: e.sourceId,
    stationName: m.stationName,
    lat: e.latitude,
    lon: e.longitude,
    tempC: m.tempC,
    dewpointC: m.dewpointC,
    windDirDegrees: m.windDirDegrees,
    windSpeedKt: m.windSpeedKt,
    altimInHg: m.altimInHg,
    cover: m.cover,
    visibility: m.visibility,
    observedAt: m.observedAt,
    lastUpdate: new Date(e.lastSeenAt).getTime(),
  };
}

const DB_ENABLED = !!process.env.DATABASE_URL;

async function fetchAircraft(limit: number): Promise<Entity[]> {
  if (!DB_ENABLED) return [];
  try {
    return await getEntitiesByType('aircraft', { limit });
  } catch (err) {
    console.error('[api] aircraft query failed:', (err as Error).message);
    return [];
  }
}

async function fetchSatellites(limit: number): Promise<Entity[]> {
  if (!DB_ENABLED) return [];
  try {
    return await getEntitiesByType('satellite', { limit });
  } catch (err) {
    console.error('[api] satellite query failed:', (err as Error).message);
    return [];
  }
}

async function fetchWeather(limit: number): Promise<Entity[]> {
  if (!DB_ENABLED) return [];
  try {
    return await getEntitiesByType('weather', { limit });
  } catch (err) {
    console.error('[api] weather query failed:', (err as Error).message);
    return [];
  }
}

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    db: DB_ENABLED ? 'configured' : 'mock',
    timestamp: Date.now(),
  });
});

// Auth (unchanged)
router.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const userRoles: Record<string, string> = {
    'admin': 'administrator',
    'op': 'operator',
    'analyst': 'analyst',
    'guest': 'public',
  };
  const role = userRoles[username] || 'public';
  const token = generateToken(username, role as any);
  res.json({ token, role, expiresIn: 86400 });
});

// ---- Mock generators for sources we haven't wired (fires, earthquakes, ships) ----
function generateFires(count: number) {
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
      acqTime: `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
    });
  }
  return fires;
}

function generateEarthquakes(count: number) {
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
      timestamp: Date.now() - Math.floor(Math.random() * 86400000),
    });
  }
  return earthquakes;
}

function generateShips(count: number) {
  const ships = [];
  const types = ['cargo', 'tanker', 'container', 'bulk'];
  for (let i = 0; i < count; i++) {
    const lat = (Math.random() - 0.5) * 120;
    const lon = (Math.random() - 0.5) * 280;
    ships.push({
      id: `SHIP${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      name: `MV ${['Pacific', 'Atlantic', 'Arctic', 'Indian', 'Southern'][Math.floor(Math.random() * 5)]} ${['Star', 'Pride', 'Glory', 'Fortune', 'Voyager'][Math.floor(Math.random() * 5)]}`,
      type: types[Math.floor(Math.random() * types.length)],
      lat, lon,
      speed: Math.floor(Math.random() * 20) + 5,
      heading: Math.floor(Math.random() * 360),
      destination: ['Shanghai', 'Rotterdam', 'Singapore', 'LA', 'Dubai'][Math.floor(Math.random() * 5)],
      lastUpdate: Date.now() - Math.floor(Math.random() * 300000),
    });
  }
  return ships;
}

// ---- Live routes ----
router.get('/flights', async (req: Request, res: Response) => {
  const count = parseInt(req.query.count as string) || 500;
  const cacheKey = `flights:${count}`;
  const cached = apiCache.get<{ flights: unknown[]; count: number; timestamp: number }>(cacheKey);
  if (cached) return res.json(cached);

  const rows = await fetchAircraft(count);
  const flights = rows.map(entityToFlight);
  const response = { flights, count: flights.length, source: 'opensky', timestamp: Date.now() };
  apiCache.set(cacheKey, response, 15000);
  res.json(response);
});

router.get('/satellites', async (req: Request, res: Response) => {
  const count = parseInt(req.query.count as string) || 200;
  const cacheKey = `satellites:${count}`;
  const cached = apiCache.get<{ satellites: unknown[]; count: number; timestamp: number }>(cacheKey);
  if (cached) return res.json(cached);

  const rows = await fetchSatellites(count);
  const satellites = rows.map(entityToSatellite);
  const response = { satellites, count: satellites.length, source: 'celestrak', timestamp: Date.now() };
  apiCache.set(cacheKey, response, 30000);
  res.json(response);
});

router.get('/weather', async (req: Request, res: Response) => {
  const count = parseInt(req.query.count as string) || 200;
  const cacheKey = `weather:${count}`;
  const cached = apiCache.get<{ stations: unknown[]; count: number; timestamp: number }>(cacheKey);
  if (cached) return res.json(cached);

  const rows = await fetchWeather(count);
  const stations = rows.map(entityToWeather);
  const response = { stations, count: stations.length, source: 'noaa', timestamp: Date.now() };
  apiCache.set(cacheKey, response, 60000);
  res.json(response);
});

router.get('/fires', (req: Request, res: Response) => {
  const count = parseInt(req.query.count as string) || 15;
  const cacheKey = `fires:${count}`;
  const cached = apiCache.get<{ fires: unknown[]; count: number; timestamp: number }>(cacheKey);
  if (cached) return res.json(cached);

  const fires = generateFires(count);
  const response = { fires, count: fires.length, source: 'mock', timestamp: Date.now() };
  apiCache.set(cacheKey, response, 120000);
  res.json(response);
});

router.get('/earthquakes', (req: Request, res: Response) => {
  const count = parseInt(req.query.count as string) || 8;
  const cacheKey = `earthquakes:${count}`;
  const cached = apiCache.get<{ earthquakes: unknown[]; count: number; timestamp: number }>(cacheKey);
  if (cached) return res.json(cached);

  const earthquakes = generateEarthquakes(count);
  const response = { earthquakes, count: earthquakes.length, source: 'mock', timestamp: Date.now() };
  apiCache.set(cacheKey, response, 120000);
  res.json(response);
});

router.get('/ships', (req: Request, res: Response) => {
  const count = parseInt(req.query.count as string) || 30;
  const cacheKey = `ships:${count}`;
  const cached = apiCache.get<{ ships: unknown[]; count: number; timestamp: number }>(cacheKey);
  if (cached) return res.json(cached);

  const ships = generateShips(count);
  const response = { ships, count: ships.length, source: 'mock (no AISStream key)', timestamp: Date.now() };
  apiCache.set(cacheKey, response, 30000);
  res.json(response);
});

router.get('/overview', async (req: Request, res: Response) => {
  const cacheKey = 'overview';
  const cached = apiCache.get<Record<string, unknown>>(cacheKey);
  if (cached) return res.json(cached);

  const [aircraft, satellites, weather] = await Promise.all([
    fetchAircraft(100),
    fetchSatellites(50),
    fetchWeather(50),
  ]);

  const flights = aircraft.map(entityToFlight);
  const sats = satellites.map(entityToSatellite);
  const wx = weather.map(entityToWeather);
  const fires = generateFires(15);
  const earthquakes = generateEarthquakes(8);

  const response = {
    flights, satellites, weather: wx, fires, earthquakes,
    stats: {
      totalFlights: flights.length,
      totalSatellites: sats.length,
      totalWeather: wx.length,
      activeFires: fires.length,
      recentEarthquakes: earthquakes.length,
    },
    timestamp: Date.now(),
  };
  apiCache.set(cacheKey, response, 30000);
  res.json(response);
});

// ---- Authenticated entity routes ----
router.get('/entities', authenticate, async (req: AuthRequest, res: Response) => {
  if (!DB_ENABLED) return res.json({ entities: [], count: 0, source: 'mock', timestamp: Date.now() });
  try {
    const rows = await getEntitiesByType(req.query.type as string || 'aircraft', { limit: 500 });
    const entities = rows.map((e) => ({
      id: e.sourceId,
      type: e.entityType,
      name: e.name,
      lat: e.latitude,
      lon: e.longitude,
      altitude: e.altitude,
      status: e.status,
      metadata: e.metadata,
      lastSeenAt: e.lastSeenAt,
    }));
    res.json({ entities, count: entities.length, source: 'db', timestamp: Date.now() });
  } catch (err) {
    console.error('[api] /entities failed:', (err as Error).message);
    res.status(500).json({ error: 'entities query failed' });
  }
});

router.get('/entities/:id', authenticate, requirePermission('read:entities'), async (req: AuthRequest, res: Response) => {
  if (!DB_ENABLED) return res.json({ id: req.params.id, status: 'tracked', source: 'mock' });
  // Look up by source_id; we don't have a direct index for that, so do a small type scan.
  // ponytail: add a UNIQUE index on (entity_type, source_id) and a direct lookup
  // when the entity set is large. Today we just scan a 500-row window.
  try {
    const { getPool } = await import('@osiris/db');
    const pool = getPool();
    const r = await pool.query(
      `SELECT id, entity_type, source_id, name, latitude, longitude, altitude, status, metadata, last_seen_at
       FROM entities WHERE source_id = $1 LIMIT 1`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    const row = r.rows[0];
    res.json({ ...row, source: 'db' });
  } catch (err) {
    console.error('[api] /entities/:id failed:', (err as Error).message);
    res.status(500).json({ error: 'entity lookup failed' });
  }
});

router.get('/query/proximity', authenticate, requirePermission('query:proximity' as any), async (req: AuthRequest, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const radius_km = parseFloat(req.query.radius_km as string);
  if (!DB_ENABLED) {
    return res.json({ center: { lat, lon }, radius_km, entities: [], count: 0, source: 'mock' });
  }
  try {
    const rows = await getEntitiesInRadius(lat, lon, radius_km);
    res.json({
      center: { lat, lon },
      radius_km,
      entities: rows.map((e) => ({
        id: e.sourceId, type: e.entityType, name: e.name,
        lat: e.latitude, lon: e.longitude, altitude: e.altitude,
      })),
      count: rows.length,
      source: 'db',
    });
  } catch (err) {
    console.error('[api] /query/proximity failed:', (err as Error).message);
    res.status(500).json({ error: 'proximity query failed' });
  }
});

router.get('/stats', authenticate, requirePermission('read:stats'), async (_req: AuthRequest, res: Response) => {
  if (!DB_ENABLED) {
    return res.json({ total: 0, byType: {}, source: 'mock', timestamp: Date.now() });
  }
  try {
    const { getPool } = await import('@osiris/db');
    const pool = getPool();
    const r = await pool.query(
      `SELECT entity_type, COUNT(*)::int AS count
       FROM entities
       WHERE last_seen_at > NOW() - INTERVAL '1 hour'
       GROUP BY entity_type`
    );
    const byType: Record<string, number> = {};
    let total = 0;
    for (const row of r.rows) {
      byType[row.entity_type] = row.count;
      total += row.count;
    }
    res.json({ total, byType, source: 'db', timestamp: Date.now() });
  } catch (err) {
    console.error('[api] /stats failed:', (err as Error).message);
    res.status(500).json({ error: 'stats query failed' });
  }
});

router.get('/alerts', authenticate, requirePermission('read:alerts' as any), async (_req: AuthRequest, res: Response) => {
  const earthquakes = generateEarthquakes(3);
  const alerts = earthquakes.map((eq) => ({
    id: eq.id,
    type: 'earthquake',
    severity: Number(eq.magnitude) > 5 ? 'high' : 'medium',
    title: `M ${eq.magnitude} Earthquake`,
    description: `${eq.location} - Depth: ${eq.depth}km`,
    lat: eq.lat,
    lon: eq.lon,
    timestamp: eq.timestamp,
  }));
  res.json({ alerts, count: alerts.length, timestamp: Date.now() });
});

export default router;