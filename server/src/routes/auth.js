import { Router } from 'express';
import jwt from 'jsonwebtoken';
import accounts from '../data/demo-accounts.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dailyfirst-demo-secret-2026';
const TOKEN_TTL  = '7d';

function sign(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, forcedCondition: user.forcedCondition },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

/* POST /api/auth/login */
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });

  const user = accounts.find(
    a => a.email.toLowerCase() === email.toLowerCase() && a.password === password
  );
  if (!user)
    return res.status(401).json({ error: '이메일 또는 비밀번호가 틀렸어요.' });

  const token = sign(user);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

/* GET /api/auth/me — validate token */
router.get('/me', (req, res) => {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ id: payload.id, email: payload.email, name: payload.name });
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
});

/* GET /api/auth/accounts — list demo accounts for the login hint UI */
router.get('/accounts', (_req, res) => {
  res.json(accounts.map(a => ({
    email: a.email,
    password: a.password,
    name: a.name,
    forcedCondition: a.forcedCondition,
  })));
});

export default router;
