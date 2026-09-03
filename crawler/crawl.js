/**
 * Daily-life theme crawler
 *
 * Fetches public Korean lifestyle articles and extracts recurring daily-moment
 * themes (commute, solo lunch, exercise, etc.) that inform candidate
 * dailyMoments captions in candidates.json.
 *
 * Output: crawler/output.json
 *
 * Flow:
 *   public article text → cheerio parse → sentence extraction
 *   → keyword matching → theme aggregation → output.json
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Public Korean articles covering daily-life routines
// Using Korean Wikipedia for stable, publicly crawlable sources
const SOURCES = [
  {
    name: '위키백과 — 소개팅',
    url: 'https://ko.wikipedia.org/wiki/%EC%86%8C%EA%B0%9C%ED%8C%85',
  },
  {
    name: '위키백과 — 일상생활',
    url: 'https://ko.wikipedia.org/wiki/%EC%9D%BC%EC%83%81%EC%83%9D%ED%99%9C',
  },
  {
    name: '위키백과 — 카페',
    url: 'https://ko.wikipedia.org/wiki/%EC%B9%B4%ED%8E%98',
  },
  {
    name: '위키백과 — 운동 (스포츠)',
    url: 'https://ko.wikipedia.org/wiki/%EC%9A%B4%EB%8F%99',
  },
];

// Keyword clusters → theme labels
const THEME_CLUSTERS = [
  {
    theme: '출퇴근',
    keywords: ['출근', '퇴근', '지하철', '버스', '통근', '출근길', '퇴근길'],
  },
  {
    theme: '혼밥·카페',
    keywords: ['혼밥', '점심', '카페', '아메리카노', '라떼', '밥', '식사', '혼자 밥'],
  },
  {
    theme: '운동·헬스',
    keywords: ['운동', '헬스', '러닝', '수영', '요가', '산책', '조깅', '필라테스'],
  },
  {
    theme: '늦은 밤 모임',
    keywords: ['새벽', '심야', '친구', '모임', '술', '맥주', '치킨', '야식', '밤'],
  },
  {
    theme: '아침 루틴',
    keywords: ['아침', '기상', '모닝', '샤워', '씻고', '일어나서', '기상 후'],
  },
  {
    theme: '독서·공부',
    keywords: ['독서', '책', '공부', '스터디', '강의', '학습', '도서관'],
  },
  {
    theme: '쇼핑·쇼핑몰',
    keywords: ['쇼핑', '구매', '옷', '쇼핑몰', '백화점', '온라인 쇼핑'],
  },
  {
    theme: '취미·창작',
    keywords: ['그림', '사진', '영상', '유튜브', '브이로그', '드라마', '영화', '음악'],
  },
];

async function fetchText(source) {
  try {
    const { data } = await axios.get(source.url, {
      timeout: 8000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    });
    const $ = cheerio.load(data);
    // Remove nav, header, footer, scripts, styles
    $('script, style, nav, header, footer, aside, .mw-editsection').remove();
    // Prefer article body selectors (Wikipedia: #mw-content-text, fallback to body)
    const content =
      $('#mw-content-text').text() ||
      $('article').text() ||
      $('main').text() ||
      $('body').text();
    return content.replace(/\s+/g, ' ').trim();
  } catch (err) {
    console.warn(`  ⚠ ${source.name}: ${err.message}`);
    return '';
  }
}

function extractExamples(text, keywords) {
  const sentences = text.split(/[.。!?…\n]/).map(s => s.trim()).filter(s => s.length > 8);
  const matches = [];
  for (const sentence of sentences) {
    if (keywords.some(kw => sentence.includes(kw))) {
      const trimmed = sentence.slice(0, 60);
      if (!matches.includes(trimmed)) matches.push(trimmed);
    }
    if (matches.length >= 5) break;
  }
  return matches;
}

async function main() {
  console.log('크롤링 시작...\n');

  const allText = [];
  for (const source of SOURCES) {
    process.stdout.write(`  fetching: ${source.name} ... `);
    const text = await fetchText(source);
    if (text.length > 100) {
      allText.push(text);
      console.log(`OK (${text.length}자)`);
    } else {
      console.log('skipped (내용 없음)');
    }
  }

  const combined = allText.join(' ');
  console.log(`\n총 텍스트: ${combined.length}자`);

  // Aggregate themes
  const themes = THEME_CLUSTERS.map(cluster => {
    const count = cluster.keywords.reduce((acc, kw) => {
      const regex = new RegExp(kw, 'g');
      return acc + (combined.match(regex) ?? []).length;
    }, 0);
    const examples = extractExamples(combined, cluster.keywords);
    return { theme: cluster.theme, keywords: cluster.keywords, count, examples };
  }).sort((a, b) => b.count - a.count);

  const output = {
    crawledAt: new Date().toISOString(),
    sources: SOURCES.map(s => s.name),
    totalChars: combined.length,
    themes,
  };

  const outPath = path.join(__dirname, 'output.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n✅ output.json 저장 완료 (${themes.length}개 테마)`);
  themes.slice(0, 5).forEach(t => console.log(`  - ${t.theme}: ${t.count}회`));
}

main().catch(err => {
  console.error('크롤링 실패:', err.message);
  process.exit(1);
});
