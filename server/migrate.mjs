import pg from 'pg';
import 'dotenv/config';
const { Client } = pg;

const client = new Client({
  connectionString: `postgresql://postgres.sabxyybsadhregtyqrre:DailyFirst2026!@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log('Connected to Supabase');

await client.query(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    condition TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    condition TEXT NOT NULL,
    candidate_id TEXT,
    event TEXT NOT NULL,
    elapsed_ms INTEGER DEFAULT 0,
    metadata JSONB,
    timestamp TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS survey_responses (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    condition TEXT NOT NULL,
    q1_reason TEXT,
    q2_score INTEGER,
    q3_freetext TEXT,
    submitted_at TEXT NOT NULL
  );
`);

console.log('All tables created');
await client.end();
