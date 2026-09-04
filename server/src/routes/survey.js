import { Router } from 'express';
import db from '../db.js';

const router = Router();

const VALID_Q1 = new Set(['daily_concrete', 'common_ground', 'less_judged', 'profile_info', 'other']);

router.post('/', async (req, res) => {
  const { sessionId, q1Reason, q2Score, q3Freetext } = req.body;

  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  const { data: session, error: sessionError } = await db.from('sessions').select('condition').eq('id', sessionId).maybeSingle();
  if (sessionError) {
    console.error('[survey] session lookup failed:', sessionError.message);
    return res.status(500).json({ error: 'Database error' });
  }
  if (!session) return res.status(400).json({ error: 'Unknown sessionId' });

  if (q1Reason != null && !VALID_Q1.has(q1Reason)) {
    return res.status(400).json({ error: `Invalid q1Reason. Must be one of: ${[...VALID_Q1].join(', ')}` });
  }
  if (q2Score != null && (!Number.isInteger(q2Score) || q2Score < 1 || q2Score > 5)) {
    return res.status(400).json({ error: 'q2Score must be an integer between 1 and 5' });
  }

  const { error } = await db.from('survey_responses').insert({
    session_id: sessionId,
    condition: session.condition,
    q1_reason: q1Reason ?? null,
    q2_score: q2Score ?? null,
    q3_freetext: q3Freetext?.trim() || null,
    submitted_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[survey] insert failed:', error.message);
    return res.status(500).json({ error: 'Failed to save survey response' });
  }

  res.status(201).json({ ok: true });
});

export default router;
