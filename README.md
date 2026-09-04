# Daily-First Experiment

> "프로필보다 하루를 먼저 보면, 사람을 다르게 보게 될까요?"

소개팅 앱에서 **정적 프로필(사진+나이+직업)보다 일상 순간을 먼저 보여줬을 때** 호기심 클릭률이 높아지는가를 측정하는 A/B 실험 MVP입니다.

**배포 URL:** https://client-theta-ten-88.vercel.app  
**GitHub:** https://github.com/hseo1o2/JanghyeonSeo-20260902

> **두 조건 모두 보려면**
> - B (daily_first): https://client-theta-ten-88.vercel.app?condition=daily_first
> - A (profile_first): https://client-theta-ten-88.vercel.app?condition=profile_first
> - 세션 초기화: 브라우저 콘솔에서 `localStorage.clear()` 후 새로고침

> **데모 계정으로 로그인 (선택):**
> 실험 참여에는 로그인이 필요 없습니다. 평가자가 조건을 고정해 보고 싶을 때만 쓰면 됩니다.
> `/login` 페이지에서 `user01@demo.com` ~ `user10@demo.com` / 비밀번호 `Demo1234`
> 계정마다 A/B 조건이 미리 지정되어 있어 두 조건을 번갈아 체험할 수 있습니다.

---

## 과제 구현에 대한 설명

### 실험 설계

| 조건 | 첫 화면 | 의사결정 시점의 정보 |
|---|---|---|
| A — profile_first | 사진 · 이름 · 나이 · 직업 · 취미 · 자기소개 | 전부 공개된 상태에서 호감 여부 판단 |
| B — daily_first | 타임스탬프 일상 장면 3–4컷 (누구인지 모름) | 정체 미공개 상태에서 "더 알고 싶은지" 판단 |

두 조건 모두 같은 후보 집합을 같은 순서로 보여줍니다(`seededShuffle`). CTA 위치·텍스트·레이아웃은 동일하며, 카드 본체가 실험 변수입니다.

### 이벤트 수집 구조

모든 유저 행동을 Supabase PostgreSQL `events` 테이블에 실시간 기록합니다.

| 이벤트 | 시점 |
|---|---|
| `candidate_viewed` | 후보 카드 로드 직후 |
| `candidate_skipped` | 넘기기 (버튼 또는 좌 스와이프) |
| `candidate_interested` | 더 알아보고 싶어요 (버튼 또는 우 스와이프) |
| `profile_revealed` | 프로필 공개 완료 (daily_first 조건) |
| `conversation_intent_clicked` | AI 대화 시작 버튼 클릭 |

핵심 지표: **`candidate_interested / candidate_viewed`** per condition

### 크롤러 연결

`crawler/crawl.js`는 과제 1에서 인용한 셋로그 공개 기사와, 일상 어휘를 보강하는 위키/나무위키 텍스트에서 **반복되는 생활 테마**(출퇴근·혼밥·운동·심야 약속)를 뽑습니다. 크롤러가 문장을 그대로 후보 캡션에 붙이지는 않습니다. 후보 캡션은 그 테마를 바탕으로 다시 썼습니다. 예: 운동 테마 → "비 그친 한강. 이어폰 끼고 5km 뛰었더니 하루가 다 정리된 느낌".

---

## 강조하고 싶은 부분

### 1. 실험 통제의 정확성

**CTA(하단 버튼)는 두 조건에서 완전히 동일합니다.** 위치·텍스트·그리드 모두 같습니다. 카드 본체만 실험 변수입니다. A는 프로필 전체, B는 타임스탬프 일상 장면입니다.

조건 배정은 `Math.random()` 으로 세션 시작 시 1회 결정되고, localStorage + Supabase에 동시 고정됩니다. 새로고침·중도 이탈 후 복귀해도 조건이 바뀌지 않습니다.

### 2. 서버가 아닌 API 레벨에서의 정보 차단

`daily_first` 조건에서 "더 알아보고 싶어요"를 클릭하기 전까지는 `/api/candidates/:id/reveal` 엔드포인트를 호출하지 않습니다. 프론트에서 숨긴 게 아니라, 서버가 아예 프로필 데이터를 내려주지 않습니다. 의도적으로 설계한 정보 격리입니다.

