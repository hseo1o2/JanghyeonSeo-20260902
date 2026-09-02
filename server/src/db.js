import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'experiment.db');

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id         TEXT PRIMARY KEY,
    condition  TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS events (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id   TEXT NOT NULL,
    condition    TEXT NOT NULL,
    candidate_id TEXT,
    event        TEXT NOT NULL,
    elapsed_ms   INTEGER DEFAULT 0,
    metadata     TEXT,
    timestamp    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS survey_responses (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id   TEXT NOT NULL,
    condition    TEXT NOT NULL,
    q1_reason    TEXT,
    q2_score     INTEGER,
    q3_freetext  TEXT,
    submitted_at TEXT NOT NULL
  );
`);

export default db;
