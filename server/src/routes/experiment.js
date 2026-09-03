import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import candidates from '../data/candidates.js';

const ALL_CANDIDATE_IDS = candidates.map(c => c.id);

// Deterministic shuffle keyed by sessionId — same session always sees same order,
// different sessions see different orders to control for presentation-position confound.
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

router.get('/start', (req, res) => {
  try {
    const sessionId = uuidv4();
    const condition = Math.random() < 0.5 ? 'profile_first' : 'daily_first';
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO sessions (id, condition, created_at) VALUES (?, ?, ?)'
    ).run(sessionId, condition, now);

    res.json({
      sessionId,
      condition,
      candidateIds: seededShuffle(ALL_CANDIDATE_IDS, sessionId),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start experiment' });
  }
});

export default router;
