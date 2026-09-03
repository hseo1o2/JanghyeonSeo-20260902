import { Router } from 'express';
import db from '../db.js';

const VALID_EVENTS = new Set([
  'candidate_viewed',
  'candidate_skipped',
  'candidate_interested',
  'profile_revealed',
  'conversation_intent_clicked',
]);

const router = Router();

router.post('/', (req, res) => {
  const { sessionId, condition, candidateId, event, elapsedMs, metadata, timestamp } = req.body;

  if (!sessionId || !event || !timestamp) {
    return res.status(400).json({ error: 'sessionId, event, timestamp are required' });
  }
  if (!VALID_EVENTS.has(event)) {
    return res.status(400).json({ error: `Invalid event. Must be one of: ${[...VALID_EVENTS].join(', ')}` });
  }

  // Verify session exists and derive condition from DB — never trust client-supplied condition
  const session = db.prepare('SELECT condition FROM sessions WHERE id = ?').get(sessionId);
  if (!session) {
    return res.status(400).json({ error: 'Unknown sessionId' });
  }
  const storedCondition = session.condition;

  try {
    db.prepare(`
      INSERT INTO events (session_id, condition, candidate_id, event, elapsed_ms, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId,
      storedCondition,
      candidateId ?? null,
      event,
      Number.isFinite(elapsedMs) ? elapsedMs : 0,
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
