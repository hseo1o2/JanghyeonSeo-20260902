import OpenAI from 'openai';

let _client = null;
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

export function sanitizeMoments(moments) {
  if (!Array.isArray(moments)) return [];
  return moments
    .slice(-6)
    .map(m => ({
      time: String(m?.time || '').slice(0, 8),
      caption: String(m?.caption || '').slice(0, 140),
    }))
    .filter(m => m.caption);
}

function momentBlock(moments, empty = '(아직 없음)') {
  const clean = sanitizeMoments(moments);
  if (!clean.length) return empty;
  return clean.map(m => `- ${m.time || ''}: ${m.caption}`.trim()).join('\n');
}

function candidateCard(candidate) {
  const { profile, dailyMoments } = candidate;
  return [
    `이름: ${profile.name}`,
    `나이: ${profile.age}`,
    `직업: ${profile.occupation}`,
    `취미: ${(profile.hobbies || []).join(', ')}`,
    `소개: ${profile.bio}`,
    '오늘 공유한 장면:',
    momentBlock(dailyMoments),
  ].join('\n');
}

const RULES = `규칙:
- 한국어 해요체로, 한 번에 1~2문장만. 세 문장 이상 금지
- 공유된 장면의 시간·장소·한 일·먹은 것만 근거로 말하세요
- 평소 취미, 성격, 외모, 매력, 궁합, 가치관, 민감 정보를 묻거나 추측하지 마세요
- 상담하거나 평가하지 마세요
- 이모지는 많아도 하나`;

async function complete(messages, { max_tokens = 180, temperature = 0.7 } = {}) {
  const response = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens,
    temperature,
  });
  return (response.choices[0]?.message?.content || '').trim();
}

export async function generateConversationStarters(candidate, myMoments = []) {
  const prompt = `${candidateCard(candidate)}

사용자가 올린 장면:
${momentBlock(myMoments)}

방금 본 하루 장면에서 자연스럽게 꺼낼 첫 질문 3개를 만드세요.
질문은 장면의 구체적인 단서(시간, 장소, 먹은 것, 한 일)를 포함하세요.
${RULES}
JSON 배열만 출력하세요. 예: ["질문1","질문2","질문3"]`;

  const text = await complete([{ role: 'user', content: prompt }], { max_tokens: 280 });
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    if (Array.isArray(parsed)) {
      return parsed.map(s => String(s).trim()).filter(Boolean).slice(0, 3);
    }
  } catch { /* fall through */ }

  return text
    .split('\n')
    .map(s => s.replace(/^[\d.)\-\s"]+/, '').replace(/"$/, '').trim())
    .filter(s => s.length > 8)
    .slice(0, 3);
}

export async function generateOverlapNote(candidate, myMoments = []) {
  const prompt = `상대 오늘:
${momentBlock(candidate.dailyMoments)}

사용자 오늘:
${momentBlock(myMoments)}

두 목록에서 겹치는 구체적인 단서(시간대, 혼밥, 운동, 야근, 먹은 것, 장소)가 있으면 한국어 한 줄로만 짚으세요.
예: 둘 다 점심을 혼자 때운 날이네요.
궁합, 성격, 가치관, 외모는 말하지 마세요.
겹치는 게 없으면 정확히 NONE`;

  const reply = await complete([{ role: 'user', content: prompt }], { max_tokens: 80, temperature: 0.4 });
  const t = reply.replace(/^["'\s]+|["'\s]+$/g, '');
  if (!t || t.length < 6 || /^(none|없음|빈\s*문자열\.?)$/i.test(t)) return '';
  return t;
}

export async function chatAsCandidate({
  candidate,
  myMoments = [],
  history = [],
  userMessage,
  kind = 'chat',
}) {
  const profile = candidate.profile;
  const system = `당신은 매칭된 상대 "${profile.name}"입니다. 셋로그처럼 짧은 하루 장면을 나눈 뒤 가볍게 이야기합니다.
${candidateCard(candidate)}

사용자가 올린 오늘:
${momentBlock(myMoments)}

${RULES}
당신은 ${profile.name}입니다. 직업을 자랑하거나 자기소개를 나열하지 마세요.
AI나 챗봇임을 드러내지 마세요.`;

  const mapped = (history || [])
    .slice(-16)
    .filter(h => h?.text)
    .map(h => ({
      role: h.author === 'me' ? 'user' : 'assistant',
      content: String(h.text).slice(0, 400),
    }));

  let last;
  if (kind === 'greet') {
    last = {
      role: 'user',
      content: '(매칭이 막 열렸습니다. 오늘 장면 중 하나를 짚은 뒤, 그 장면의 구체적 단서에 대한 질문 하나만 하세요. 취미나 평소 습관은 묻지 마세요.)',
    };
  } else if (kind === 'moment') {
    last = {
      role: 'user',
      content: `사용자가 방금 이 장면을 올렸습니다: ${String(userMessage || '').slice(0, 200)}\n한 줄로만 반응하세요.`,
    };
  } else if (kind === 'react') {
    last = {
      role: 'user',
      content: `사용자가 이 장면에 '궁금'을 눌렀습니다: ${String(userMessage || '').slice(0, 200)}\n그 장면의 구체적인 단서만 짚어 한 줄로 답하세요.`,
    };
  } else {
    last = { role: 'user', content: String(userMessage || '').slice(0, 500) };
  }

  return complete([{ role: 'system', content: system }, ...mapped, last]);
}
