# Implementation Plan

## Goal

Build a deployable A/B experiment MVP in ~48 hours that answers:
> **Does showing daily-life moments before a profile produce a higher "Want to know more" rate than showing the profile first?**

---

## Phases at a glance

| Phase | What ships | Branch | Merge target |
|---|---|---|---|
| 0 | Project scaffolding + docs | `dev` | `main` ✅ |
| 1 | Core experiment loop (no AI, no crawler) | `feat/*` → `dev` | `dev` |
| 2 | ChatGPT starters + crawler + event logging | `feat/*` → `dev` | `dev` |
| 3 | Survey + polish + deploy | `feat/*` → `dev` | `main` |

---

## Phase 1 — Core experiment loop

**Goal:** A user can open the app, get assigned a condition, browse all candidates, and skip or express interest. No AI, no crawler, no DB yet — just the experiment skeleton running end-to-end.

### Tasks

#### 1-1 · Server bootstrap
**Branch:** `feat/server-bootstrap`

- [ ] `server/package.json` with `express`, `cors`, `dotenv`, `uuid`, `better-sqlite3`
- [ ] `server/src/index.js` — Express app, CORS, static asset serving
- [ ] `server/src/db.js` — SQLite init, create `sessions` / `events` / `survey_responses` tables on startup
- [ ] `server/.env.example`
- [ ] `GET /api/health` route
- [ ] npm script: `dev` (nodemon), `start`

**Done when:** `curl localhost:4000/api/health` returns `{ ok: true }`

---

#### 1-2 · Candidate data
**Branch:** `feat/candidate-data`
**Depends on:** 1-1 (needs server folder structure)

- [ ] `server/src/data/candidates.json` — 6 synthetic candidates, each with `profile` + `dailyMoments`
  - Moments informed by top crawled themes: commute, solo meal, exercise, café, friends evening, late night
  - Occupations and hobbies varied across candidates (no duplicates)
- [ ] `GET /api/candidates/:id` route — returns profile or moments depending on `?condition=`
- [ ] `GET /api/candidates/:id/reveal` route — returns minimal profile (for B condition post-interest)
- [ ] Static asset folder: `server/src/assets/candidate-0N/` — placeholder images (solid color SVGs or Unsplash URLs for now)

**Done when:** `GET /api/candidates/candidate_01?condition=daily_first` returns moments only (no name/job)

---

#### 1-3 · Session + A/B assignment
**Branch:** `feat/session-ab`
**Depends on:** 1-1

- [ ] `GET /api/experiment/start` — generates `sessionId` (uuid), assigns condition (`Math.random() < 0.5`), saves to `sessions` table, returns `{ sessionId, condition, candidateIds }`
- [ ] Condition stays fixed per session (stored in DB + returned to client)
- [ ] Client stores `sessionId` + `condition` in `localStorage` on first load

**Done when:** Two browser tabs hitting `/api/experiment/start` get mixed conditions over several tries; same tab refreshed keeps same condition.

---

#### 1-4 · Client bootstrap
**Branch:** `feat/client-bootstrap`
**Depends on:** 1-3

- [ ] Vite + React setup in `client/`
- [ ] `client/src/api/client.js` — all fetch wrappers (`startExperiment`, `getCandidate`, `revealProfile`)
- [ ] React Router: `/` → Landing, `/experiment` → Experiment, `/complete` → Complete
- [ ] `client/.env.example` with `VITE_API_BASE_URL`
- [ ] Global CSS reset + CSS variables for spacing/color

**Done when:** `npm run dev` opens to Landing page; clicking "시작하기" navigates to `/experiment`

---

#### 1-5 · Landing page
**Branch:** `feat/landing`
**Depends on:** 1-4

- [ ] `Landing.jsx` + `Landing.css`
- [ ] Copy: "프로필보다 하루를 먼저 보면, 사람을 다르게 보게 될까요?"
- [ ] "약 2~3분 소요" subtext
- [ ] "시작하기" CTA → calls `startExperiment()` → navigates to `/experiment`
- [ ] Mobile-first layout