### 3. conversation_intent_clicked 이벤트 타이밍

AI 대화 시작 버튼은 OpenAI 응답이 **성공적으로 도착한 후**에만 이벤트를 기록합니다. 네트워크 오류로 대화 목록을 받지 못한 경우 이벤트가 남지 않아 지표가 오염되지 않습니다.

### 4. 스와이프 UX — 실험 변수 오염 없이 구현

Tinder식 좌우 스와이프를 추가했지만, 버튼과 완전히 같은 핸들러(`onSkip` / `onInterest`)를 호출합니다. 입력 수단이 다를 뿐 이벤트 스키마는 동일합니다. `touch-action: pan-y`로 수직 스크롤은 유지하면서 수평 방향 제스처만 캡처합니다.

### 5. Render cold start 대응

Render 무료 티어는 15분 비활성 시 슬립 상태로 진입합니다. 랜딩 페이지 마운트 시 `/api/health`를 백그라운드로 ping해서, 유저가 랜딩 카피를 읽는 동안 서버가 미리 깨어나도록 했습니다. 5초 초과 시 "서버를 깨우는 중" 힌트도 노출합니다.

### 6. 데모 계정 시스템

평가자가 두 조건을 직접 체험할 수 있도록 `/login` 페이지에 10개의 데모 계정을 준비했습니다. 계정마다 강제 조건이 지정되어 있어(user01·03·07: daily_first / user02·04·08: profile_first), 조건 전환을 위해 localStorage를 수동으로 조작할 필요가 없습니다.

---

## 주요 설계 의도

### AI를 가설 밖에 둔 이유

AI 대화 시작 제안은 `daily_first` 조건에서, `candidate_interested` 이후 프로필이 공개될 때만 나타납니다. "어떻게 말 걸지"라는 마찰을 줄이는 UX 보조 수단입니다.

만약 AI를 먼저 보여주면 "AI가 흥미로워서 클릭한 것"과 "일상이 흥미로워서 클릭한 것"을 분리할 수 없게 됩니다. 가설을 오염시키지 않기 위해 AI는 흥미 표명 이후에만 등장합니다.

### 합성 후보를 쓴 이유

매력도 편향을 제거하기 위해서입니다. 실험은 *정보 순서*의 효과를 측정하는 것이지 특정 인물의 매력을 측정하는 게 아닙니다. 10명의 후보 모두 연령(22–30), 직업, 생활 패턴을 다양하게 설계했습니다.

### Supabase를 선택한 이유

Render 무료 티어의 파일시스템은 배포·재시작마다 초기화됩니다. SQLite로 시작했다가 이 문제를 겪은 후 Supabase PostgreSQL로 전환했습니다. 이벤트 데이터가 배포 사이클에 독립적으로 유지되어야 실험 결과를 수집할 수 있습니다.

---

## 구현 과정에서 겪은 어려움과 해결 방법

### 1. Supabase 연결 — 로컬 네트워크 포트 차단

로컬 네트워크가 Supabase의 직접 PostgreSQL 포트(5432·6543)를 차단했습니다. CLI 기반 마이그레이션이 전혀 작동하지 않았고, 모든 시도가 `ETIMEDOUT`으로 끝났습니다. Supabase 대시보드 SQL 에디터로 직접 테이블을 생성하고, 이후 REST API(`@supabase/supabase-js`)로 연결을 검증했습니다.

### 2. Vercel 환경변수 누락

`VITE_API_BASE_URL`이 Vercel에 설정되지 않아 프로덕션 빌드가 `localhost:4000`으로 요청을 보냈습니다. 배포 후 API 통신이 전혀 안 되는 상태였습니다. Vercel CLI로 env 추가 후 재배포하여 해결했습니다.

### 3. Render 환경변수 누락으로 배포 실패

첫 배포 시 Supabase 키, OpenAI 키 등이 Render에 설정되지 않아 `update_failed`가 났습니다. Render REST API(`PUT /v1/services/{id}/env-vars`)로 환경변수를 일괄 설정한 후 재배포했습니다.

