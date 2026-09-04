import { Router } from 'express';
import db from '../db.js';
import candidates from '../data/candidates.js';
import { generateConversationStarters, sanitizeMoments } from '../services/openai.js';

const rateLimitMap = new Map(); // sessionId → last request timestamp

const router = Router();

router.post('/', async (req, res) => {
  const { candidateId, sessionId } = req.body;

  if (!candidateId || !sessionId) {
    return res.status(400).json({ error: 'candidateId and sessionId are required' });
  }

  const now = Date.now();
  const last = rateLimitMap.get(sessionId) ?? 0;
  if (now - last < 8_000) {
    return res.status(429).json({ error: 'Please wait before requesting again' });
  }

  const { data: session, error: sessionError } = await db.from('sessions').select('condition').eq('id', sessionId).maybeSingle();
  if (sessionError) {
    console.error('[starters] session lookup failed:', sessionError.message);
    return res.status(500).json({ error: 'Database error' });
  }
  if (!session) return res.status(400).json({ error: 'Unknown sessionId' });

  rateLimitMap.set(sessionId, now);

  const candidate = candidates.find(c => c.id === candidateId);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'AI feature not configured' });
  }

  try {
    const starters = await generateConversationStarters(candidate, sanitizeMoments(req.body.myMoments));
    res.json({ starters });
  } catch (err) {
    console.error('[starters] OpenAI error:', err.message);
    res.status(502).json({ error: 'Failed to generate conversation starters' });
  }
});

export default router;
