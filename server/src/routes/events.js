import { Router } from 'express';
import db from '../db.js';

const VALID_EVENTS = new Set([
  'candidate_viewed',
  'candidate_skipped',
  'candidate_interested',
  'profile_revealed',
]);

const VALID_CONDITIONS = new Set(['profile_first', 'daily_first']);

const router = Router();

router.post('/', (req, res) => {
  const { sessionId, condition, candidateId, event, elapsedMs, metadata, timestamp } = req.body;

  if (!sessionId || !condition || !event || !timestamp) {
    return res.status(400).json({ error: 'sessionId, condition, event, timestamp are required' });
  }
  if (!VALID_CONDITIONS.has(condition)) {
    return res.status(400).json({ error: 'Invalid condition' });
  }
  if (!VALID_EVENTS.has(event)) {
    return res.status(400).json({ error: `Invalid event. Must be one of: ${[...VALID_EVENTS].join(', ')}` });
  }

  try {
    db.prepare(`
      INSERT INTO events (session_id, condition, candidate_id, event, elapsed_ms, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId,
      condition,
      candidateId ?? null,
      event,
      typeof elapsedMs === 'number' ? elapsedMs : 0,
      metadata ? JSON.stringify(metadata) : null,
      timestamp,
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[events] insert failed:', err.message);
    res.status(500).json({ error: 'Failed to record event' });
  }
});

export default router;
