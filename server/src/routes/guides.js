import { Router } from 'express';
import { getGuideByDomain, getAllGuides, upsertGuide } from '../db.js';
import { authenticate } from '../middleware/authenticate.js';
import { broadcastActivity } from '../auth.js';

const router = Router();

// Get all guides (for bulk fetching)
router.get('/', (req, res) => {
  try {
    const guides = getAllGuides.all();
    const guidesMap = {};
    for (const guide of guides) {
      guidesMap[guide.domain] = {
        content: guide.guide_content,
        settingsUrl: guide.settings_url,
        noChangePossible: !!guide.no_change_possible,
        updatedAt: guide.updated_at,
        updatedBy: guide.updated_by_email,
      };
    }
    res.json(guidesMap);
  } catch (err) {
    console.error('Failed to fetch guides:', err);
    res.status(500).json({ error: 'Failed to fetch guides' });
  }
});

// Get guide for a specific domain
router.get('/:domain', (req, res) => {
  try {
    const { domain } = req.params;
    const guide = getGuideByDomain.get(domain);

    if (!guide) {
      return res.status(404).json({ error: 'No guide found for this domain' });
    }

    res.json({
      domain: guide.domain,
      content: guide.guide_content,
      settingsUrl: guide.settings_url,
      noChangePossible: !!guide.no_change_possible,
      updatedAt: guide.updated_at,
      updatedBy: guide.updated_by_email,
    });
  } catch (err) {
    console.error('Failed to fetch guide:', err);
    res.status(500).json({ error: 'Failed to fetch guide' });
  }
});

// Create or update guide (requires authentication)
router.put('/:domain', authenticate, (req, res) => {
  try {
    const { domain } = req.params;
    const { content, settingsUrl, noChangePossible } = req.body;

    const contentToStore = (content && typeof content === 'string') ? content.trim() : '';
    const noChangeFlag = noChangePossible ? 1 : 0;

    if (contentToStore.length > 5000) {
      return res.status(400).json({ error: 'Guide content too long (max 5000 characters)' });
    }

    // Validate and fix URL if provided
    let urlToStore = null;
    if (settingsUrl && typeof settingsUrl === 'string' && settingsUrl.trim()) {
      let url = settingsUrl.trim();
      // Add https:// if no protocol specified
      if (url && !url.match(/^https?:\/\//i)) {
        url = 'https://' + url;
      }
      try {
        new URL(url);
        urlToStore = url;
      } catch {
        return res.status(400).json({ error: 'Invalid settings URL' });
      }
    }

    // Require at least content, URL, or noChangePossible flag
    if (!contentToStore && !urlToStore && !noChangeFlag) {
      return res.status(400).json({ error: 'Guide content, settings URL, or "no change possible" flag is required' });
    }

    const now = new Date().toISOString();
    upsertGuide.run(domain, contentToStore, urlToStore, noChangeFlag, req.userId, now);

    // Broadcast guide edit activity
    broadcastActivity('guide_edit', {
      domain,
      email: req.userEmail,
      timestamp: now,
    });

    res.json({
      domain,
      content: contentToStore,
      settingsUrl: urlToStore,
      noChangePossible: !!noChangeFlag,
      updatedAt: now,
      updatedBy: req.userEmail,
    });
  } catch (err) {
    console.error('Failed to save guide:', err);
    res.status(500).json({ error: 'Failed to save guide' });
  }
});

export default router;
