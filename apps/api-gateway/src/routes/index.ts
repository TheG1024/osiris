import { Router, Request, Response } from 'express';
import { authenticate, requirePermission, type AuthRequest } from '../middleware/auth';
import { generateToken } from '../middleware/auth';

const router = Router();

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'api-gateway', timestamp: Date.now() });
});

// Authentication
router.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  // Mock authentication - in production, check against database
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

// Entities
router.get('/entities', authenticate, async (req: AuthRequest, res: Response) => {
  // Would query database
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
router.get('/query/proximity', authenticate, requirePermission('query:proximity'), async (req: AuthRequest, res: Response) => {
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
  res.json({
    total: 0,
    byType: { aircraft: 0, satellite: 0, ship: 0, weather: 0 },
    timestamp: Date.now()
  });
});

// Alerts
router.get('/alerts', authenticate, requirePermission('read:alerts'), async (req: AuthRequest, res: Response) => {
  res.json({
    alerts: [],
    count: 0,
    timestamp: Date.now()
  });
});

export default router;
