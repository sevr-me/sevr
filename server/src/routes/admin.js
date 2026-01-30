import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  getUserCount,
  getGuideCount,
  getAllUsersWithStats,
  getUsersOverTime,
  getUsersByCountry,
  setAllUsersCountry,
  getAllGuidesWithDetails,
  upsertGuide,
  deleteGuide,
  deleteUser,
  revokeAllUserTokens,
  deleteEncryptedData,
  deleteAllUserServices,
  addToBlacklist,
  removeFromBlacklist,
  getAllBlacklisted,
  getUserById,
  getPageViewStats,
  getTodayStats,
  getTotalStats,
} from '../db.js';
import { setActivityBroadcaster } from '../auth.js';

const router = Router();

// Track online users (email -> last seen timestamp)
const onlineUsers = new Map();
const ONLINE_TIMEOUT = 60000; // 60 seconds

// Clean up stale users and broadcast updates
function cleanupOnlineUsers() {
  const now = Date.now();
  let changed = false;
  for (const [email, lastSeen] of onlineUsers) {
    if (now - lastSeen > ONLINE_TIMEOUT) {
      onlineUsers.delete(email);
      changed = true;
    }
  }
  if (changed) {
    broadcastOnlineUsers();
  }
}

// Run cleanup every 30 seconds
setInterval(cleanupOnlineUsers, 30000);

// Broadcast online users to admin clients
function broadcastOnlineUsers() {
  const users = Array.from(onlineUsers.keys());
  const event = JSON.stringify({ type: 'online_users', users, timestamp: new Date().toISOString() });
  for (const client of activityClients) {
    client.write(`data: ${event}\n\n`);
  }
}

