import { Router } from 'express';
import db from '../db.js';

const VALID_EVENTS = new Set([
  'candidate_viewed',
  'candidate_skipped',
  'candidate_interested',
  'profile_revealed',
  'conversation_intent_clicked',
  'log_posted',
  'log_reacted',
]);

const router = Router();

router.post('/', async (req, res) => {
  const { sessionId, candidateId, event, elapsedMs, metadata, timestamp } = req.body;

  if (!sessionId || !event || !timestamp) {
    return res.status(400).json({ error: 'sessionId, event, timestamp are required' });
  }
  if (!VALID_EVENTS.has(event)) {
    return res.status(400).json({ error: `Invalid event. Must be one of: ${[...VALID_EVENTS].join(', ')}` });
  }

  const { data: session, error: sessionError } = await db.from('sessions').select('condition').eq('id', sessionId).maybeSingle();
  if (sessionError) {
    console.error('[events] session lookup failed:', sessionError.message);
    return res.status(500).json({ error: 'Database error' });
  }
  if (!session) return res.status(400).json({ error: 'Unknown sessionId' });

  const { error } = await db.from('events').insert({
    session_id: sessionId,
    condition: session.condition,
    candidate_id: candidateId ?? null,
    event,
    elapsed_ms: Number.isFinite(elapsedMs) ? elapsedMs : 0,
    metadata: metadata ?? null,
    timestamp,
  });

  if (error) {
    console.error('[events] insert failed:', error.message);
    return res.status(500).json({ error: 'Failed to record event' });
  }

  res.status(201).json({ ok: true });
});

export default router;
