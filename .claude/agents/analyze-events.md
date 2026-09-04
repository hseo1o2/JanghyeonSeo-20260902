---
name: analyze-events
description: Read the SQLite events database and produce a concise A/B experiment summary. Shows Want-to-know-more Rate per condition, median decision time, profile reveal rate, and conversation intent rate. Use after collecting real session data to check if Daily-life-first is outperforming Profile-first.
---

You are analyzing the behavioral event data from this A/B experiment MVP.

## Context

This project tests whether showing daily-life moments before a profile (Condition B: `daily_first`) produces a higher "Want to know more" rate than showing the profile first (Condition A: `profile_first`). Events are stored in SQLite at `server/src/db/experiment.db` (or `server/experiment.db` — check both).

See `docs/experiment-spec.md` for full metric definitions and `docs/data-model.md` for the event schema.

## Your task

1. Check that the database file exists. If it does not, say so clearly and stop.
2. Run the following analyses using the Bash tool with `sqlite3`:

### Primary metric
```sql
-- Want-to-know-more Rate per condition
SELECT
  condition,
  COUNT(CASE WHEN event = 'candidate_interested' THEN 1 END) AS interested,
  COUNT(CASE WHEN event = 'candidate_viewed' THEN 1 END) AS viewed,
  ROUND(
    100.0 * COUNT(CASE WHEN event = 'candidate_interested' THEN 1 END)
    / NULLIF(COUNT(CASE WHEN event = 'candidate_viewed' THEN 1 END), 0),
    1
  ) AS want_to_know_more_rate_pct
FROM events
GROUP BY condition;
```

### Secondary metrics
```sql
-- Median decision time (approximate: use AVG as proxy for small samples)
SELECT condition,
  ROUND(AVG(elapsed_ms) / 1000.0, 1) AS avg_decision_sec
FROM events
WHERE event IN ('candidate_interested', 'candidate_skipped')
GROUP BY condition;

-- Profile reveal rate (B condition: how many interested → actually saw profile)
SELECT
  condition,
  COUNT(CASE WHEN event = 'profile_revealed' THEN 1 END) AS revealed,
  COUNT(CASE WHEN event = 'candidate_interested' THEN 1 END) AS interested,
  ROUND(
    100.0 * COUNT(CASE WHEN event = 'profile_revealed' THEN 1 END)
    / NULLIF(COUNT(CASE WHEN event = 'candidate_interested' THEN 1 END), 0),
    1
  ) AS reveal_rate_pct
FROM events
GROUP BY condition;

-- Conversation intent rate
SELECT
  condition,
  COUNT(CASE WHEN event = 'conversation_intent_clicked' THEN 1 END) AS intent,
  COUNT(CASE WHEN event = 'profile_revealed' THEN 1 END) AS revealed,
  ROUND(
    100.0 * COUNT(CASE WHEN event = 'conversation_intent_clicked' THEN 1 END)
    / NULLIF(COUNT(CASE WHEN event = 'profile_revealed' THEN 1 END), 0),
    1
  ) AS conversation_intent_pct
FROM events
GROUP BY condition;

-- Session count per condition
SELECT condition, COUNT(DISTINCT session_id) AS sessions
FROM events GROUP BY condition;
```

### Survey summary (if data exists)
```sql
SELECT condition, q1_reason, COUNT(*) AS count
FROM survey_responses
GROUP BY condition, q1_reason
ORDER BY condition, count DESC;

SELECT condition, ROUND(AVG(q2_score), 2) AS avg_score
FROM survey_responses
GROUP BY condition;
```

3. Present the results in a clean markdown table with a 2–3 sentence interpretation.

## Interpretation guide

- If B rate > A rate by more than 5–10 percentage points: promising signal for the daily-life-first hypothesis
- If rates are similar (within 5pp): order alone may be insufficient; look at decision time and survey reasons
- If B rate < A rate: profile-first may be providing necessary anchoring; hypothesis needs revision
- Always note sample size — small n means the signal is directional, not conclusive

## Extensibility note

This skill is designed to grow with the experiment:
- Once real users generate data, add per-candidate breakdown to spot which candidates perform differently across conditions
- A future version could add cohort analysis (time of day, session length) if metadata fields are populated
- The SQL queries are intentionally simple — swap in a real analytics layer (PostHog, Mixpanel) when scale requires it
