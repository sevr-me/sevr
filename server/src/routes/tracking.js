import { Router } from 'express';
import crypto from 'crypto';
import { recordPageView, cleanupOldPageViews } from '../db.js';

const router = Router();

// Hash IP for privacy (can't be reversed to get actual IP)
function hashIp(ip) {
  // Use a daily salt so the same IP gets different hashes on different days
  // This prevents long-term tracking while still counting daily uniques
  const today = new Date().toISOString().split('T')[0];
  return crypto.createHash('sha256').update(`${ip}-${today}`).digest('hex').slice(0, 16);
}

// Get client IP
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
}

// POST /api/track - Record anonymous page view (no cookies, no auth)
router.post('/', (req, res) => {
  try {
    const ip = getClientIp(req);
    const ipHash = hashIp(ip);
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    recordPageView.run(today, ipHash, now);

    // Cleanup old data occasionally (1% chance per request)
    if (Math.random() < 0.01) {
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      cleanupOldPageViews.run(cutoff);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error recording page view:', error);
    res.status(500).json({ error: 'Failed to record' });
  }
});

export default router;
