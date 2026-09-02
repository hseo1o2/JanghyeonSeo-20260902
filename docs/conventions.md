# Development Conventions

## Branch strategy

```
main
└─ dev          ← integration branch; all features merge here first
   ├─ feat/landing
   ├─ feat/experiment-ab
   ├─ feat/profile-card
   ├─ feat/daily-life-card
   ├─ feat/profile-reveal
   ├─ feat/conversation-starter
   ├─ feat/event-logging
   ├─ feat/crawler
   ├─ feat/survey
   └─ fix/*
```

- **`main`** — deployable at all times; only merged from `dev` when a phase is complete
- **`dev`** — working branch; features branch off here and merge back via PR (or direct push given solo dev + time constraint)
- **`feat/<name>`** — one logical feature per branch
- **`fix/<name>`** — bug fixes
- Never commit directly to `main`

### Merge flow (solo, time-constrained)
```
feat/xxx → dev  (squash merge preferred)
dev → main      (only when phase is shippable)
```

---

## Commit message format

```
<type>(<scope>): <short description>

[optional body]
```

**Types**
| Type | When |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Setup, deps, config |
| `refactor` | Code change with no behavior change |
| `style` | CSS / visual only |
| `data` | Candidate JSON, crawled output |
| `docs` | Documentation only |

**Scope examples:** `client`, `server`, `crawler`, `db`, `openai`, `experiment`

**Examples**
```
feat(experiment): add A/B condition assignment at session start
feat(client): build DailyLifeCard component
fix(server): handle OpenAI timeout with fallback questions
data(candidates): add candidate_03 through candidate_06
chore(server): add better-sqlite3 and configure db.js
docs: add API spec and data model
```

---

## Code conventions

### JavaScript (both client and server)
- ES modules (`import/export`) everywhere
- No TypeScript (task constraint)
- `const` by default; `let` only when reassignment is needed
- Arrow functions for callbacks; named functions for route handlers and services
- No `var`

### React (client)
- Functional components only; no class components
- One component per file; filename matches component name (`DailyLifeCard.jsx`)
- Props destructured in function signature
- No prop-types (time constraint; types documented in `docs/data-model.md`)
- CSS: plain CSS files co-located with component (`DailyLifeCard.css`)

### File naming
| What | Convention | Example |
|---|---|---|
| React components | PascalCase | `ProfileReveal.jsx` |
| Pages | PascalCase | `Experiment.jsx` |
| Utilities / hooks | camelCase | `useSession.js` |
| CSS | same as component | `ProfileReveal.css` |
| Server routes | camelCase | `events.js` |
| Server services | camelCase | `openai.js` |
| Data files | kebab-case | `candidates.json` |

### API client (client/src/api/client.js)
All `fetch` calls live in `client.js`. Components never call `fetch` directly.

```js
// good
import { postEvent } from '../api/client.js'
await postEvent({ sessionId, event: 'candidate_viewed', ... })

// bad — fetch inside component
const res = await fetch('/api/events', { method: 'POST', ... })
```

### Error handling
- Server: all route handlers wrapped in try/catch; always return `{ error: string }` on failure
- Client: loading and error states for every async action; never leave UI stuck

---

## Environment variables

Never commit `.env` files. Reference only:
- `server/.env.example` — template with key names, no values
- `client/.env.example` — same

---

## Asset conventions

Candidate images go in: `server/src/assets/candidate-XX/`
- `profile.jpg` — main profile photo
- `moment-1.jpg` through `moment-4.jpg` — daily moments

Images served as static files from the Express server.  
Placeholder images used during development (e.g. from Unsplash or local SVG placeholders).

---

## What we explicitly do not add

- ESLint / Prettier (time constraint; keep it simple)
- Testing (time constraint)
- TypeScript
- Redux or Zustand (React state is sufficient for this scope)
- Tailwind (plain CSS for clarity)
