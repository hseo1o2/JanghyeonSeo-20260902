import OpenAI from 'openai';

let _client = null;
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

export async function generateConversationStarters(candidate) {
  const { profile, dailyMoments } = candidate;

  const momentLines = dailyMoments
    .map(m => `- ${m.time}: ${m.caption}`)
    .join('\n');

  const prompt = `
다음은 어떤 사람이 공유한 하루의 일상 순간들입니다:
${momentLines}

직업: ${profile.occupation}
취미: ${profile.hobbies.join(', ')}
한 줄 소개: ${profile.bio}

이 정보를 바탕으로, 처음 만난 자리에서 자연스럽게 꺼낼 수 있는 대화 주제 3개를 한국어로 제안해주세요.
일상 순간에서 구체적인 단서를 활용하세요. 외모·매력·성격에 대한 추측은 절대 포함하지 마세요.
각 주제는 한 문장의 질문 형태로, 번호 없이 줄바꿈으로 구분해서 출력하세요.
  `.trim();

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.8,
  });

  const text = response.choices[0]?.message?.content?.trim() ?? '';
  const starters = text
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .slice(0, 3);

  return starters;
}
