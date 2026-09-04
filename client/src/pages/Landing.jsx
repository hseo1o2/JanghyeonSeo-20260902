import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { startExperiment } from '../api/client.js';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Resume existing session instead of re-rolling
  useEffect(() => {
    const sid   = localStorage.getItem('sessionId');
    const index = parseInt(localStorage.getItem('candidateIndex') || '0', 10);
    const ids   = JSON.parse(localStorage.getItem('candidateIds') || '[]');
    if (sid && index < ids.length) {
      navigate('/experiment', { replace: true });
    }
  }, [navigate]);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const { sessionId, condition, candidateIds } = await startExperiment();
      localStorage.setItem('sessionId', sessionId);
      localStorage.setItem('condition', condition);
      localStorage.setItem('candidateIds', JSON.stringify(candidateIds));
      localStorage.setItem('candidateIndex', '0');
      navigate('/experiment');
    } catch {
      setError('서버 연결에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="landing">
      <div className="landing-content">
        <p className="landing-eyebrow">Daily-life-first experiment</p>
        <h1 className="landing-title">
          프로필보다 하루를 먼저 보면,<br />
          사람을 다르게 보게 될까요?
        </h1>
        <p className="landing-desc">
          몇 명의 후보를 보고 더 알아보고 싶은 사람을 선택해주세요.<br />
          약 2~3분 소요됩니다.
        </p>
        <button
          className="btn-primary landing-cta"
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? '연결 중…' : '시작하기'}
        </button>
        {error && <p className="landing-error">{error}</p>}
      </div>
    </main>
  );
}
