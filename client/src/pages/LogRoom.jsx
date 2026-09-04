import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getFullCandidate, getConversationStarters, postEvent, sendChat } from '../api/client.js';
import {
  addMessage,
  addMyMoment,
  addReaction,
  getMatch,
  subscribeMatches,
  upsertMatch,
} from '../lib/matches.js';
import { takePendingChat } from '../lib/pendingChat.js';
import TabBar from '../components/TabBar.jsx';
import './LogRoom.css';

const REACTIONS = ['ㅋㅋ', '오', '궁금', '♥'];

const MY_PRESETS = [
  { key: 'commute', caption: '출근길 아아. 오늘도 아슬아슬', imageUrl: '/me/moment-1.jpg' },
  { key: 'lunch', caption: '편의점 김밥으로 때움', imageUrl: '/me/moment-2.jpg' },
  { key: 'move', caption: '잠깐 바람 쐬러 나옴', imageUrl: '/me/moment-3.jpg' },
  { key: 'night', caption: '오늘 여기까지. 불 끄기 직전', imageUrl: '/me/moment-4.jpg' },
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
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const queueRef = useRef([]);
  const busyRef = useRef(false);
  const threadRef = useRef(null);

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
    const current = getMatch(candidateId);
    getConversationStarters(
      candidateId,
      sessionId,
      (current?.myMoments || []).map(m => ({ time: m.time, caption: m.caption })),
    )
      .then(({ starters: items }) => setStarters(items || []))
      .catch(() => {});
  }, [candidateId, sessionId]);

  const timeline = useMemo(() => mergeTimeline(match), [match]);
  const latestThem = [...(match?.theirMoments || [])].at(-1);
  const latestMe = [...(match?.myMoments || [])].at(-1);

  useEffect(() => {
    threadRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [match?.messages?.length, typing]);

  function enqueueBot(job) {
    return new Promise(resolve => {
      queueRef.current.push({ job, resolve });
      flushQueue();
    });
  }

  async function flushQueue() {
    if (busyRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    busyRef.current = true;
    setTyping(true);
    try {
      const reply = await next.job();
      next.resolve(reply);
    } catch {
      next.resolve(null);
    } finally {
      setTyping(false);
      busyRef.current = false;
      window.setTimeout(flushQueue, 400);
    }
  }

  async function askBot({ kind = 'chat', userMessage }) {
    const reply = await enqueueBot(async () => {
      const current = getMatch(candidateId);
      const { reply: text } = await sendChat({
        sessionId,
        candidateId,
        kind,
        userMessage,
        history: (current?.messages || []).map(m => ({ author: m.author, text: m.text })),
        myMoments: (current?.myMoments || []).map(m => ({ time: m.time, caption: m.caption })),
      });
      return text;
    });

    if (kind === 'overlap') {
      if (reply) upsertMatch({ id: candidateId, overlap: reply });
      return reply;
    }

    if (reply) {
      addMessage(candidateId, { author: 'them', text: reply });
      return reply;
    }

    if (kind === 'chat' || kind === 'greet') {
      addMessage(candidateId, {
        author: 'them',
        text: '잠깐 신호가 안 좋아요. 조금만 있다가 다시 말해 주세요.',
      });
    }
    return null;
  }

  useEffect(() => {
    if (loading || !match) return;

    const pending = takePendingChat(candidateId);

    if (!match.greeted) {
      upsertMatch({ id: candidateId, greeted: true });
      askBot({ kind: 'greet' }).then(() => {
        if (pending) sendUserText(pending);
      });
      return;
    }

    if (pending) sendUserText(pending);
    // greet / pending once per open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, candidateId, match?.greeted]);

  function maybeOverlap() {
    const current = getMatch(candidateId);
    if (current?.overlap) return;
    if (!(current?.myMoments || []).length || !(current?.theirMoments || []).length) return;
    askBot({ kind: 'overlap' });
  }

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
    askBot({ kind: 'moment', userMessage: `${nowTime()} ${preset.caption}` });
    maybeOverlap();
  }

  function react(entryId, emoji) {
    const current = getMatch(candidateId);
    const entry = mergeTimeline(current).find(e => e.id === entryId);
    const had = (entry?.reactions || []).includes(emoji);
    addReaction(candidateId, entryId, emoji);
    postEvent({
      sessionId, condition, candidateId,
      event: 'log_reacted',
      elapsedMs: 0,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
    if (!had && emoji === '궁금' && entry?.author === 'them') {
      askBot({ kind: 'react', userMessage: `${entry.time} ${entry.caption}` });
    }
  }

  function sendUserText(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed) return;
    addMessage(candidateId, { author: 'me', text: trimmed });
    setDraft('');
    setStarters(prev => prev.filter(s => s !== trimmed));
    postEvent({
      sessionId, condition, candidateId,
      event: 'chat_sent',
      elapsedMs: 0,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
    askBot({ kind: 'chat', userMessage: trimmed });
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
            <div className="log-split-empty">
              <span className="log-split-empty-icon">+</span>
              <span>내 장면 올리기</span>
            </div>
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

      {match.overlap && <p className="log-overlap">{match.overlap}</p>}

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

      <section className="log-thread" ref={threadRef}>
        <p className="log-thread-label">Zip · 지금 하는 말</p>
        {(match.messages || []).length === 0 && !typing && (
          <p className="log-thread-empty">{match.name}이 오늘 장면으로 먼저 말 걸어요.</p>
        )}
        {(match.messages || []).map(msg => (
          <div key={msg.id} className={`log-bubble log-bubble-${msg.author}`}>
            {msg.text}
          </div>
        ))}
        {typing && (
          <div className="log-bubble log-bubble-them log-typing">{match.name}이 입력 중…</div>
        )}
      </section>

      {starters.length > 0 && (
        <section className="log-starters">
          <p className="log-thread-label">이 장면으로 말 걸기</p>
          {starters.map(s => (
            <button key={s} className="log-starter" type="button" onClick={() => sendUserText(s)}>{s}</button>
          ))}
        </section>
      )}

      <section className="log-composer">
        <p className="log-thread-label">지금 올리기</p>
        <div className="log-presets">
          {MY_PRESETS.map(p => (
            <button key={p.key} className="log-preset" type="button" onClick={() => postPreset(p)}>
              <img src={p.imageUrl} alt="" className="log-preset-img" />
              <span className="log-preset-label">
                {p.key === 'commute' ? '출근길' : p.key === 'lunch' ? '점심' : p.key === 'move' ? '잠깐 밖' : '오늘 끝'}
              </span>
            </button>
          ))}
        </div>
        <form
          className="log-chatbar"
          onSubmit={e => {
            e.preventDefault();
            sendUserText(draft);
          }}
        >
          <input
            className="log-input"
            value={draft}
            maxLength={200}
            placeholder={`${match.name}에게 말 걸기`}
            onChange={e => setDraft(e.target.value)}
          />
          <button className="log-send" type="submit" disabled={!draft.trim()}>보내기</button>
        </form>
        <p className="log-chat-hint">상대는 오늘 장면만 보고 대답해요.</p>
      </section>

      <TabBar />
    </main>
  );
}
