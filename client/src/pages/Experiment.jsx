import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCandidate, postEvent } from '../api/client.js';
import ProfileCard from '../components/ProfileCard.jsx';
import DailyLifeCard from '../components/DailyLifeCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import './Experiment.css';

function getSession() {
  return {
    sessionId: localStorage.getItem('sessionId'),
    condition: localStorage.getItem('condition'),
    candidateIds: JSON.parse(localStorage.getItem('candidateIds') || '[]'),
    candidateIndex: parseInt(localStorage.getItem('candidateIndex') || '0', 10),
  };
}

export default function Experiment() {
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewedAt, setViewedAt] = useState(null);

  const { sessionId, condition, candidateIds, candidateIndex } = getSession();

  const loadCandidate = useCallback(async (index) => {
    if (index >= candidateIds.length) {
      navigate('/complete');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const id = candidateIds[index];
      const data = await getCandidate(id, condition);
      setCandidate(data);
      const now = Date.now();
      setViewedAt(now);
      await postEvent({
        sessionId, condition,
        candidateId: id,
        event: 'candidate_viewed',
        elapsedMs: 0,
        timestamp: new Date(now).toISOString(),
      });
    } catch (err) {
      setError('후보를 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [sessionId, condition, candidateIds, navigate]);

  useEffect(() => {
    if (!sessionId) { navigate('/'); return; }
    loadCandidate(candidateIndex);
  }, []);

  function nextCandidate() {
    const next = candidateIndex + 1;
    localStorage.setItem('candidateIndex', String(next));
    loadCandidate(next);
  }

  async function handleSkip() {
    await postEvent({
      sessionId, condition,
      candidateId: candidate.id,
      event: 'candidate_skipped',
      elapsedMs: Date.now() - viewedAt,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
    nextCandidate();
  }

  async function handleInterest() {
    await postEvent({
      sessionId, condition,
      candidateId: candidate.id,
      event: 'candidate_interested',
      elapsedMs: Date.now() - viewedAt,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
    // Profile reveal is handled in feat/profile-reveal
    // For now, move to next candidate
    nextCandidate();
  }

  if (!sessionId) return null;

  return (
    <main className="experiment">
      <ProgressBar current={candidateIndex + 1} total={candidateIds.length} />

      {loading && (
        <div className="experiment-state">
          <div className="spinner" />
        </div>
      )}

      {error && (
        <div className="experiment-state">
          <p className="error-text">{error}</p>
          <button className="btn-primary" onClick={() => loadCandidate(candidateIndex)}>
            다시 시도
          </button>
        </div>
      )}

      {!loading && !error && candidate && (
        <div className="card-wrap">
          {condition === 'daily_first' ? (
            <DailyLifeCard candidate={candidate} onSkip={handleSkip} onInterest={handleInterest} />
          ) : (
            <ProfileCard candidate={candidate} onSkip={handleSkip} onInterest={handleInterest} />
          )}
        </div>
      )}
    </main>
  );
}