### 4. iOS Safari `position: fixed` 트랩

`ProfileReveal` 오버레이에 `position: fixed`를 썼는데, 부모에 `transform`이 있으면 fixed가 뷰포트가 아닌 부모 기준으로 재배치됩니다. `#root`의 `position: relative`를 제거해서 해결했습니다.

### 5. 스와이프 수직 스크롤 충돌

터치 스와이프 구현 시 `touch-action: none`으로 시작했더니 일상 카드(이미지 4장, 전체 높이 ~1200px)에서 수직 스크롤이 막혔습니다. `touch-action: pan-y`로 변경하고, `onTouchMove`에서 dx/dy 비교로 수평 제스처 여부를 먼저 판별한 후에만 스와이프 트래킹을 시작하도록 수정했습니다.

### 6. `maybeSingle()` vs `single()`

Supabase에서 `.single()`은 행이 없을 때 에러를 던집니다. 세션 조회처럼 결과가 없을 수 있는 쿼리에서 `.single()`을 쓰니 존재하지 않는 세션을 `500`이 아닌 잘못된 상태코드로 응답하고 있었습니다. `.maybeSingle()`로 교체하고 null 체크를 명시적으로 처리했습니다.

---

## 아쉬웠던 점 또는 추가로 개선하고 싶은 부분

### 실험 설계의 한계 — 호기심 공백 vs 순서 효과

현재 설계에서 B 조건의 클릭률이 높아도 두 가지로 해석됩니다.

1. **일상이 더 좋은 시작점이다** — 의도한 해석
2. **정체를 가려서 생긴 호기심 공백 때문이다** — 교란 변수

A는 이미 다 본 뒤 호감을 묻고, B는 정체를 모른 채 열어보고 싶은지 묻습니다. 버튼 텍스트는 같지만 의미가 다릅니다. 더 깨끗한 설계는 두 조건 모두 같은 정보량을 제공하고 *순서만* 바꾸는 것(A: 프로필→일상→결정, B: 일상→프로필→결정)이지만, 이번 MVP에서는 "정보 순서 차이"를 큰 틀에서 검증하는 데 집중했습니다.

### 실험 결과 미수집

실제 사용자에게 배포해 유의미한 샘플을 모을 시간이 없었습니다. 이벤트 스키마와 수집 인프라는 완성되어 있어 트래픽만 있으면 즉시 분석 가능합니다. 최소 유의 표본(조건당 n=30 이상)이 쌓이면 카이제곱 검정으로 조건 간 클릭률 차이를 검증할 수 있습니다.

### 이미지 자산

후보 프로필 이미지를 `randomuser.me` 포트레잇으로 처리했습니다. 일상 모먼트 이미지는 `picsum.photos` 시드 URL을 사용합니다. 실제 서비스라면 실제 사진과 함께 매력도 편향 통제 방법을 별도로 설계해야 합니다.

### 성별 선호 미반영

타깃이 이성 소개팅임에도 성별 선호를 받지 않았습니다. 관심 없는 성별 카드가 분모에 들어가 `interested/viewed` 지표를 흐릴 수 있습니다. 온보딩 단계에서 선호 성별을 입력받아 해당 후보만 노출하면 지표 품질이 높아집니다.

### 통계적 유의성

현재 규모에서는 통계 검정이 의미 없습니다. 가설 검증을 위한 최소 표본 크기 계산 및 유의수준 설정이 필요합니다. 또한 현재 실험은 단순 클릭률만 측정하지만, 체류 시간(elapsedMs)을 보조 지표로 활용하면 "관심은 있지만 확신이 없는" 상태를 더 세밀하게 포착할 수 있습니다.

---

## 기술 스택

| | |
|---|---|
| Frontend | React + Vite → Vercel |
| Backend | Node.js + Express → Render |
| Database | Supabase (PostgreSQL) |
| Auth | Server-side JWT (jsonwebtoken) |
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

> 데모 계정: `user01@demo.com` ~ `user10@demo.com` / `Demo1234`
