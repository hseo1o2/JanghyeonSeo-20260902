import { Router } from 'express';
import db from '../db.js';
import candidates from '../data/candidates.js';
import { chatAsCandidate, generateOverlapNote, sanitizeMoments } from '../services/openai.js';

const lastCall = new Map();
const KINDS = new Set(['chat', 'greet', 'moment', 'react', 'overlap']);
const router = Router();

router.post('/', async (req, res) => {
  const { sessionId, candidateId, history, userMessage, kind, myMoments } = req.body || {};

  if (!sessionId || !candidateId) {
    return res.status(400).json({ error: 'sessionId and candidateId are required' });
  }

  const now = Date.now();
  if (now - (lastCall.get(sessionId) ?? 0) < 1200) {
    return res.status(429).json({ error: '잠시 후 다시 보내 주세요' });
  }

  const { data: session, error: sessionError } = await db.from('sessions').select('condition').eq('id', sessionId).maybeSingle();
  if (sessionError) {
    console.error('[chat] session lookup failed:', sessionError.message);
    return res.status(500).json({ error: 'Database error' });
  }
  if (!session) return res.status(400).json({ error: 'Unknown sessionId' });

  const candidate = candidates.find(c => c.id === candidateId);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'AI feature not configured' });
  }

  lastCall.set(sessionId, now);

  try {
    const cleanMoments = sanitizeMoments(myMoments);
    const resolvedKind = KINDS.has(kind) ? kind : 'chat';
    const reply = resolvedKind === 'overlap'
      ? await generateOverlapNote(candidate, cleanMoments)
      : await chatAsCandidate({
        candidate,
        myMoments: cleanMoments,
        history: Array.isArray(history)
          ? history.slice(-16).map(h => ({
            author: h?.author === 'me' ? 'me' : 'them',
            text: String(h?.text || '').slice(0, 400),
          }))
          : [],
        userMessage,
        kind: resolvedKind,
      });
    res.json({ reply: reply || '' });
  } catch (err) {
    console.error('[chat] OpenAI error:', err.message);
    res.status(502).json({ error: 'Failed to generate reply' });
  }
});

export default router;
