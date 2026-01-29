import { Router } from 'express';
import { requestOtp, verifyOtp, refreshAccessToken, logout } from '../auth.js';

const router = Router();

// POST /api/auth/request-otp
router.post('/request-otp', (req, res) => {
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
    const result = requestOtp(email);
    res.json(result);
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  try {
    const result = verifyOtp(email, code);

    if (!result.success) {
      return res.status(401).json({ error: result.error });
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
