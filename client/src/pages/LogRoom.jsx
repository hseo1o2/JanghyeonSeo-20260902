import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getFullCandidate, getConversationStarters, postEvent } from '../api/client.js';
import {
  addMessage,
  addMyMoment,
  addReaction,
  getMatch,
  subscribeMatches,
  upsertMatch,
} from '../lib/matches.js';
import './LogRoom.css';

const REACTIONS = ['ㅋㅋ', '오', '궁금', '♥'];

const MY_PRESETS = [
  { key: 'commute', caption: '출근길 아아. 오늘도 아슬아슬', imageUrl: '/me/moment-1.jpg' },
  { key: 'lunch', caption: '편의점 김밥으로 때움', imageUrl: '/me/moment-2.jpg' },
  { key: 'move', caption: '잠깐 바람 쐬러 나옴', imageUrl: '/me/moment-3.jpg' },
  { key: 'night', caption: '오늘 여기까지. 불 끄기 직전', imageUrl: '/me/moment-4.jpg' },
];

const THEM_REPLIES = [
  '이 시간에 올리는 거 보니까 하루 리듬이 비슷한 것 같아요',
  '방금 장면 보니까 갑자기 배고파졌어요',
  '말 안 해도 오늘이 보이네요',
  '이런 거 보다가 말을 걸게 되는 것 같아요',
];

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function mergeTimeline(match) {
  const them = (match?.theirMoments || []).map(m => ({ ...m, author: 'them' }));
  const me = (match?.myMoments || []).map(m => ({ ...m, author: 'me' }));
  return [...them, ...me].sort((a, b) => String(a.time).localeCompare(String(b.time)));
}

