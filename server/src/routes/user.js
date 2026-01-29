import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { revokeAllTokens } from '../auth.js';
import { getUserById, deleteUser, deleteAllUserServices } from '../db.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/user/me - Get current user info
router.get('/me', (req, res) => {
  try {
    const user = getUserById.get(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      isAdmin: !!user.is_admin,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// DELETE /api/user/me - Delete account and all data
router.delete('/me', (req, res) => {
  try {
    // Revoke all tokens
    revokeAllTokens(req.userId);

    // Delete all user services (cascade should handle this, but explicit is better)
    deleteAllUserServices.run(req.userId);

    // Delete user
    deleteUser.run(req.userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
