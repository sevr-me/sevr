import { Router } from 'express';
import { requestOtp, verifyOtp, refreshAccessToken, logout, updateUserCountry } from '../auth.js';

// Get client IP from request
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.socket?.remoteAddress ||
         req.ip;
}

// Lookup country from IP using free API
async function lookupCountry(ip) {
  // For localhost/private IPs, use DEV_COUNTRY env var if set (for testing)
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return process.env.DEV_COUNTRY || null;
  }
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
    if (response.ok) {
      const data = await response.json();
      return data.countryCode || null;
    }
  } catch (err) {
    console.error('IP lookup failed:', err.message);
  }
  return null;
}

const router = Router();

// POST /api/auth/request-otp
router.post('/request-otp', async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const result = await requestOtp(email);
    res.json(result);
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  try {
    const result = verifyOtp(email, code);

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    // For new users, look up and store country
    if (result.isNewUser) {
      const ip = getClientIp(req);
      const countryCode = await lookupCountry(ip);
      if (countryCode) {
        updateUserCountry(result.user.id, countryCode);
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const result = refreshAccessToken(refreshToken);

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const result = logout(refreshToken);
    res.json(result);
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

export default router;
