import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import './db.js'; // initializes tables on startup
import healthRouter from './routes/health.js';
import candidatesRouter from './routes/candidates.js';
import experimentRouter from './routes/experiment.js';
import eventsRouter from './routes/events.js';
import startersRouter from './routes/starters.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

const app = express();

const corsOrigin = process.env.CLIENT_ORIGIN || '*';
if (!process.env.CLIENT_ORIGIN) {
  console.warn('[CORS] CLIENT_ORIGIN not set — defaulting to wildcard. Set it in production.');
}
app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/api/health', healthRouter);
app.use('/api/experiment', experimentRouter);
app.use('/api/candidates', candidatesRouter);
app.use('/api/events', eventsRouter);
app.use('/api/conversation-starters', startersRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
