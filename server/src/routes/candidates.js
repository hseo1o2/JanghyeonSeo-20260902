import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import db from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const candidates = JSON.parse(
  readFileSync(path.join(__dirname, '../data/candidates.json'), 'utf-8')
);

const router = Router();

router.get('/:id', (req, res) => {
  const candidate = candidates.find(c => c.id === req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  const { condition } = req.query;
  if (condition !== 'profile_first' && condition !== 'daily_first') {
    return res.status(400).json({ error: 'condition must be profile_first or daily_first' });
  }

  if (condition === 'daily_first') {
    return res.json({
      id: candidate.id,
      condition: 'daily_first',
      dailyMoments: candidate.dailyMoments,
    });
  }

  return res.json({
    id: candidate.id,
    condition: 'profile_first',
    profile: candidate.profile,
  });
});

router.get('/:id/reveal', (req, res) => {
  const candidate = candidates.find(c => c.id === req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  const { sessionId } = req.query;
  if (sessionId) {
    const session = db.prepare('SELECT condition FROM sessions WHERE id = ?').get(sessionId);
    if (!session || session.condition !== 'daily_first') {
      return res.status(403).json({ error: 'Reveal is only available in daily_first condition' });
    }
  }

  // reveal the last 2 moments as highlight context for B condition
  const highlightMoments = candidate.dailyMoments.slice(-2).map(m => ({
    time: m.time,
    caption: m.caption,
  }));

  return res.json({
    id: candidate.id,
    profile: candidate.profile,
    highlightMoments,
  });
});

export default router;
