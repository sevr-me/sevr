import { Router } from 'express';
import { getApprovedSearchQueries, getUserSearchQueries, addSearchQuery, incrementQueryHitCount } from '../db.js';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js';

const router = Router();

// Get search queries (approved ones + user's own pending ones if logged in)
router.get('/', optionalAuthenticate, (req, res) => {
  try {
    let queries;
    if (req.userId) {
      queries = getUserSearchQueries.all(req.userId);
    } else {
      queries = getApprovedSearchQueries.all();
    }
    res.json(queries);
  } catch (err) {
    console.error('Failed to fetch search queries:', err);
    res.status(500).json({ error: 'Failed to fetch search queries' });
  }
});

// Add a new search query (requires authentication, pending approval)
router.post('/', authenticate, (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length > 200) {
      return res.status(400).json({ error: 'Query too long (max 200 characters)' });
    }

    const now = new Date().toISOString();
    const result = addSearchQuery.run(trimmedQuery, req.userId, now);

    res.json({
      id: result.lastInsertRowid,
      query: trimmedQuery,
      added_at: now,
      added_by_email: req.userEmail,
      approved: 0,
      hit_count: 0,
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Query already exists' });
    }
    console.error('Failed to add search query:', err);
    res.status(500).json({ error: 'Failed to add search query' });
  }
});

// Track hits for queries (called after scanning)
router.post('/hits', (req, res) => {
  try {
    const { hits } = req.body;

    if (!hits || !Array.isArray(hits)) {
      return res.status(400).json({ error: 'Hits array is required' });
    }

    for (const { id, count } of hits) {
      if (id && count > 0) {
        incrementQueryHitCount.run(count, id);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to track query hits:', err);
    res.status(500).json({ error: 'Failed to track hits' });
  }
});

export default router;
