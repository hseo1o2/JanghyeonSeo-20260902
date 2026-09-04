import { useEffect, useState } from 'react';
import './ProfileReveal.css';
import ConversationStarter from './ConversationStarter.jsx';
import { setPendingChat } from '../lib/pendingChat.js';

export default function ProfileReveal({ reveal, sessionId, condition, onContinue, onOpenLog }) {
  const { profile, highlightMoments } = reveal;
  const [phase, setPhase] = useState('match');

  useEffect(() => {
    const t = window.setTimeout(() => setPhase('detail'), 1600);
    return () => window.clearTimeout(t);
  }, []);

  if (phase === 'match') {
    return (
      <div className="match-overlay" onClick={() => setPhase('detail')}>
        <div className="match-photo-wrap">
          <img
            src={profile.imageUrl}
            alt=""
            className="match-photo"
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>
        <div className="match-text">
          <h2 className="match-title">관심이 생겼군요</h2>
          <p className="match-name">{profile.name} · {profile.age}세</p>
          <p className="match-hint">오늘 하루를 같이 쌓아볼까요?</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reveal-overlay">
      <div className="reveal-sheet">
        <div className="reveal-handle" />
        <p className="reveal-badge">매칭 · 프로필</p>

        <div className="reveal-image-wrap">
          <img
            src={profile.imageUrl}
            alt="후보 프로필"
            className="reveal-image"
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>

        <div className="reveal-body">
          <div className="reveal-identity">
            <span className="reveal-name">{profile.name}</span>
            <span className="reveal-age">{profile.age}세</span>
          </div>
          <p className="reveal-occupation">{profile.occupation}</p>

          <div className="reveal-hobbies">
            {profile.hobbies.map(h => (
              <span key={h} className="card-tag">{h}</span>
            ))}
          </div>

          <p className="reveal-bio">{profile.bio}</p>

          {highlightMoments?.length > 0 && (
            <div className="reveal-moments">
              <p className="reveal-moments-label">방금 봤던 일상 순간들</p>
              {highlightMoments.map((m, i) => (
                <div key={i} className="reveal-moment">
                  <span className="moment-time">{m.time}</span>
                  <span className="moment-caption">{m.caption}</span>
                </div>
              ))}
            </div>
          )}

          <ConversationStarter
            candidateId={reveal.id}
            sessionId={sessionId}
            condition={condition}
            onSelect={text => {
              setPendingChat(reveal.id, text);
              onOpenLog();
            }}
          />
        </div>

        <footer className="reveal-footer">
          <button className="btn-primary" onClick={onOpenLog}>
            오늘 로그 시작하기
          </button>
          <button className="reveal-secondary" onClick={onContinue}>
            다른 사람 더 보기
          </button>
        </footer>
      </div>
    </div>
  );
}