// Export function to register user heartbeat (called from user routes)
export function registerUserHeartbeat(email) {
  const wasOnline = onlineUsers.has(email);
  onlineUsers.set(email, Date.now());
  if (!wasOnline) {
    broadcastOnlineUsers();
  }
}

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
    const today = new Date().toISOString().split('T')[0];
    const todayStats = getTodayStats.get(today) || { views: 0, unique_visitors: 0 };
    const totalStats = getTotalStats.get() || { total_views: 0, total_unique_visitors: 0 };
    res.json({
      userCount,
      guideCount,
      todayViews: todayStats.views,
      todayVisitors: todayStats.unique_visitors,
      totalViews: totalStats.total_views,
      totalVisitors: totalStats.total_unique_visitors,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/visitors - Get visitor stats over time
router.get('/visitors', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const stats = getPageViewStats.all(since);
    res.json(stats.map(row => ({
      date: row.date,
      views: row.views,
      visitors: row.unique_visitors,
    })));
  } catch (error) {
    console.error('Error fetching visitor stats:', error);
    res.status(500).json({ error: 'Failed to fetch visitor stats' });
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

// GET /api/admin/users-over-time
router.get('/users-over-time', (req, res) => {
  try {
    const data = getUsersOverTime.all();
    // Convert to cumulative count
    let cumulative = 0;
    const result = data.map(row => {
      cumulative += row.count;
      return { date: row.date, count: cumulative };
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching users over time:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// GET /api/admin/users-by-country
router.get('/users-by-country', (req, res) => {
  try {
    const data = getUsersByCountry.all();
    res.json(data.map(row => ({
      country: row.country_code,
      count: row.count,
    })));
  } catch (error) {
    console.error('Error fetching users by country:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// POST /api/admin/backfill-countries - Set country for users without one
router.post('/backfill-countries', (req, res) => {
  try {
    const { country } = req.body;
    if (!country || typeof country !== 'string' || country.length !== 2) {
      return res.status(400).json({ error: 'Valid 2-letter country code required' });
    }
    const result = setAllUsersCountry.run(country.toUpperCase());
    res.json({ updated: result.changes });
  } catch (error) {
    console.error('Error backfilling countries:', error);
    res.status(500).json({ error: 'Failed to backfill countries' });
  }
});

// GET /api/admin/guides - List all guides
router.get('/guides', (req, res) => {
  try {
    const guides = getAllGuidesWithDetails.all();
    res.json(guides.map(g => ({
      domain: g.domain,
      content: g.guide_content,
      settingsUrl: g.settings_url,
      noChangePossible: !!g.no_change_possible,
      updatedAt: g.updated_at,
      updatedBy: g.updated_by_email,
    })));
  } catch (error) {
    console.error('Error fetching guides:', error);
    res.status(500).json({ error: 'Failed to fetch guides' });
  }
});

// PUT /api/admin/guides/:domain - Update a guide
router.put('/guides/:domain', (req, res) => {
  try {
    const { domain } = req.params;
    const { content, settingsUrl, noChangePossible } = req.body;

    const contentToStore = (content && typeof content === 'string') ? content.trim() : '';
    const noChangeFlag = noChangePossible ? 1 : 0;

    let urlToStore = null;
    if (settingsUrl && typeof settingsUrl === 'string' && settingsUrl.trim()) {
      let url = settingsUrl.trim();
      if (!url.match(/^https?:\/\//i)) {
        url = 'https://' + url;
      }
      try {
        new URL(url);
        urlToStore = url;
      } catch {
        return res.status(400).json({ error: 'Invalid settings URL' });
      }
    }

    if (!contentToStore && !urlToStore && !noChangeFlag) {
      return res.status(400).json({ error: 'Guide content, settings URL, or "no change possible" flag is required' });
    }

    const now = new Date().toISOString();
    upsertGuide.run(domain, contentToStore, urlToStore, noChangeFlag, req.userId, now);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating guide:', error);
    res.status(500).json({ error: 'Failed to update guide' });
  }
});

// DELETE /api/admin/guides/:domain - Delete a guide
router.delete('/guides/:domain', (req, res) => {
  try {
    const { domain } = req.params;
    deleteGuide.run(domain);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting guide:', error);
    res.status(500).json({ error: 'Failed to delete guide' });
  }
});

// DELETE /api/admin/users/:id - Delete a user account
router.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = getUserById.get(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow deleting yourself
    if (id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Revoke all tokens, delete data, then delete user
    revokeAllUserTokens.run(id);
    deleteEncryptedData.run(id);
    deleteAllUserServices.run(id);
    deleteUser.run(id);

    res.json({ success: true, email: user.email });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/admin/blacklist - Get all blacklisted emails
router.get('/blacklist', (req, res) => {
  try {
    const blacklisted = getAllBlacklisted.all();
    res.json(blacklisted.map(b => ({
      email: b.email,
      reason: b.reason,
      createdAt: b.created_at,
      createdBy: b.created_by_email,
    })));
  } catch (error) {
    console.error('Error fetching blacklist:', error);
    res.status(500).json({ error: 'Failed to fetch blacklist' });
  }
});

// POST /api/admin/blacklist - Add email to blacklist
router.post('/blacklist', (req, res) => {
  try {
    const { email, reason } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date().toISOString();

    addToBlacklist.run(normalizedEmail, reason || null, now, req.userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding to blacklist:', error);
    res.status(500).json({ error: 'Failed to add to blacklist' });
  }
});

// DELETE /api/admin/blacklist/:email - Remove email from blacklist
router.delete('/blacklist/:email', (req, res) => {
  try {
    const { email } = req.params;
    removeFromBlacklist.run(email.toLowerCase());
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing from blacklist:', error);
    res.status(500).json({ error: 'Failed to remove from blacklist' });
  }
});

// GET /api/admin/activity - SSE stream
router.get('/activity', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Send current online users
  const users = Array.from(onlineUsers.keys());
  res.write(`data: ${JSON.stringify({ type: 'online_users', users, timestamp: new Date().toISOString() })}\n\n`);

  activityClients.add(res);

  req.on('close', () => {
    activityClients.delete(res);
  });
});

// GET /api/admin/online-users - Get current online users
router.get('/online-users', (req, res) => {
  res.json({ users: Array.from(onlineUsers.keys()) });
});

export default router;
