import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCandidate, postEvent } from '../api/client.js';
import ProfileCard from '../components/ProfileCard.jsx';
import DailyLifeCard from '../components/DailyLifeCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import './Experiment.css';

function readSession() {
  let candidateIds = [];
  try {
    candidateIds = JSON.parse(localStorage.getItem('candidateIds') || '[]');
  } catch {
    candidateIds = [];
  }
  return {
    sessionId: localStorage.getItem('sessionId'),
    condition: localStorage.getItem('condition'),
    candidateIds,
    candidateIndex: parseInt(localStorage.getItem('candidateIndex') || '0', 10),
  };
}

export default function Experiment() {
  const navigate = useNavigate();

  // Parse localStorage once — avoids new array reference on every render
  const [session] = useState(readSession);

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewedAt, setViewedAt] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(session.candidateIndex);

  const { sessionId, condition, candidateIds } = session;

  const loadCandidate = useCallback(async (index) => {
    if (index >= candidateIds.length) {
      navigate('/complete');
      return;
    }
    setLoading(true);
    setError(null);

    const id = candidateIds[index];
    try {
      const data = await getCandidate(id, condition);
      setCandidate(data);
      const now = Date.now();
      setViewedAt(now);
      // Fire-and-forget: logging failure must not block card display
      postEvent({
        sessionId, condition,
        candidateId: id,
        event: 'candidate_viewed',
        elapsedMs: 0,
        timestamp: new Date(now).toISOString(),
      }).catch(() => {});
    } catch {
      setError('후보를 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [sessionId, condition, candidateIds, navigate]);

  useEffect(() => {
    if (!sessionId) { navigate('/'); return; }
    loadCandidate(currentIndex);
  }, [loadCandidate, currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  function nextCandidate() {
    const next = currentIndex + 1;
    localStorage.setItem('candidateIndex', String(next));
    setCurrentIndex(next);
  }

  function handleSkip() {
    postEvent({
      sessionId, condition,
      candidateId: candidate.id,
      event: 'candidate_skipped',
      elapsedMs: Date.now() - viewedAt,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
    nextCandidate();
  }

  function handleInterest() {
    postEvent({
      sessionId, condition,
      candidateId: candidate.id,
      event: 'candidate_interested',
      elapsedMs: Date.now() - viewedAt,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
    // Profile reveal handled in feat/profile-reveal
    nextCandidate();
  }

  if (!sessionId) return null;

  return (
    <main className="experiment">
      <ProgressBar current={currentIndex + 1} total={candidateIds.length} />

      {loading && (
        <div className="experiment-state">
          <div className="spinner" />
        </div>
      )}

      {error && (
        <div className="experiment-state">
          <p className="error-text">{error}</p>
          <button className="btn-primary" onClick={() => loadCandidate(currentIndex)}>
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
