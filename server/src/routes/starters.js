import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import db from '../db.js';
import { generateConversationStarters } from '../services/openai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const candidates = JSON.parse(
  readFileSync(path.join(__dirname, '../data/candidates.json'), 'utf-8')
);

const router = Router();

router.post('/', async (req, res) => {
  const { candidateId, sessionId } = req.body;

  if (!candidateId || !sessionId) {
    return res.status(400).json({ error: 'candidateId and sessionId are required' });
  }

  const session = db.prepare('SELECT condition FROM sessions WHERE id = ?').get(sessionId);
  if (!session) {
    return res.status(400).json({ error: 'Unknown sessionId' });
  }

  const candidate = candidates.find(c => c.id === candidateId);
  if (!candidate) {
    return res.status(404).json({ error: 'Candidate not found' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'AI feature not configured' });
  }

  try {
    const starters = await generateConversationStarters(candidate);
    res.json({ starters });
  } catch (err) {
    console.error('[starters] OpenAI error:', err.message);
    res.status(502).json({ error: 'Failed to generate conversation starters' });
  }
});

export default router;
