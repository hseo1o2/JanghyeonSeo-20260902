# API Specification

Base URL (local): `http://localhost:4000`  
Base URL (production): set via `VITE_API_BASE_URL`

---

## GET /api/health
Health check.

**Response**
```json
{ "ok": true }
```

---

## GET /api/experiment/start
Creates a new session and assigns A/B condition.

**Query params:** none

**Response**
```json
{
  "sessionId": "uuid-v4",
  "condition": "daily_first",
  "candidateIds": ["candidate_01", "candidate_02", "candidate_03", "candidate_04", "candidate_05", "candidate_06"]
}
```

Notes:
- `candidateIds` order is fixed (or seeded per session for reproducibility)
- Server stores `(sessionId, condition)` in `sessions` table

---

## GET /api/candidates/:id
Returns candidate data shaped for the given condition.

**Query params:**
- `condition` — `profile_first` | `daily_first`

**Response (profile_first)**
```json
{
  "id": "candidate_01",
  "condition": "profile_first",
  "profile": {
    "name": "민준",
    "age": 25,
    "occupation": "제품 디자이너",
    "hobbies": ["러닝", "독립서점", "보드게임"],
    "bio": "퇴근 후 새로운 동네를 걷는 걸 좋아해요.",
    "imageUrl": "/assets/candidate-01/profile.jpg"
  }
}
```

**Response (daily_first)**
```json
{
  "id": "candidate_01",
  "condition": "daily_first",
  "dailyMoments": [
    { "time": "08:42", "caption": "비 와서 버스 대신 지하철", "imageUrl": "/assets/candidate-01/moment-1.jpg" },
    { "time": "12:16", "caption": "회사 근처에서 혼자 점심", "imageUrl": "/assets/candidate-01/moment-2.jpg" },
    { "time": "18:37", "caption": "퇴근 후 한강 5km", "imageUrl": "/assets/candidate-01/moment-3.jpg" },
    { "time": "23:11", "caption": "친구들이랑 보드게임", "imageUrl": "/assets/candidate-01/moment-4.jpg" }
  ]
}
```

Notes:
- Profile fields are never sent in `daily_first` response until reveal endpoint is called
- Images are served as static assets from the server

---

## GET /api/candidates/:id/reveal
Returns minimal profile after user clicks "더 알아보고 싶어요" in daily_first condition.

**Response**
```json
{
  "id": "candidate_01",
  "profile": {
    "name": "민준",
    "age": 25,
    "occupation": "제품 디자이너",
    "hobbies": ["러닝", "독립서점", "보드게임"],
    "bio": "퇴근 후 새로운 동네를 걷는 걸 좋아해요.",
    "imageUrl": "/assets/candidate-01/profile.jpg"
  },
  "highlightMoments": [
    { "time": "18:37", "caption": "퇴근 후 한강 5km" },
    { "time": "23:11", "caption": "친구들이랑 보드게임" }
  ]
}
```

---

## POST /api/events
Stores a behavior event.

**Request body**
```json
{
  "sessionId": "uuid-v4",
  "condition": "daily_first",
  "candidateId": "candidate_01",
  "event": "candidate_interested",
  "elapsedMs": 8421,
  "metadata": {}
}
```

**Response**
```json
{ "ok": true }
```

---

## POST /api/conversation-starters
Calls OpenAI and returns 3 conversation starter questions.

**Request body**
```json
{
  "candidateId": "candidate_01",
  "sessionId": "uuid-v4"
}
```

Server fetches candidate data internally (never trust client-sent candidate data).

**Response**
```json
{
  "questions": [
    "퇴근 후 러닝을 자주 하시는 것 같은데, 언제부터 시작했어요?",
    "보드게임 사진이 있던데 요즘 제일 좋아하는 게임이 뭐예요?",
    "혼자 점심 드시는 날이 많은 것 같은데 혼밥 맛집도 잘 찾으세요?"
  ]
}
```

Error fallback (if OpenAI fails):
```json
{
  "questions": [
    "평소에 어떤 걸 할 때 가장 즐거우세요?",
    "요즘 빠져있는 게 있으면 뭔지 궁금해요.",
    "주말에는 주로 어떻게 보내세요?"
  ],
  "fallback": true
}
```

---

## POST /api/survey
Stores exit survey response.

**Request body**
```json
{
  "sessionId": "uuid-v4",
  "condition": "daily_first",
  "q1Reason": "less_judged",
  "q2Score": 4,
  "q3Freetext": "일상 카드가 훨씬 자연스러웠어요"
}
```

**Response**
```json
{ "ok": true }
```
