# CLAUDE.md — AI Collaboration Guide

This file tells Claude (and other AI assistants) everything needed to work effectively on this project without re-reading the full conversation history.

---

## What this project is

A web MVP that runs an A/B experiment: does showing someone's **daily-life moments before their profile** make users more curious about them?

- **Condition A (Profile-first):** Show photo + name + age + job + hobbies + bio → user decides
- **Condition B (Daily-life-first):** Show 3–4 timestamped daily moments → user decides → profile revealed only if interested

The single question this MVP must answer:
> **Does Daily-life-first produce a higher "Want to know more" rate than Profile-first, for the same set of candidates?**

See `docs/experiment-spec.md` for full hypothesis, metrics, and success criteria.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + JavaScript (Vite) | Required by task |
| Backend | Node.js + Express + JavaScript | Required by task |
| Database | SQLite (better-sqlite3) | Fast local writes, no external service needed |
| AI | OpenAI ChatGPT API | Conversation starter generation |
| Crawler | Node.js script (cheerio + axios) | Seed data collection from public articles |
| Deploy | Vercel (client) + Render (server) | Free tier, separate domains |

---

## Folder structure

```
root/
├─ client/                  # React app → deploys to Vercel
│  ├─ src/
│  │  ├─ pages/
│  │  │  ├─ Landing.jsx
│  │  │  ├─ Experiment.jsx
│  │  │  └─ Complete.jsx
│  │  ├─ components/
│  │  │  ├─ ProfileCard.jsx
│  │  │  ├─ DailyLifeCard.jsx
│  │  │  ├─ ProfileReveal.jsx
│  │  │  ├─ ConversationStarter.jsx
│  │  │  └─ ProgressBar.jsx
│  │  ├─ api/
│  │  │  └─ client.js       # all fetch calls to /api/*
│  │  └─ main.jsx
│  └─ package.json
│
├─ server/                  # Express app → deploys to Render
│  ├─ src/
│  │  ├─ routes/
│  │  │  ├─ experiment.js   # GET /api/experiment/start
│  │  │  ├─ candidates.js   # GET /api/candidates/:id
│  │  │  ├─ events.js       # POST /api/events
│  │  │  ├─ starters.js     # POST /api/conversation-starters
│  │  │  └─ survey.js       # POST /api/survey
│  │  ├─ services/
│  │  │  └─ openai.js
│  │  ├─ data/
│  │  │  ├─ candidates.json
│  │  │  └─ crawled-themes.json
│  │  ├─ db.js              # SQLite setup
│  │  └─ index.js
│  └─ package.json
│
├─ crawler/
│  ├─ crawl.js
│  └─ output.json
│
├─ docs/                    # Design docs (this folder)
└─ CLAUDE.md                # ← you are here
```

---

## Key design decisions

### Why A/B and not just B?
Without a control group, we can't know if daily-life cards produce more curiosity or just more clicks in general. Same candidates must appear in both conditions.

### Why synthetic candidates (not real users)?
This is an experiment about information ordering, not about real people. Synthetic profiles let us control for attractiveness bias.

### Why is ChatGPT only shown after "Want to know more"?
AI is not the hypothesis. It only reduces the friction of starting a conversation after curiosity is already established. If we led with AI, we'd be testing the wrong thing.

### Why is crawling tied to candidate data (not a feature)?
The task requires crawling. The honest use: public articles about Setlog surface recurring daily-life themes (commute, solo lunch, exercise, late-night friends). Those themes directly inform the synthetic candidates' `dailyMoments` captions.

Flow: `public article text → crawler → normalized themes → candidate moments JSON → frontend cards`

---

## Strict scope limits — do NOT add these

- Login / signup
- Real user profiles
- Real matching
- Real-time chat
- Recommendation algorithm
- Push notifications
- Admin dashboard
- AI personality / compatibility scoring

If a feature isn't required to answer the core experiment question, it does not belong in this MVP.

---

## Environment variables

### server/.env
```
OPENAI_API_KEY=sk-...
PORT=4000
CLIENT_ORIGIN=https://your-vercel-url.vercel.app
```

### client/.env
```
VITE_API_BASE_URL=https://your-render-url.onrender.com
```

---

## Running locally

```bash
# server
cd server && npm install && npm run dev

# client (separate terminal)
cd client && npm install && npm run dev
```

---

## Event schema (quick reference)

```js
{
  sessionId,          // uuid
  condition,          // "profile_first" | "daily_first"
  candidateId,        // "candidate_01" ... "candidate_08"
  event,              // see docs/event-schema.md
  elapsedMs,          // ms since candidate was first shown
  timestamp           // ISO 8601
}
```

Primary metric: `candidate_interested / candidate_viewed` per condition.

See `docs/experiment-spec.md` for full metric definitions.

---

## Candidate data shape (quick reference)

```js
{
  id: "candidate_01",
  profile: {
    name, age, occupation, hobbies[], bio, imageUrl
  },
  dailyMoments: [
    { time, caption, imageUrl }   // 3–4 moments, chronological
  ]
}
```

See `docs/data-model.md` for full schema and all 6–8 candidates.

---

## What good output looks like

- A/B condition stays fixed for the full session (no re-roll on refresh)
- Same candidate set, same order, in both conditions
- CTA position and UI density identical between A and B
- Every candidate interaction logged before moving to next
- ChatGPT prompt never infers personality, attractiveness, or sensitive traits
- Crawler reads only public text; no login, no scraping private accounts
