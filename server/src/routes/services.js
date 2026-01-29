import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/authenticate.js';
import {
  getServicesByUser,
  getServiceById,
  upsertService,
  updateService,
  deleteService,
} from '../db.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/services - Get all services for user
router.get('/', (req, res) => {
  try {
    const services = getServicesByUser.all(req.userId);

    // Convert to frontend format
    const formatted = services.map(s => ({
      id: s.id,
      domain: s.domain,
      name: s.name,
      category: s.category,
      email: s.email,
      guide: s.guide,
      migrated: Boolean(s.migrated),
      firstSeen: s.first_seen,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// POST /api/services/sync - Upsert services from scan
router.post('/sync', (req, res) => {
  const { services } = req.body;

  if (!Array.isArray(services)) {
    return res.status(400).json({ error: 'Services array is required' });
  }

  try {
    const now = new Date().toISOString();
    const results = [];

    for (const service of services) {
      const { domain, name, category, email, guide, migrated, firstSeen } = service;

      if (!domain || !name) {
        continue; // Skip invalid entries
      }

      const id = uuidv4();
      upsertService.run(
        id,
        req.userId,
        domain,
        name,
        category || 'Other',
        email || null,
        guide || null,
        migrated ? 1 : 0,
        firstSeen || now,
        now
      );

      results.push(domain);
    }

    // Return all services for user
    const allServices = getServicesByUser.all(req.userId);
    const formatted = allServices.map(s => ({
      id: s.id,
      domain: s.domain,
      name: s.name,
      category: s.category,
      email: s.email,
      guide: s.guide,
      migrated: Boolean(s.migrated),
      firstSeen: s.first_seen,
    }));

    res.json({ synced: results.length, services: formatted });
  } catch (error) {
    console.error('Error syncing services:', error);
    res.status(500).json({ error: 'Failed to sync services' });
  }
});

// PATCH /api/services/:id - Update service (e.g., toggle migrated)
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { migrated } = req.body;

  if (typeof migrated !== 'boolean') {
    return res.status(400).json({ error: 'Migrated boolean is required' });
  }

  try {
    const service = getServiceById.get(id, req.userId);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    updateService.run(migrated ? 1 : 0, id, req.userId);

    res.json({
      id: service.id,
      domain: service.domain,
      name: service.name,
      category: service.category,
      email: service.email,
      guide: service.guide,
      migrated,
      firstSeen: service.first_seen,
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE /api/services/:id - Delete a service
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const service = getServiceById.get(id, req.userId);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    deleteService.run(id, req.userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

export default router;
