import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import candidates from '../data/candidates.js';

const ALL_CANDIDATE_IDS = candidates.map(c => c.id);

function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = parseInt(seed.replace(/-/g, '').slice(0, 8), 16);
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const router = Router();

router.get('/start', async (req, res) => {
  try {
    const sessionId = uuidv4();
    const forced = req.query.condition;
    const condition = (forced === 'daily_first' || forced === 'profile_first')
      ? forced
      : (Math.random() < 0.5 ? 'profile_first' : 'daily_first');
    const now = new Date().toISOString();

    const { error } = await db.from('sessions').insert({ id: sessionId, condition, created_at: now });
    if (error) throw error;

    res.json({
      sessionId,
      condition,
      candidateIds: seededShuffle(ALL_CANDIDATE_IDS, sessionId),
    });
  } catch (err) {
    console.error('[experiment] start failed:', err.message);
    res.status(500).json({ error: 'Failed to start experiment' });
  }
});

export default router;
