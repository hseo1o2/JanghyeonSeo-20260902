import { useEffect, useState } from 'react';
import './ProfileReveal.css';
import ConversationStarter from './ConversationStarter.jsx';

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
        <p className="match-kicker">It's a match</p>
        <h2 className="match-title">매칭되었어요</h2>
        <div className="match-photo-wrap">
          <img
            src={profile.imageUrl}
            alt=""
            className="match-photo"
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>
        <p className="match-name">{profile.name} · {profile.age}세</p>
        <p className="match-hint">탭하면 오늘 로그를 같이 열 수 있어요</p>
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