**Done when:** Landing renders cleanly on 390px and 1280px widths.

---

#### 1-6 · Candidate cards (A and B)
**Branch:** `feat/candidate-cards`
**Depends on:** 1-4, 1-2

- [ ] `ProfileCard.jsx` + `ProfileCard.css` — Condition A: photo, name, age, occupation, hobbies, bio
- [ ] `DailyLifeCard.jsx` + `DailyLifeCard.css` — Condition B: 3–4 timestamped moments, no name/job
- [ ] `ProgressBar.jsx` — shows candidate N of total
- [ ] CTA layout identical between A and B: `넘기기` left, `더 알아보고 싶어요` right
- [ ] `Experiment.jsx` — renders correct card based on condition, handles skip/interest

**Done when:** Side-by-side screenshot of A and B cards shows identical CTA position and card height.

---

#### 1-7 · Profile reveal
**Branch:** `feat/profile-reveal`
**Depends on:** 1-6

- [ ] `ProfileReveal.jsx` + `ProfileReveal.css`
- [ ] Shown only after "더 알아보고 싶어요" in B condition (A skips straight to next step)
- [ ] Shows: photo, name, age, occupation, hobbies + 2 highlight moments from earlier
- [ ] CTA: "이 사람과 대화를 시작해보고 싶어요" / "다음 사람 보기"

**Done when:** B condition user sees moments → clicks interest → sees reveal; A condition user clicks interest → skips reveal.

---

### Phase 1 exit criteria

- Full candidate loop works: Landing → condition assigned → all 6 candidates → Complete page
- A/B cards render correctly for each condition
- Profile reveal only shows in B condition
- No console errors
- Works on mobile (390px)

---

## Phase 2 — AI + crawler + event logging

**Goal:** Wire up ChatGPT conversation starters, build the crawler, and log all behavior events to SQLite.

### Tasks

#### 2-1 · Event logging
**Branch:** `feat/event-logging`
**Depends on:** Phase 1 complete

- [ ] `POST /api/events` route — validates payload, inserts into `events` table
- [ ] `postEvent()` in `client.js`
- [ ] Fire events at every interaction:
  - `session_started` on experiment start
  - `candidate_viewed` when card renders
  - `candidate_skipped` on skip
  - `candidate_interested` on interest click
  - `profile_revealed` when reveal shows (B only)
  - `conversation_intent_clicked`
  - `experiment_completed`
- [ ] `elapsedMs` = timestamp of event − timestamp of `candidate_viewed`

**Done when:** Completing one full session generates a clean event sequence in SQLite; `/analyze-events` skill reads it correctly.

---

#### 2-2 · ChatGPT conversation starters
**Branch:** `feat/conversation-starter`
**Depends on:** 2-1 (needs event logging for `ai_starter_generated`)

- [ ] `server/src/services/openai.js` — wraps OpenAI SDK, enforces prompt constraints
- [ ] System prompt: observe daily clues, generate 3 casual Korean questions, no personality/sensitivity inferences
- [ ] `POST /api/conversation-starters` — fetches candidate from JSON, calls openai service
- [ ] Hardcoded fallback questions if OpenAI fails or times out
- [ ] `ConversationStarter.jsx` — shows 3 questions, "이 질문으로 시작하기" + "다시 추천" buttons
- [ ] Fire `ai_starter_generated`, `ai_starter_regenerated`, `ai_starter_used` events

**Done when:** After profile reveal, 3 questions appear within 3s; "다시 추천" returns a different set; OpenAI key removed → fallback questions show.

---

#### 2-3 · Crawler
**Branch:** `feat/crawler`
**Depends on:** none (standalone script)

- [ ] `crawler/package.json` with `axios`, `cheerio`
- [ ] `crawler/crawl.js` — target 3–5 public URLs (Setlog team interview, news articles)
- [ ] Extracts: page title, source URL, recurring daily-life phrases
- [ ] Maps phrases to theme keys: `commute`, `solo_meal`, `exercise`, `cafe`, `friends_evening`, `wake_sleep`
- [ ] Outputs `crawler/output.json` with per-source themes + `themeSummary` counts
- [ ] README note: which URLs were crawled, what was extracted, how it informed candidate moments