export default function LogRoom() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const sessionId = localStorage.getItem('sessionId');
  const condition = localStorage.getItem('condition');
  const [match, setMatch] = useState(() => getMatch(candidateId));
  const [starters, setStarters] = useState([]);
  const [loading, setLoading] = useState(!match);

  useEffect(() => subscribeMatches(() => setMatch(getMatch(candidateId))), [candidateId]);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!sessionId || !candidateId) return;
      try {
        const full = await getFullCandidate(candidateId, sessionId);
        if (cancelled) return;
        const folder = candidateId.replace('candidate_', 'candidate-');
        const existing = getMatch(candidateId);
        upsertMatch({
          id: candidateId,
          name: full.profile.name,
          age: full.profile.age,
          occupation: full.profile.occupation,
          bio: full.profile.bio,
          hobbies: full.profile.hobbies,
          imageUrl: `/candidates/${folder}/profile.jpg`,
          theirMoments: (existing?.theirMoments?.length
            ? existing.theirMoments
            : (full.dailyMoments || []).map((m, i) => ({
              id: `${candidateId}-m${i}`,
              time: m.time,
              caption: m.caption,
              imageUrl: m.imageUrl,
              reactions: [],
            }))),
        });
      } catch {
        if (!getMatch(candidateId)) navigate('/matches', { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    hydrate();
    return () => { cancelled = true; };
  }, [candidateId, sessionId, navigate]);

  useEffect(() => {
    if (!sessionId || !candidateId) return;
    getConversationStarters(candidateId, sessionId)
      .then(({ starters: items }) => setStarters(items || []))
      .catch(() => {});
  }, [candidateId, sessionId]);

  const timeline = useMemo(() => mergeTimeline(match), [match]);
  const latestThem = [...(match?.theirMoments || [])].at(-1);
  const latestMe = [...(match?.myMoments || [])].at(-1);

  function postPreset(preset) {
    addMyMoment(candidateId, {
      time: nowTime(),
      caption: preset.caption,
      imageUrl: preset.imageUrl,
    });
    postEvent({
      sessionId, condition, candidateId,
      event: 'log_posted',
      elapsedMs: 0,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
    window.setTimeout(() => {
      addMessage(candidateId, {
        author: 'them',
        text: THEM_REPLIES[Math.floor(Math.random() * THEM_REPLIES.length)],
      });
    }, 900);
  }

  function react(entryId, emoji) {
    addReaction(candidateId, entryId, emoji);
    postEvent({
      sessionId, condition, candidateId,
      event: 'log_reacted',
      elapsedMs: 0,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
  }

  function sendStarter(text) {
    addMessage(candidateId, { author: 'me', text });
    postEvent({
      sessionId, condition, candidateId,
      event: 'conversation_intent_clicked',
      elapsedMs: 0,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
    window.setTimeout(() => {
      addMessage(candidateId, {
        author: 'them',
        text: '그거 보면서 생각났어요. 오늘 하루 끝나고 이어서 이야기해요',
      });
    }, 1100);
  }

  if (loading || !match) {
    return (
      <main className="log-page">
        <div className="experiment-state"><div className="spinner" /></div>
      </main>
    );
  }

  return (
    <main className="log-page">
      <header className="log-header">
        <button className="log-back" onClick={() => navigate('/matches')}>←</button>
        <div className="log-header-meta">
          <p className="log-header-name">{match.name} · {match.age}세</p>
          <p className="log-header-sub">오늘 로그 · {timeline.length}장면</p>
        </div>
      </header>

      <section className="log-split">
        <div className="log-split-col">
          <span className="log-split-label">나</span>
          {latestMe ? (
            <img src={latestMe.imageUrl} alt="" className="log-split-img" />
          ) : (
            <div className="log-split-empty">아직 없음</div>
          )}
        </div>
        <div className="log-split-col">
          <span className="log-split-label">{match.name}</span>
          {latestThem ? (
            <img src={latestThem.imageUrl} alt="" className="log-split-img" />
          ) : (
            <div className="log-split-empty">아직 없음</div>
          )}
        </div>
      </section>
      <p className="log-split-caption">셋로그처럼, 말은 나중에. 먼저 오늘의 장면이 나란히 쌓입니다.</p>

      <ol className="log-timeline">
        {timeline.map(entry => (
          <li key={entry.id} className={`log-entry log-entry-${entry.author}`}>
            <time className="log-time">{entry.time}</time>
            <img src={entry.imageUrl} alt="" className="log-entry-img" />
            <p className="log-entry-caption">{entry.caption}</p>
            {entry.author === 'them' && (
              <div className="log-reactions">
                {REACTIONS.map(emoji => (
                  <button
                    key={emoji}
                    className={`log-chip ${(entry.reactions || []).includes(emoji) ? 'on' : ''}`}
                    onClick={() => react(entry.id, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>

      {(match.messages || []).length > 0 && (
        <section className="log-thread">
          <p className="log-thread-label">Zip · 지금 하는 말</p>
          {match.messages.map(msg => (
            <div key={msg.id} className={`log-bubble log-bubble-${msg.author}`}>
              {msg.text}
            </div>
          ))}
        </section>
      )}

      {starters.length > 0 && (
        <section className="log-starters">
          <p className="log-thread-label">이 장면으로 말 걸기</p>
          {starters.map(s => (
            <button key={s} className="log-starter" onClick={() => sendStarter(s)}>{s}</button>
          ))}
        </section>
      )}

      <section className="log-composer">
        <p className="log-thread-label">지금 올리기</p>
        <div className="log-presets">
          {MY_PRESETS.map(p => (
            <button key={p.key} className="log-preset" onClick={() => postPreset(p)}>
              {p.key === 'commute' ? '출근' : p.key === 'lunch' ? '점심' : p.key === 'move' ? '운동' : '밤'}
            </button>
          ))}
        </div>
      </section>

      <div className="log-footer-nav">
        <Link to="/discover" className="log-footer-link">발견으로</Link>
        <Link to="/matches" className="log-footer-link">다른 로그</Link>
      </div>
    </main>
  );
}
