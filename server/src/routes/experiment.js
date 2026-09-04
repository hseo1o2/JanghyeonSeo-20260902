import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import candidates from '../data/candidates.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dailyfirst-demo-secret-2026';

function parseUser(req) {
  try {
    const header = req.headers.authorization || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET);
  } catch { return null; }
}

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
    const user    = parseUser(req);
    const forced  = req.query.condition || user?.forcedCondition;
    const condition = (forced === 'daily_first' || forced === 'profile_first')
      ? forced
      : (Math.random() < 0.5 ? 'profile_first' : 'daily_first');
    const now = new Date().toISOString();

    const row = { id: sessionId, condition, created_at: now };
    if (user?.id) row.user_id = user.id;

    const { error } = await db.from('sessions').insert(row);
    if (error) throw error;

    const candidateIds = seededShuffle(ALL_CANDIDATE_IDS, sessionId);
    const first = candidates.find(c => c.id === candidateIds[0]);
    const firstCandidate = first
      ? (condition === 'daily_first'
        ? { id: first.id, condition, dailyMoments: first.dailyMoments }
        : { id: first.id, condition, profile: first.profile })
      : null;

    res.json({
      sessionId,
      condition,
      candidateIds,
      firstCandidate,
      user: user ? { id: user.id, name: user.name } : null,
    });
  } catch (err) {
    console.error('[experiment] start failed:', err.message);
    res.status(500).json({ error: 'Failed to start experiment' });
  }
});

export default router;
