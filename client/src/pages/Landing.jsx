import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { warmupHealth, prefetchStart } from '../api/client.js';
import { getUser, clearAuth } from '../lib/auth.js';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [slowHint, setSlowHint] = useState(false);
  const [error, setError] = useState(null);
  const slowTimer = useRef(null);
  const user = getUser();

  // Resume in-progress sessions. Otherwise wake Render and prefetch /start.
  useEffect(() => {
    try {
      const sid   = localStorage.getItem('sessionId');
      const index = parseInt(localStorage.getItem('candidateIndex') || '0', 10);
      const ids   = JSON.parse(localStorage.getItem('candidateIds') || '[]');
      if (sid && index < ids.length) {
        navigate('/discover', { replace: true });
        return;
      }
    } catch {
      // malformed localStorage — ignore
    }
    const forced = new URLSearchParams(window.location.search).get('condition');
    warmupHealth().finally(() => {
      prefetchStart(forced || undefined).catch(() => {});
    });
  }, [navigate]);

  async function handleStart() {
    setLoading(true);
    setSlowHint(false);
    setError(null);

    slowTimer.current = setTimeout(() => setSlowHint(true), 5000);

    try {
      const forced = new URLSearchParams(window.location.search).get('condition');
      const { sessionId, condition, candidateIds, firstCandidate } = await prefetchStart(forced || undefined);
      localStorage.setItem('sessionId', sessionId);
      localStorage.setItem('condition', condition);
      localStorage.setItem('candidateIds', JSON.stringify(candidateIds));
      localStorage.setItem('candidateIndex', '0');
      if (firstCandidate) {
        localStorage.setItem('firstCandidate', JSON.stringify(firstCandidate));
      }
      navigate('/discover');
    } catch {
      setError('서버 연결에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      clearTimeout(slowTimer.current);
      setLoading(false);
      setSlowHint(false);
    }
  }

  return (
    <main className="landing">
      {/* Auth bar */}
      <div className="landing-auth-bar">
        {user ? (
          <div className="landing-user-row">
            <span className="landing-user-name">{user.name}</span>
            <button
              className="landing-auth-btn"
              onClick={() => { clearAuth(); window.location.reload(); }}
            >로그아웃</button>
          </div>
        ) : (
          <Link to="/login" className="landing-auth-btn">로그인</Link>
        )}
      </div>

      <div className="landing-visual" aria-hidden="true">
        <div className="moment-strip">
          <span className="moment-strip-label">07:30</span>
        </div>
        <div className="moment-strip">
          <span className="moment-strip-label">12:15</span>
        </div>
        <div className="moment-strip">
          <span className="moment-strip-label">22:00</span>
        </div>
      </div>

      <div className="landing-body">
        <p className="landing-eyebrow">만남 전 하루 엿보기</p>
        <h1 className="landing-title">
          만나기 전에,<br />
          하루를 조금 알아보고 싶다면
        </h1>
        <p className="landing-desc">
          하루 장면을 먼저 보고, 궁금한 사람과 오늘 로그를 같이 쌓아보세요.
        </p>

        <div className="landing-how">
          <div className="landing-step">
            <span className="landing-step-icon">🃏</span>
            <span>카드 보기</span>
          </div>
          <span className="landing-step-arrow">→</span>
          <div className="landing-step">
            <span className="landing-step-icon">👉</span>
            <span>관심 / 넘기기</span>
          </div>
          <span className="landing-step-arrow">→</span>
          <div className="landing-step">
            <span className="landing-step-icon">➡️</span>
            <span>다음 후보</span>
          </div>
        </div>

        <div className="landing-cta-wrap">
          <button
            className="landing-cta"
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? '연결 중…' : '시작하기'}
          </button>
          {loading && slowHint && (
            <p className="landing-slow-hint">
              서버를 깨우는 중이에요. 잠시만 기다려주세요 (최대 1분)
            </p>
          )}
          {error && <p className="landing-error">{error}</p>}
        </div>
      </div>
    </main>
  );
}
