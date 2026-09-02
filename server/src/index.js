import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import './db.js'; // initializes tables on startup
import healthRouter from './routes/health.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/api/health', healthRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
