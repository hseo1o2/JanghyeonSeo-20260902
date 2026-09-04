/**
 * Daily-life theme crawler
 *
 * Fetches public Korean articles and extracts recurring daily-moment themes
 * that inform candidate dailyMoments captions in candidates.json.
 *
 * Sources:
 *   - 과제 1에서 인용한 셋로그 공개 기사 (모비인사이드, 한국경제, 코리아데일리 등)
 *   - 한국어 위키백과 / 나무위키: 일상 어휘를 보강하는 안정 소스
 *
 * The crawler does NOT copy sentences into candidates.json.
 * It ranks which daily-life themes recur (commute, solo meal, exercise, late night).
 * Candidate captions are rewritten from those themes.
 *
 * Output: crawler/output.json
 *   - themes[]          — keyword frequency per theme (backward compat)
 *   - momentSentences[] — sentences scored by time+place+action patterns
 *   - captionSuggestions[] — trimmed, caption-ready strings for candidates.json
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Sources ────────────────────────────────────────────────────────────────

const SOURCES = [
  // 과제 1에서 인용한 공개 기사
  { name: '모비인사이드 — 셋로그 팀 인터뷰', url: 'https://www.mobiinside.co.kr/2026/06/09/setlog-team-interview-social-networking-app-growth/', type: 'article' },
  { name: '한국경제 — 셋로그 소개팅', url: 'https://www.hankyung.com/article/2026052240597', type: 'article' },
  { name: '일요신문 — 셋로그 일상 기록', url: 'https://www.ilyo.co.kr/?ac=article_view&entry_id=510607', type: 'article' },
  { name: 'Daum — 셋로그 이용자 수', url: 'https://v.daum.net/v/20260605115300629', type: 'article' },
  { name: '파이낸셜뉴스 — 셋로그 일본 확산', url: 'https://www.fnnews.com/news/202608222101443394', type: 'article' },
  // 한국어 위키백과 (standard HTML — #mw-content-text selector)
  { name: '위키백과 — 소개팅', url: 'https://ko.wikipedia.org/wiki/%EC%86%8C%EA%B0%9C%ED%8C%85', type: 'wiki' },
  { name: '위키백과 — 일상생활', url: 'https://ko.wikipedia.org/wiki/%EC%9D%BC%EC%83%81%EC%83%9D%ED%99%9C', type: 'wiki' },
  { name: '위키백과 — 카페', url: 'https://ko.wikipedia.org/wiki/%EC%B9%B4%ED%8E%98', type: 'wiki' },
  { name: '위키백과 — 운동', url: 'https://ko.wikipedia.org/wiki/%EC%9A%B4%EB%8F%99', type: 'wiki' },
  // 나무위키 (colloquial Korean, richer daily-life vocabulary — leaf-node extraction)
  { name: '나무위키 — 혼밥', url: 'https://namu.wiki/w/%ED%98%BC%EB%B0%A5', type: 'namu' },
  { name: '나무위키 — 직장인', url: 'https://namu.wiki/w/%EC%A7%81%EC%9E%A5%EC%9D%B8', type: 'namu' },
  { name: '나무위키 — 소개팅', url: 'https://namu.wiki/w/%EC%86%8C%EA%B0%9C%ED%8C%85', type: 'namu' },
  { name: '나무위키 — 헬스장', url: 'https://namu.wiki/w/%ED%97%AC%EC%8A%A4%EC%9E%A5', type: 'namu' },
  { name: '나무위키 — 카페', url: 'https://namu.wiki/w/%EC%B9%B4%ED%8E%98', type: 'namu' },
  { name: '나무위키 — 셋로그', url: 'https://namu.wiki/w/%EC%85%8B%EB%A1%9C%EA%B7%B8', type: 'namu' },
];

// ─── Patterns for moment-sentence scoring ────────────────────────────────────

// Time expressions that anchor a moment in the day
const TIME_RE = /(?:오전|오후|새벽|아침|점심|저녁|밤|퇴근\s*후|출근\s*전|자기\s*전|\d{1,2}시\s*(?:반|쯤)?)/;

// Concrete daily-life locations
const PLACE_RE = /(?:카페|편의점|헬스장|지하철|버스|회사|집에서|학교|공원|식당|마트|동네|사무실|독서실|도서관|운동장|헬스클럽)/;

// Specific daily-life action verbs (NOT broad "했다" — avoids encyclopedic matches)
const ACTION_RE = /(?:먹었|마셨|달렸|운동했|씻었|잤다|읽었|봤다|만났|샀다|걸었|쉬었|일어났|주문했|시켰다|혼밥|혼자\s*먹|커피\s*마|퇴근했|출근했|밥\s*먹|야식|운동\s*갔|헬스\s*갔|카페\s*갔|산책했|찍었|공유했|올렸|기록했|촬영)/;

// First-person / recency markers that suggest personal narrative
const FIRST_PERSON_RE = /(?:나는|저는|나도|저도|오늘|어제|아까|요즘|매일|하루|이날|그날)/;

// Noise: meta / navigation text that leaked through
const NOISE_RE = /(?:편집|토론|역사|분류|저작권|링크|각주|출처|위키|바깥\s*고리|같이\s*보기|외부\s*링크|세기에는|년대|기원전)/;

function momentScore(sentence) {
  if (NOISE_RE.test(sentence)) return 0;
  if (sentence.length < 10 || sentence.length > 120) return 0;
  if (!/[가-힣]/.test(sentence)) return 0;

  const hasTime   = TIME_RE.test(sentence);
  const hasPlace  = PLACE_RE.test(sentence);
  const hasAction = ACTION_RE.test(sentence);
  const hasPerson = FIRST_PERSON_RE.test(sentence);

  // Require at least 2 distinct signal types — prevents single-keyword false positives
  const signals = [hasTime, hasPlace, hasAction, hasPerson].filter(Boolean).length;
  if (signals < 2) return 0;

  return (hasTime ? 3 : 0) + (hasPlace ? 2 : 0) + (hasAction ? 3 : 0) + (hasPerson ? 2 : 0);
}

// ─── Theme clusters ──────────────────────────────────────────────────────────

const THEME_CLUSTERS = [
  { theme: '출퇴근', keywords: ['출근', '퇴근', '지하철', '버스', '통근', '출근길', '퇴근길'] },
  { theme: '혼밥·카페', keywords: ['혼밥', '점심', '카페', '아메리카노', '라떼', '밥', '식사', '혼자 밥'] },
  { theme: '운동·헬스', keywords: ['운동', '헬스', '러닝', '수영', '요가', '산책', '조깅', '필라테스'] },
  { theme: '늦은 밤 모임', keywords: ['새벽', '심야', '친구', '모임', '술', '맥주', '치킨', '야식', '밤'] },
  { theme: '아침 루틴', keywords: ['아침', '기상', '모닝', '샤워', '씻고', '일어나서', '기상 후'] },
  { theme: '독서·공부', keywords: ['독서', '책', '공부', '스터디', '강의', '학습', '도서관'] },
  { theme: '쇼핑', keywords: ['쇼핑', '구매', '옷', '쇼핑몰', '백화점', '온라인 쇼핑'] },
  { theme: '취미·창작', keywords: ['그림', '사진', '영상', '유튜브', '브이로그', '드라마', '영화', '음악'] },
];

// ─── Fetch helpers ───────────────────────────────────────────────────────────

const HTTP = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
  },
  responseType: 'text',
  decompress: true,
});

async function fetchSentences(source) {
  try {
    const { data } = await HTTP.get(source.url);
    const $ = cheerio.load(data);
    $('script, style').remove();

    if (source.type === 'wiki') {
      // 한국어 위키백과: article body is in #mw-content-text
      $('.mw-editsection').remove();
      const text = $('#mw-content-text').text() || $('body').text();
      return text
        .replace(/\s+/g, ' ')
        .split(/[.。!?…\n]/)
        .map(s => s.trim())
        .filter(s => s.length >= 10);
    }

    if (source.type === 'article') {
      $('script, style, nav, footer, header, iframe, noscript, aside').remove();
      const bodySelectors = [
        '#articletxt',
        '.article-body',
        '[itemprop="articleBody"]',
        '.article_view',
        '.news_view',
        '#harmonyContainer',
        '.view_cont',
        '.article-content',
        '.news-cnt',
        '#article-view-content-div',
        'article',
        'main',
      ];
      let text = '';
      for (const sel of bodySelectors) {
        const chunk = $(sel).first().text().replace(/\s+/g, ' ').trim();
        if (chunk.length >= 200) { text = chunk; break; }
      }
      if (!text) text = $('body').text().replace(/\s+/g, ' ').trim();
      return text
        .split(/[.。!?…\n]|(?<=다)\s|(?<=요)\s|(?<=다\.)\s/)
        .map(s => s.trim())
        .filter(s => s.length >= 10 && s.length <= 300 && /[가-힣]/.test(s));
    }

    if (source.type === 'namu') {
      // 나무위키: content lives in leaf text nodes; nav/edit text filtered via NOISE_RE
      const sentences = [];
      $('*').each((_, el) => {
        if ($(el).children().length === 0) {
          const t = $(el).text().trim();
          if (t.length >= 10 && t.length <= 300 && /[가-힣]/.test(t) && !NOISE_RE.test(t)) {
            // Split on sentence endings
            t.split(/[.!?。\n]/).forEach(s => {
              const clean = s.trim();
              if (clean.length >= 10) sentences.push(clean);
            });
          }
        }
      });
      return sentences;
    }

    return [];
  } catch (err) {
    console.warn(`  ⚠ ${source.name}: ${err.message}`);
    return [];
  }
}

// ─── Caption generator ───────────────────────────────────────────────────────

function inferTheme(sentence) {
  for (const { theme, keywords } of THEME_CLUSTERS) {
    if (keywords.some(kw => sentence.includes(kw))) return theme;
  }
  return '기타';
}

// Template-based caption synthesis from crawl-discovered theme vocabulary.
// The crawler surfaces WHICH themes are prominent; templates turn that into
// realistic daily-moment captions ready for candidates.json.
const CAPTION_TEMPLATES = [
  // 혼밥·카페
  { theme: '혼밥·카페', captions: [
    '점심 카페에서 혼자 아메리카노',
    '퇴근 후 동네 카페 들렀다',
    '편의점 혼밥으로 때우는 점심',
    '카페에서 혼자 노트북 펼치고 3시간',
    '혼자 라멘집 들어가서 혼밥 성공',
  ]},
  // 운동·헬스
  { theme: '운동·헬스', captions: [
    '아침 러닝 5km 완주',
    '퇴근 후 헬스장 50분',
    '공원 조깅하다 석양 봤다',
    '요가 수업 첫날, 생각보다 힘들었다',
    '아침 수영 루틴 3주째',
  ]},
  // 출퇴근
  { theme: '출퇴근', captions: [
    '지하철에서 책 한 챕터 읽었다',
    '퇴근길 버스에서 멍때리기',
    '출근 전 편의점 커피 픽업',
    '지하철 환승 구간에서 팟캐스트',
  ]},
  // 아침 루틴
  { theme: '아침 루틴', captions: [
    '알람보다 10분 먼저 눈이 떠졌다',
    '아침 샤워 후 커피 한 잔',
    '오전 7시 반, 조용한 출근길',
    '아침을 직접 챙겨먹은 날',
  ]},
  // 늦은 밤 모임
  { theme: '늦은 밤 모임', captions: [
    '친구들이랑 새벽 2시까지 치킨',
    '퇴근 후 번개 모임, 맥주 두 캔',
    '늦은 밤 야식 배달 시켰다',
    '자정 넘겨서 집에 들어왔다',
  ]},
  // 독서·공부
  { theme: '독서·공부', captions: [
    '도서관에서 3시간 집중했다',
    '카페에서 책 읽다 깜빡 졸았다',
    '스터디 모임 첫 참여',
  ]},
  // 취미·창작
  { theme: '취미·창작', captions: [
    '오늘 찍은 사진 중 제일 마음에 든다',
    '드로잉 연습 30분, 조금 나아진 것 같다',
    '퇴근 후 브이로그 편집 2시간',
  ]},
];

function synthesizeCaptions(themes) {
  // Return captions for top themes (ranked by count), adding theme label
  const topThemes = themes.slice(0, 5).map(t => t.theme);
  const result = [];
  for (const tpl of CAPTION_TEMPLATES) {
    if (topThemes.includes(tpl.theme) || result.length < 10) {
      for (const caption of tpl.captions) {
        result.push({ caption, theme: tpl.theme, source: 'template' });
      }
    }
  }
  return result;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('크롤링 시작...\n');

  const allSentences = [];

  for (const source of SOURCES) {
    process.stdout.write(`  ${source.name} ... `);
    const sentences = await fetchSentences(source);
    allSentences.push(...sentences);
    console.log(`${sentences.length}개 문장`);
  }

  console.log(`\n총 문장: ${allSentences.length}개`);

  // Score every sentence for moment-ness
  const scored = allSentences
    .map(text => ({ text, score: momentScore(text), theme: inferTheme(text) }))
    .filter(s => s.score >= 2)
    .sort((a, b) => b.score - a.score);

  // Deduplicate by trimmed text
  const seen = new Set();
  const momentSentences = scored.filter(s => {
    const key = s.text.slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 60);

  console.log(`\n일상 순간 문장: ${momentSentences.length}개 (score ≥ 2)`);

  // Aggregate themes from all text
  // Use literal string split (not new RegExp) to avoid metachar issues with future keywords
  const combined = allSentences.join(' ');
  const themes = THEME_CLUSTERS.map(cluster => {
    const count = cluster.keywords.reduce(
      (acc, kw) => acc + (combined.split(kw).length - 1),
      0
    );
    const examples = momentSentences
      .filter(s => s.theme === cluster.theme)
      .slice(0, 5)
      .map(s => s.text.slice(0, 60));
    return { theme: cluster.theme, keywords: cluster.keywords, count, examples };
  }).sort((a, b) => b.count - a.count);

  // Caption suggestions: template-based (informed by top themes from crawl)
  const captionSuggestions = synthesizeCaptions(themes);

  const output = {
    crawledAt: new Date().toISOString(),
    sources: SOURCES.map(s => s.name),
    totalSentences: allSentences.length,
    momentSentences,
    captionSuggestions,
    themes,
  };

  const outPath = path.join(__dirname, 'output.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log('\n✅ output.json 저장 완료');
  console.log(`  momentSentences: ${momentSentences.length}개`);
  console.log(`  captionSuggestions: ${captionSuggestions.length}개`);
  console.log('\n상위 10개 캡션:');
  captionSuggestions.slice(0, 10).forEach(c => console.log(`  [${c.theme}] ${c.caption}`));
}

main().catch(err => {
  console.error('크롤링 실패:', err.message);
  process.exit(1);
});
