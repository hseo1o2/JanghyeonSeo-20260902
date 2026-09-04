import { Router } from 'express';
import db from '../db.js';

const router = Router();

const VALID_Q1 = new Set(['daily_concrete', 'common_ground', 'less_judged', 'profile_info', 'other']);

router.post('/', (req, res) => {
  const { sessionId, q1Reason, q2Score, q3Freetext } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const session = db.prepare('SELECT condition FROM sessions WHERE id = ?').get(sessionId);
  if (!session) {
    return res.status(400).json({ error: 'Unknown sessionId' });
  }

  if (q1Reason != null && !VALID_Q1.has(q1Reason)) {
    return res.status(400).json({ error: `Invalid q1Reason. Must be one of: ${[...VALID_Q1].join(', ')}` });
  }

  if (q2Score != null && (!Number.isInteger(q2Score) || q2Score < 1 || q2Score > 5)) {
    return res.status(400).json({ error: 'q2Score must be an integer between 1 and 5' });
  }

  try {
    db.prepare(`
      INSERT INTO survey_responses (session_id, condition, q1_reason, q2_score, q3_freetext, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      sessionId,
      session.condition,
      q1Reason ?? null,
      q2Score ?? null,
      q3Freetext?.trim() || null,
      new Date().toISOString(),
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[survey] insert failed:', err.message);
    res.status(500).json({ error: 'Failed to save survey response' });
  }
});

export default router;
