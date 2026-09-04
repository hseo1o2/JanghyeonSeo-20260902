# Contributing Guide

## Branch strategy

```
main          ← 배포 가능한 상태만 유지
└─ dev        ← 모든 기능이 합쳐지는 통합 브랜치
   ├─ feat/*  ← 기능 단위 작업
   └─ fix/*   ← 버그 수정
```

### Rules

1. `main`에 직접 커밋하지 않는다.
2. 모든 기능은 `dev`에서 분기하고, `dev`로 PR을 올린다.
3. `dev → main`은 배포 가능한 상태가 됐을 때만 머지한다.
4. PR은 인라인 리뷰 기반으로 코드 리뷰 후 머지한다.

### Branch naming

```
feat/<short-description>     # 새 기능
fix/<short-description>      # 버그 수정
chore/<short-description>    # 설정, 의존성
data/<short-description>     # 데이터 파일 변경
docs/<short-description>     # 문서만 변경
```

Examples:
```
feat/landing-page
feat/ab-condition-assignment
feat/daily-life-card
feat/profile-reveal
feat/conversation-starter
feat/event-logging
feat/crawler
fix/openai-timeout-fallback
data/candidates-01-06
```

---

## Commit message format

```
<type>(<scope>): <description>
```

| Type | Use for |
|---|---|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `chore` | 설정, 패키지, 환경 |
| `refactor` | 동작 변경 없는 코드 정리 |
| `style` | CSS/UI 변경 |
| `data` | JSON 데이터 변경 |
| `docs` | 문서 변경 |

| Scope | Refers to |
|---|---|
| `client` | React 앱 전체 |
| `server` | Express 서버 전체 |
| `db` | SQLite 스키마, db.js |
| `openai` | OpenAI 서비스 |
| `crawler` | 크롤러 스크립트 |
| `experiment` | A/B 조건 로직 |
| `candidates` | 후보 데이터 |

Examples:
```
feat(experiment): assign A/B condition at session start
feat(client): build DailyLifeCard component
feat(server): add POST /api/events route
fix(openai): return fallback questions on API timeout
data(candidates): add candidate_01 through candidate_06
chore(server): configure better-sqlite3 and create tables
style(client): match CTA layout between A and B cards
```

---

## PR workflow

1. `dev`에서 분기: `git checkout -b feat/xxx dev`
2. 작업 후 커밋
3. `dev`로 PR 오픈 — PR 템플릿 채우기
4. 인라인 리뷰 → 코멘트 해결 → 머지
5. 머지 후 브랜치 삭제

## Code review focus

리뷰할 때 특히 확인할 것:

- **A/B 통제 조건**: A와 B의 CTA 위치, UI 밀도가 동일한가?
- **이벤트 누락**: 모든 후보 노출·선택이 로깅되는가?
- **API 키 노출**: `.env` 밖에 키가 없는가?
- **스코프 초과**: 실험 범위 밖의 기능이 추가됐는가?
