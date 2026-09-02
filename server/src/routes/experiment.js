import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import db from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const candidates = JSON.parse(
  readFileSync(path.join(__dirname, '../data/candidates.json'), 'utf-8')
);

const CANDIDATE_IDS = candidates.map(c => c.id);

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
      candidateIds: CANDIDATE_IDS,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start experiment' });
  }
});

export default router;
