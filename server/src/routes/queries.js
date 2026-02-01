import { Router } from 'express';
import { getAllSearchQueries, addSearchQuery, deleteSearchQuery } from '../db.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Get all search queries
router.get('/', (req, res) => {
  try {
    const queries = getAllSearchQueries.all();
    res.json(queries);
  } catch (err) {
    console.error('Failed to fetch search queries:', err);
    res.status(500).json({ error: 'Failed to fetch search queries' });
  }
});

// Add a new search query (requires authentication)
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
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Query already exists' });
    }
    console.error('Failed to add search query:', err);
    res.status(500).json({ error: 'Failed to add search query' });
  }
});

// Delete a search query (requires authentication)
router.delete('/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const result = deleteSearchQuery.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Query not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete search query:', err);
    res.status(500).json({ error: 'Failed to delete search query' });
  }
});

export default router;
