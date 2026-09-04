# Daily-First Experiment

> "프로필보다 하루를 먼저 보면, 사람을 다르게 보게 될까요?"

소개팅 앱에서 **정적 프로필(사진+나이+직업)보다 일상 순간을 먼저 보여줬을 때** 호기심 클릭률이 높아지는가를 측정하는 A/B 실험 MVP입니다.

**배포 URL:** https://client-theta-ten-88.vercel.app  
**GitHub:** https://github.com/hseo1o2/JanghyeonSeo-20260902

> **두 조건 모두 보려면**  
> - B (daily_first): https://client-theta-ten-88.vercel.app?condition=daily_first  
> - A (profile_first): https://client-theta-ten-88.vercel.app?condition=profile_first  
> - 세션 초기화: 브라우저 콘솔에서 `localStorage.clear()` 후 새로고침

---

## 구현 설명

### 실험 설계

- **Condition A (profile_first):** 프로필 카드(사진·이름·나이·직업·취미·자기소개) → 관심 / 스킵
- **Condition B (daily_first):** 타임스탬프 일상 카드 3~4장 → 관심 클릭 → 프로필 공개 → 대화 시작 AI 제안

세션 시작 시 `Math.random()`으로 조건을 배정하고 localStorage + Supabase에 고정합니다. 새로고침해도 조건이 바뀌지 않습니다.

### 이벤트 수집 구조

모든 유저 행동을 `events` 테이블에 기록합니다.

| 이벤트 | 시점 |
|---|---|
| `candidate_viewed` | 후보 카드 로드 직후 |
| `candidate_skipped` | 스킵 버튼 클릭 |
| `candidate_interested` | 더 알아보고 싶어요 클릭 |
| `profile_revealed` | 프로필 공개 완료 (daily_first) |
| `conversation_intent_clicked` | 대화 시작 버튼 클릭 |

핵심 지표: `candidate_interested / candidate_viewed` per condition

### 크롤러 연결

`crawler/crawl.js`로 수집한 공개 아티클 테마(출퇴근·혼밥·운동·심야 약속 등)가 후보자의 `dailyMoments` 캡션에 반영됩니다. 실제 사람이 아닌 합성 후보이지만 현실적인 일상 텍스트를 사용합니다.

---

## 강조하고 싶은 부분

### 1. 실험 통제
**CTA(하단 버튼)는 두 조건에서 동일합니다.** 위치·텍스트·레이아웃 모두 같습니다. 카드 본체는 실험 변수입니다: A는 프로필 전체(사진·이름·나이·직업·취미·소개), B는 타임스탬프 일상 장면입니다. 같은 후보 집합을 같은 순서로 제공합니다.

### 2. conversation_intent_clicked 이벤트 타이밍
AI 대화 시작 버튼은 OpenAI 응답이 **성공적으로 도착한 후**에만 이벤트를 기록합니다. 네트워크 오류로 대화 목록을 못 받은 경우 의도 이벤트가 남지 않아 지표가 오염되지 않습니다.

### 3. 세션 고정
`seededShuffle(candidateIds, sessionId)`로 같은 세션에서는 항상 동일한 후보 순서가 나옵니다. 새로고침·중도 이탈 후 복귀해도 실험이 이어집니다.

### 4. 모바일 퍼스트 레이아웃
실제 소개팅 앱 맥락에 맞게 max-width 430px 폰 프레임으로 제한하고, `100dvh`(dynamic viewport height)로 iOS Safari 주소창 변화에 대응합니다. CTA는 항상 화면 하단에 고정됩니다.

---

## 주요 설계 의도

**왜 대화 AI는 daily_first에만?**
`candidate_interested` 이후 프로필이 공개될 때 "어떻게 말 걸지"의 마찰을 줄이는 게 목적입니다. AI가 가설이 아니라 UX 보조 수단이기 때문에, profile_first에는 넣지 않았습니다. AI를 먼저 보여주면 AI를 테스트하는 게 되어버립니다.

**왜 실제 사용자 프로필이 아닌 합성 후보?**
매력도 편향을 제거하기 위해서입니다. 실험은 *정보 순서*의 효과를 측정하는 것이지 특정 인물의 매력을 측정하는 게 아닙니다.

**왜 Supabase?**
Render 무료 티어의 파일시스템은 배포/재시작마다 초기화됩니다. SQLite로는 이벤트 데이터가 유실되어 실험 결과를 수집할 수 없습니다. Supabase는 설정 없이 영속적 PostgreSQL을 제공합니다.

---

## 구현 과정의 어려움

### Supabase 연결
로컬 네트워크가 Supabase의 직접 PostgreSQL 포트(5432·6543)를 차단하고 있어 CLI/pg 패키지로 마이그레이션이 불가했습니다. Supabase 대시보드 SQL 에디터로 직접 테이블을 생성하고, 이후 REST API로 연결을 검증했습니다.

### iOS Safari `position: fixed` 트랩
`ProfileReveal` 오버레이에 `position: fixed`를 썼는데, 부모 요소에 `transform`이나 `filter`가 있으면 fixed가 뷰포트 기준이 아닌 부모 기준으로 재배치됩니다. `#root`의 `position: relative`를 제거해 트랩을 예방했습니다.

### Vercel 환경변수 누락
`VITE_API_BASE_URL`이 Vercel에 설정되지 않아 프로덕션 빌드가 `localhost:4000`으로 요청을 보내는 문제가 있었습니다. 배포 후 API 통신이 전혀 안 되는 상태였고, Vercel CLI로 추가 후 재배포하여 해결했습니다.

---

## 실험 설계의 한계

현재 설계에서 B 조건의 클릭률이 높아도 두 가지로 해석됩니다.

1. **일상이 더 좋은 시작점이다** — 의도한 해석
2. **정체를 가려서 생긴 호기심 공백 때문이다** — 교란 변수

A는 이미 다 본 뒤 호감을 묻고, B는 정체를 모른 채 열어보고 싶은지 묻습니다. 버튼 텍스트는 같지만 의미가 다릅니다. 더 깨끗한 설계라면 두 조건 모두 같은 정보를 주고 **순서만** 바꿉니다(A: 프로필→일상→결정, B: 일상→프로필→결정). 이번 MVP에서는 이 한계를 인지한 채로 "정보 순서 차이"를 큰 틀에서 검증하는 데 집중했습니다.

---

## 아쉬웠던 점

- **실험 결과 미수집:** 실제 사용자에게 배포해 유의미한 샘플을 모을 시간이 없었습니다. 이벤트 스키마와 수집 인프라는 완성되어 있어 트래픽만 있으면 바로 분석 가능합니다.
- **이미지 자산:** 후보 프로필 이미지를 플레이스홀더로 처리했습니다. 실제 서비스라면 실제 사진과 함께 매력도 편향 통제 방법을 별도로 설계해야 합니다.
- **통계적 유의성:** 현재 규모에서는 통계 검정이 의미 없습니다. 가설 검증을 위한 최소 표본 크기 계산 및 유의수준 설정이 필요합니다.

---

## 기술 스택

| | |
|---|---|
| Frontend | React + Vite → Vercel |
| Backend | Node.js + Express → Render |
| Database | Supabase (PostgreSQL) |
| AI | OpenAI GPT-4o-mini |
| 크롤러 | Node.js + cheerio + axios |

## 로컬 실행

```bash
# 서버
cd server && npm install && npm run dev

# 클라이언트 (별도 터미널)
cd client && npm install && npm run dev
```

환경변수는 `server/.env.example`, `client/.env.example` 참고.
