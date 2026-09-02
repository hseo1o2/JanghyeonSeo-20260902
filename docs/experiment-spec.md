# Experiment Specification

## Hypothesis

> Given the same candidate, users who see **daily-life moments first** (Condition B) will click "Want to know more" at a higher rate than users who see a **static profile first** (Condition A).

## Conditions

| | Condition A — Profile-first | Condition B — Daily-life-first |
|---|---|---|
| First screen | Photo + name + age + job + hobbies + bio | 3–4 timestamped daily moments (no name/job) |
| CTA | Skip / Want to know more | Skip / Want to know more |
| After "Want to know more" | Next step | Minimal profile revealed, then next step |

**Control:** Same candidate set, same order, same CTA placement, same UI density.  
**Variable:** What information is shown first.

## Assignment

- Random at session start: `Math.random() < 0.5 ? "profile_first" : "daily_first"`
- Stored in localStorage + server session so refresh doesn't re-roll
- One user sees only one condition

## Metrics

### Primary
**Want-to-know-more Rate**
```
candidate_interested count / candidate_viewed count
```
Compare A vs B across all candidates.

### Secondary
| Metric | How measured |
|---|---|
| Median decision time | `elapsedMs` on `candidate_interested` or `candidate_skipped` |
| Profile reveal completion | `profile_revealed` after `candidate_interested` |
| Conversation intent rate | `conversation_intent_clicked` / `profile_revealed` |
| AI starter engagement | `ai_starter_used` / `ai_starter_generated` |
| AI re-generation rate | `ai_starter_regenerated` / `ai_starter_generated` |

### Survey signal
Q1 options map to reasons:
- `daily_concrete` — "생활이 구체적으로 보여서"
- `common_ground` — "공통점이 보여서"
- `less_judged` — "바로 평가하는 느낌이 덜해서"
- `profile_info` — "사진/프로필 정보"
- `other`

## Success / failure criteria

| Result | Interpretation | Next action |
|---|---|---|
| B significantly > A | Daily-life-first increases curiosity | Expand to real user-generated daily moments |
| B ≈ A | Order alone is insufficient | Investigate which specific moments drove engagement; refine hypothesis |
| B < A | Hypothesis not supported | Reconsider whether profile removal creates confusion rather than curiosity |

## Constraints

- Synthetic candidates only — no real user data
- Evaluator will see the code and event schema, not necessarily real session data
- Statistical significance is not expected at this scale — behavior signal is the goal