**Done when:** `node crawler/crawl.js` runs without error; `output.json` shows ≥3 sources with theme counts; top themes match the moments already in `candidates.json`.

---

### Phase 2 exit criteria

- Every interaction fires the correct event to SQLite
- ChatGPT returns 3 questions; fallback works without API key
- Crawler runs and produces `output.json`
- `/analyze-events` skill produces a readable A/B summary from the DB

---

## Phase 3 — Survey + polish + deploy

**Goal:** Complete the experiment loop with an exit survey, polish the UI for evaluators, and deploy.

### Tasks

#### 3-1 · Exit survey
**Branch:** `feat/survey`
**Depends on:** Phase 2 complete

- [ ] `Complete.jsx` — shown after last candidate
- [ ] Q1: radio — which info helped most (5 options)
- [ ] Q2: 5-point scale — "이 방식으로 새로운 사람을 더 만나보고 싶나요?"
- [ ] Q3: optional free text
- [ ] `POST /api/survey` route — saves to `survey_responses`
- [ ] Fire `survey_submitted` event

---

#### 3-2 · Loading, error, and empty states
**Branch:** `feat/ui-polish`
**Depends on:** all feat branches

- [ ] Spinner/skeleton while candidate card loads
- [ ] Error state if `/api/experiment/start` fails
- [ ] Fallback if image fails to load (CSS background color)
- [ ] "다시 추천" loading state while ChatGPT fetches

---

#### 3-3 · Mobile QA
**Branch:** `feat/ui-polish` (same branch)

- [ ] Test at 390px (iPhone 14 Pro)
- [ ] Test at 768px (tablet)
- [ ] Test at 1280px (desktop)
- [ ] No horizontal scroll
- [ ] Tap targets ≥ 44px

---

#### 3-4 · Deploy
**Branch:** `feat/deploy-config`

- [ ] `client/vercel.json` — SPA rewrite rule (`/*` → `/index.html`)
- [ ] `server/` — verify `process.env.PORT` used (Render sets this)
- [ ] Set env vars on Render: `OPENAI_API_KEY`, `CLIENT_ORIGIN`
- [ ] Set env var on Vercel: `VITE_API_BASE_URL`
- [ ] Deploy both; smoke test full flow on production URLs
- [ ] Add production URL to README

---

#### 3-5 · README
**Branch:** `feat/readme`

- [ ] Service link (배포 URL)
- [ ] 구현 설명 — what was built and why this scope
- [ ] 강조하고 싶은 부분 — A/B control methodology, crawler → seed pipeline, AI prompt constraints
- [ ] 주요 설계 의도 — why same candidates, why AI is downstream of curiosity, why crawling feeds data not a feature
- [ ] 어려움과 해결 방법 — actual blockers encountered
- [ ] 아쉬웠던 점 — what real production would add (real user moments, statistical significance, etc.)

---

### Phase 3 exit criteria

- Full flow works on production URL: Landing → experiment → reveal → AI questions → survey → complete
- Mobile layout clean on 390px
- README complete with deployed link
- All events logged to production DB

---

## Final step (after everything above is done)

```
git checkout dev && git pull
git checkout main && git merge dev
git push origin main
```

Then add `recruit@ilevit.com` as GitHub Collaborator.

**Do not add collaborator until this step.**

---

## Risk log

| Risk | Likelihood | Mitigation |
|---|---|---|
| OpenAI API latency | Medium | Hardcoded fallback questions; 10s timeout |
| Render cold start (free tier) | High | Add loading state on client; pre-ping on deploy |
| Crawl targets block scraper | Medium | Use 3s delay between requests; target news articles not apps |
| SQLite write failures on Render | Low | Render provides persistent disk; confirm volume mount |
| Running out of time | Medium | Phase 1 alone is a shippable experiment; Phase 2–3 add depth |
