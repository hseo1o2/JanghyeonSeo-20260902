# Data Model

## Candidate schema

```js
{
  id: string,           // "candidate_01" ... "candidate_08"
  profile: {
    name: string,       // first name or nickname
    age: number,
    occupation: string,
    hobbies: string[],  // 2–3 items
    bio: string,        // one sentence
    imageUrl: string    // "/assets/candidate-XX/profile.jpg"
  },
  dailyMoments: [       // 3–4 items, chronological
    {
      time: string,     // "HH:MM"
      caption: string,  // one short phrase, no name
      imageUrl: string  // "/assets/candidate-XX/moment-N.jpg"
    }
  ]
}
```

## Event schema

```js
{
  sessionId: string,    // uuid v4, generated at session start
  condition: string,    // "profile_first" | "daily_first"
  candidateId: string,  // "candidate_01" etc.
  event: string,        // see event names below
  elapsedMs: number,    // ms since this candidate was first shown (0 for session events)
  metadata: object,     // event-specific extra fields (optional)
  timestamp: string     // ISO 8601 UTC
}
```

### Event names

| Event | Fired when |
|---|---|
| `session_started` | User clicks "시작하기"; condition is assigned |
| `candidate_viewed` | A candidate card becomes visible |
| `candidate_skipped` | User clicks "넘기기" |
| `candidate_interested` | User clicks "더 알아보고 싶어요" |
| `profile_revealed` | Minimal profile is shown (B condition only; or post-A-choice) |
| `conversation_intent_clicked` | User clicks "대화를 시작해보고 싶어요" |
| `ai_starter_generated` | ChatGPT returns 3 questions |
| `ai_starter_regenerated` | User clicks "다시 추천" |
| `ai_starter_used` | User clicks "이 질문으로 시작하기" |
| `survey_submitted` | User submits the exit survey |
| `experiment_completed` | All candidates seen and survey done |

## SQLite tables

### sessions
```sql
CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,  -- uuid
  condition   TEXT NOT NULL,     -- profile_first | daily_first
  created_at  TEXT NOT NULL      -- ISO 8601
);
```

### events
```sql
CREATE TABLE events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT NOT NULL,
  condition    TEXT NOT NULL,
  candidate_id TEXT,
  event        TEXT NOT NULL,
  elapsed_ms   INTEGER DEFAULT 0,
  metadata     TEXT,             -- JSON string
  timestamp    TEXT NOT NULL
);
```

### survey_responses
```sql
CREATE TABLE survey_responses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  condition   TEXT NOT NULL,
  q1_reason   TEXT,             -- daily_concrete | common_ground | less_judged | profile_info | other
  q2_score    INTEGER,          -- 1–5
  q3_freetext TEXT,
  submitted_at TEXT NOT NULL
);
```

## Crawled themes schema (crawler/output.json)

```js
{
  crawledAt: string,            // ISO 8601
  sources: [
    {
      url: string,
      title: string,
      extractedThemes: string[] // e.g. ["commute", "solo_meal", "exercise"]
    }
  ],
  themeSummary: {               // aggregated counts across all sources
    commute: number,
    solo_meal: number,
    exercise: number,
    cafe: number,
    friends_evening: number,
    wake_sleep: number,
    other: number
  }
}
```

The top themes from `themeSummary` directly map to the `dailyMoments` captions used in candidate cards.
