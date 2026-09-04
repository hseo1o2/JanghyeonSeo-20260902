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
