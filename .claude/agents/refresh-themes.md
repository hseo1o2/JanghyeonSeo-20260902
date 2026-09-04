---
name: refresh-themes
description: Run the crawler to collect daily-life themes from public Setlog-related articles, then update crawler/output.json and sync the top themes into server/src/data/candidates.json moment captions where relevant. Use before finalizing candidate data or when adding new candidates to ensure the seed data reflects real cultural patterns.
---

You are refreshing the crawled theme data that informs synthetic candidate daily moments.

## Context

This experiment's candidates are synthetic, but their `dailyMoments` are grounded in real cultural patterns extracted from public articles about Setlog (the daily-vlog app that inspired this product concept). The crawler reads public article text and extracts recurring daily-life scene types — commute, solo meal, exercise, café, friends evening, late night — which then inform the captions used in candidate cards.

This is how the pipeline flows:
```
public article text
  → crawler/crawl.js
  → crawler/output.json  (raw themes per source)
  → server/src/data/candidates.json (moments refined to match top themes)
```

## Your task

1. Check that `crawler/crawl.js` exists. If not, say so and stop — the crawler must be built first.

2. Run the crawler:
```bash
cd crawler && node crawl.js
```

3. Read `crawler/output.json`. Show a summary of:
   - How many sources were successfully crawled
   - Which sources failed (if any) and why
   - The `themeSummary` counts — which themes appeared most

4. Compare the top 4–5 themes to the `dailyMoments` currently in `server/src/data/candidates.json`.
   - Are the top themes already represented across the candidate pool?
   - Are any top themes missing entirely?

5. If gaps exist, suggest specific caption edits for existing candidates to better reflect the top themes. Do not auto-apply — show the diff and ask for confirmation.

6. Update `crawler/output.json` in place with the fresh results (the crawler should do this automatically).

## Theme → moment caption mapping guide

| Theme key | Example Korean captions |
|---|---|
| `commute` | "버스 안에서", "지하철 환승", "비 와서 버스 대신 지하철" |
| `solo_meal` | "혼자 점심", "회사 근처에서 혼밥", "편의점 도시락" |
| `exercise` | "퇴근 후 한강 5km", "헬스장 마감 직전", "동네 한 바퀴" |
| `cafe` | "카페에서 작업", "스터디카페 3시간", "새 카페 발견" |
| `friends_evening` | "친구들이랑 보드게임", "동네 술 한 잔", "집에서 같이 밥" |
| `wake_sleep` | "7시 알람 끄고 다시", "새벽 1시 귀가", "오늘도 늦잠" |
| `work_focus` | "마감 전날", "야근 중", "점심도 책상에서" |

## Extensibility note

The crawler is intentionally narrow now (public articles only, no login, no scraping private accounts). Future versions could:
- Add App Store review crawling (public) for user-language signal
- Add Reddit/Twitter/커뮤니티 public posts for broader cultural context
- Feed themes into the OpenAI prompt for conversation starters (not just candidate captions)

Do not implement these now — the current scope is sufficient to demonstrate the pipeline to evaluators.

## What NOT to do

- Do not crawl pages that require login
- Do not store full article text — only extracted themes and source URLs
- Do not auto-edit candidates.json without showing the proposed changes first
- Do not modify the crawler script itself unless it fails to run
