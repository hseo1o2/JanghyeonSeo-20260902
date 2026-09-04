import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { startExperiment, BASE_URL } from '../api/client.js';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [slowHint, setSlowHint] = useState(false);
  const [error, setError] = useState(null);
  const slowTimer = useRef(null);

  // Resume existing session if in progress
  useEffect(() => {
    try {
      const sid   = localStorage.getItem('sessionId');
      const index = parseInt(localStorage.getItem('candidateIndex') || '0', 10);
      const ids   = JSON.parse(localStorage.getItem('candidateIds') || '[]');
      if (sid && index < ids.length) {
        navigate('/experiment', { replace: true });
      }
    } catch {
      // malformed localStorage — ignore
    }
  }, [navigate]);

  // Warm-up ping: wake Render before the user clicks
  useEffect(() => {
    fetch(`${BASE_URL}/api/health`).catch(() => {});
  }, []);

  async function handleStart() {
    setLoading(true);
    setSlowHint(false);
    setError(null);

    slowTimer.current = setTimeout(() => setSlowHint(true), 5000);

    try {
      const forced = new URLSearchParams(window.location.search).get('condition');
      const { sessionId, condition, candidateIds } = await startExperiment(forced || undefined);
      localStorage.setItem('sessionId', sessionId);
      localStorage.setItem('condition', condition);
      localStorage.setItem('candidateIds', JSON.stringify(candidateIds));
      localStorage.setItem('candidateIndex', '0');
      navigate('/experiment');
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
          6명의 후보를 카드로 만나보세요. 스와이프하거나 버튼으로
          관심 여부를 선택하면, 프로필을 공개해드려요. 약 2~3분 소요됩니다.
        </p>

        <div className="landing-how">
          <div className="landing-step">
            <span className="landing-step-icon">🃏</span>
            <span>카드 보기</span>
          </div>
          <span className="landing-step-arrow">→</span>
          <div className="landing-step">
            <span className="landing-step-icon">👉</span>
            <span>스와이프</span>
          </div>
          <span className="landing-step-arrow">→</span>
          <div className="landing-step">
            <span className="landing-step-icon">✨</span>
            <span>프로필 공개</span>
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
