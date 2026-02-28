import { Router } from 'express';
import {
  getUserEncryption,
  setUserEncryption,
  getEncryptedData,
  upsertEncryptedData,
  deleteEncryptedData,
  getEncryptedSelections,
  upsertEncryptedSelections,
  deleteEncryptedSelections,
  resetUserEncryption,
} from '../db.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Log incoming encrypted payloads (development only)
const isDev = process.env.NODE_ENV !== 'production';
function logPayload(req, type) {
  if (!isDev) return;
  const body = JSON.stringify(req.body);
  const sizeBytes = Buffer.byteLength(body, 'utf8');
  const size = sizeBytes > 1024 ? `${(sizeBytes / 1024).toFixed(1)} KB` : `${sizeBytes} B`;
  const hasData = !!req.body?.data;
  const hasIv = !!req.body?.iv;
  const ivPreview = req.body?.iv ? req.body.iv.slice(0, 12) + '...' : 'none';
  console.log(`[encrypted] ${req.method} ${type} | size: ${size} | encrypted: ${hasData && hasIv} | iv: ${ivPreview} | user: ${req.userId.slice(0, 8)}...`);
}

// Get encryption status and salt
router.get('/status', (req, res) => {
  try {
    const encryption = getUserEncryption.get(req.userId);

    res.json({
      isSetUp: !!(encryption?.encryption_salt && encryption?.encryption_verifier),
      salt: encryption?.encryption_salt || null,
      verifier: encryption?.encryption_verifier || null,
      recoveryVerifier: encryption?.recovery_verifier || null,
    });
  } catch (err) {
    console.error('Failed to get encryption status:', err);
    res.status(500).json({ error: 'Failed to get encryption status' });
  }
});

// Set up encryption (first time or after reset)
router.post('/setup', (req, res) => {
  logPayload(req, 'setup');
  try {
    const { salt, verifier, recoveryVerifier, allowOverwrite } = req.body;

    if (!salt || !verifier) {
      return res.status(400).json({ error: 'Salt and verifier are required' });
    }

    // Check if already set up (unless allowOverwrite is true)
    const existing = getUserEncryption.get(req.userId);
    if (existing?.encryption_salt && !allowOverwrite) {
      return res.status(400).json({ error: 'Encryption already set up' });
    }

    setUserEncryption.run(salt, verifier, recoveryVerifier || null, req.userId);

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to set up encryption:', err);
    res.status(500).json({ error: 'Failed to set up encryption' });
  }
});

// Reset encryption (wipe all data)
router.post('/reset', (req, res) => {
  try {
    // Delete encrypted data and selections
    deleteEncryptedData.run(req.userId);
    deleteEncryptedSelections.run(req.userId);
    // Clear encryption settings
    resetUserEncryption.run(req.userId);

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to reset encryption:', err);
    res.status(500).json({ error: 'Failed to reset encryption' });
  }
});

// Change password (requires current password verification done client-side)
router.post('/change-password', (req, res) => {
  logPayload(req, 'change-password');
  try {
    const { salt, verifier, recoveryVerifier, encryptedData, iv, encryptedSelections, selectionsIv } = req.body;

    if (!salt || !verifier) {
      return res.status(400).json({ error: 'Salt and verifier are required' });
    }

    // Update encryption settings
    setUserEncryption.run(salt, verifier, recoveryVerifier || null, req.userId);

    // Update encrypted data if provided (re-encrypted with new key)
    const now = new Date().toISOString();
    if (encryptedData && iv) {
      upsertEncryptedData.run(req.userId, encryptedData, iv, now);
    }

    // Update encrypted selections if provided (re-encrypted with new key)
    if (encryptedSelections && selectionsIv) {
      upsertEncryptedSelections.run(req.userId, encryptedSelections, selectionsIv, now);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to change password:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get encrypted data
router.get('/data', (req, res) => {
  try {
    const data = getEncryptedData.get(req.userId);

    if (!data) {
      return res.json({ data: null });
    }

    res.json({
      data: data.data,
      iv: data.iv,
      updatedAt: data.updated_at,
    });
  } catch (err) {
    console.error('Failed to get encrypted data:', err);
    res.status(500).json({ error: 'Failed to get encrypted data' });
  }
});

// Save encrypted data
router.put('/data', (req, res) => {
  logPayload(req, 'data');
  try {
    const { data, iv } = req.body;

    if (!data || !iv) {
      return res.status(400).json({ error: 'Data and IV are required' });
    }

    const now = new Date().toISOString();
    upsertEncryptedData.run(req.userId, data, iv, now);

    res.json({ success: true, updatedAt: now });
  } catch (err) {
    console.error('Failed to save encrypted data:', err);
    res.status(500).json({ error: 'Failed to save encrypted data' });
  }
});

// Get encrypted selections
router.get('/selections', (req, res) => {
  try {
    const data = getEncryptedSelections.get(req.userId);

    if (!data) {
      return res.json({ data: null });
    }

    res.json({
      data: data.data,
      iv: data.iv,
      updatedAt: data.updated_at,
    });
  } catch (err) {
    console.error('Failed to get encrypted selections:', err);
    res.status(500).json({ error: 'Failed to get encrypted selections' });
  }
});

// Save encrypted selections
router.put('/selections', (req, res) => {
  logPayload(req, 'selections');
  try {
    const { data, iv } = req.body;

    if (!data || !iv) {
      return res.status(400).json({ error: 'Data and IV are required' });
    }

    const now = new Date().toISOString();
    upsertEncryptedSelections.run(req.userId, data, iv, now);

    res.json({ success: true, updatedAt: now });
  } catch (err) {
    console.error('Failed to save encrypted selections:', err);
    res.status(500).json({ error: 'Failed to save encrypted selections' });
  }
});

export default router;
