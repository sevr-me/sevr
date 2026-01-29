import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { getUserCount, getGuideCount, getAllUsersWithStats } from '../db.js';
import { setActivityBroadcaster } from '../auth.js';

const router = Router();

// All routes require authentication and admin
router.use(authenticate);
router.use(requireAdmin);

// SSE clients for activity feed
const activityClients = new Set();

// Broadcast activity to all connected clients
export function broadcastActivity(type, data) {
  const event = JSON.stringify({ type, ...data, timestamp: data.timestamp || new Date().toISOString() });
  for (const client of activityClients) {
    client.write(`data: ${event}\n\n`);
  }
}

// Register broadcaster with auth module
setActivityBroadcaster(broadcastActivity);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    const userCount = getUserCount.get().count;
    const guideCount = getGuideCount.get().count;
    res.json({ userCount, guideCount });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  try {
    const users = getAllUsersWithStats.all();
    res.json(users.map(u => ({
      id: u.id,
      email: u.email,
      createdAt: u.created_at,
      isAdmin: !!u.is_admin,
      serviceCount: u.service_count,
    })));
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/activity - SSE stream
router.get('/activity', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  activityClients.add(res);

  req.on('close', () => {
    activityClients.delete(res);
  });
});

export default router;
