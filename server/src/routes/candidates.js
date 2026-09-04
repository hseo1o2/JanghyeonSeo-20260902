import { Router } from 'express';
import db from '../db.js';
import candidates from '../data/candidates.js';

const router = Router();

router.get('/:id', async (req, res) => {
  const candidate = candidates.find(c => c.id === req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  const { data: session } = await db.from('sessions').select('condition').eq('id', sessionId).maybeSingle();
  if (!session) return res.status(400).json({ error: 'Unknown sessionId' });

  const condition = session.condition;

  if (condition === 'daily_first') {
    return res.json({ id: candidate.id, condition: 'daily_first', dailyMoments: candidate.dailyMoments });
  }
  return res.json({ id: candidate.id, condition: 'profile_first', profile: candidate.profile });
});

router.get('/:id/reveal', async (req, res) => {
  const candidate = candidates.find(c => c.id === req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  const { data: session } = await db.from('sessions').select('condition').eq('id', sessionId).maybeSingle();
  if (!session || session.condition !== 'daily_first') {
    return res.status(403).json({ error: 'Reveal is only available in daily_first condition' });
  }

  const highlightMoments = candidate.dailyMoments.slice(-2).map(m => ({ time: m.time, caption: m.caption }));
  return res.json({ id: candidate.id, profile: candidate.profile, highlightMoments });
});

export default router;
