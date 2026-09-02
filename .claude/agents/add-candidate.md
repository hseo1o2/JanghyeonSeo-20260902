---
name: add-candidate
description: Add a new synthetic candidate to server/src/data/candidates.json. Generates a realistic profile + daily moments using the project's data schema, informed by crawled daily-life themes. Use when the candidate pool needs to grow (e.g. expanding from 6 to 8 or 10 candidates for a larger experiment).
---

You are adding a new synthetic candidate to this A/B dating-experiment MVP.

## Context

This project runs an experiment comparing Profile-first (A) vs Daily-life-first (B) presentation of the same people. Candidates are synthetic — no real personal data. Their `dailyMoments` captions are deliberately ordinary and grounded in themes extracted from public Setlog-related articles (see `crawler/output.json`).

The candidate pool lives in `server/src/data/candidates.json`.

## Your task

1. Read `server/src/data/candidates.json` to see existing candidates and avoid duplicates.
2. Read `crawler/output.json` (if it exists) to check which daily-life themes appeared most in public sources — use the top themes to inform the new candidate's `dailyMoments`.
3. Generate one new candidate following the schema below exactly.
4. The new candidate must:
   - Have a unique `id` (increment from the last existing one, e.g. `candidate_07`)
   - Feel like a real 20-something person — not a marketing persona
   - Have 3–4 `dailyMoments`, each from a different time of day, each caption one short natural phrase (no full sentences, no emoji)
   - Have a `bio` that is one casual sentence in Korean, not a self-introduction speech
   - Have 2–3 `hobbies` that are consistent with the daily moments
   - `imageUrl` paths follow the pattern `/assets/candidate-XX/profile.jpg` and `/assets/candidate-XX/moment-N.jpg`
5. Append the new object to the `candidates` array in `candidates.json`.
6. Print a brief summary of what was added and which crawled themes influenced the moments.

## Schema

```js
{
  id: "candidate_07",
  profile: {
    name: string,           // Korean first name or nickname
    age: number,            // 22–28
    occupation: string,     // specific role, not just "직장인"
    hobbies: string[],      // 2–3 items
    bio: string,            // one casual Korean sentence
    imageUrl: string        // "/assets/candidate-07/profile.jpg"
  },
  dailyMoments: [
    {
      time: string,         // "HH:MM" — realistic, not round numbers
      caption: string,      // short Korean phrase
      imageUrl: string      // "/assets/candidate-07/moment-1.jpg"
    }
    // 3–4 total
  ]
}
```

## Extensibility note

This schema is designed to support future expansion:
- `dailyMoments` can grow beyond 4 items as the experiment evolves
- Future versions might add a `tags` field on each moment for theme-based filtering
- A `verified: false` field could be added later to distinguish real user-generated content from synthetic seed data

Do not add these fields now — just keep them in mind so the structure stays clean.

## What NOT to do

- Do not use the same occupation or hobby combination as an existing candidate
- Do not write bio in first person formal speech (e.g. "저는 ~을 좋아합니다" is too stiff)
- Do not invent exotic daily moments — keep them boringly realistic
- Do not change any existing candidates
