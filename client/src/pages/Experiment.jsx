import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCandidate, getFullCandidate, postEvent } from '../api/client.js';
import ProfileCard from '../components/ProfileCard.jsx';
import DailyLifeCard from '../components/DailyLifeCard.jsx';
import ProfileReveal from '../components/ProfileReveal.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import TabBar from '../components/TabBar.jsx';
import { upsertMatch } from '../lib/matches.js';
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
  const [revealData, setRevealData] = useState(null);
  const [interestPending, setInterestPending] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);

  const { sessionId, condition, candidateIds } = session;

  const loadCandidate = useCallback(async (index) => {
    if (index >= candidateIds.length) {
      navigate('/matches');
      return;
    }
    setLoading(true);
    setError(null);

    const id = candidateIds[index];
    setCardVisible(false);
    try {
      let data = null;
      if (index === 0) {
        try {
          const cached = JSON.parse(localStorage.getItem('firstCandidate') || 'null');
          if (cached?.id === id) {
            const folder = id.replace('candidate_', 'candidate-');
            data = {
              ...cached,
              dailyMoments: (cached.dailyMoments || []).map((m, i) => ({
                ...m,
                imageUrl: `/candidates/${folder}/moment-${i + 1}.jpg`,
              })),
              profile: cached.profile
                ? { ...cached.profile, imageUrl: `/candidates/${folder}/profile.jpg` }
                : cached.profile,
            };
          }
        } catch { /* ignore */ }
        localStorage.removeItem('firstCandidate');
      }
      if (!data) data = await getCandidate(id, sessionId);
      setCandidate(data);
      const now = Date.now();
      setViewedAt(now);
      requestAnimationFrame(() => requestAnimationFrame(() => setCardVisible(true)));
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

  async function handleInterest() {
    if (interestPending) return;
    setInterestPending(true);
    const clickedAt = Date.now();
    postEvent({
      sessionId, condition,
      candidateId: candidate.id,
      event: 'candidate_interested',
      elapsedMs: clickedAt - viewedAt,
      timestamp: new Date(clickedAt).toISOString(),
    }).catch(() => {});

    try {
      const data = await getFullCandidate(candidate.id, sessionId);
      if (condition === 'daily_first') {
        postEvent({
          sessionId, condition,
          candidateId: candidate.id,
          event: 'profile_revealed',
          elapsedMs: Date.now() - clickedAt,
          timestamp: new Date().toISOString(),
        }).catch(() => {});
      }
      const folder = candidate.id.replace('candidate_', 'candidate-');
      const profile = data.profile || candidate.profile;
      const moments = data.dailyMoments || candidate.dailyMoments || [];
      upsertMatch({
        id: candidate.id,
        name: profile.name,
        age: profile.age,
        occupation: profile.occupation,
        bio: profile.bio,
        hobbies: profile.hobbies,
        imageUrl: `/candidates/${folder}/profile.jpg`,
        theirMoments: moments.map((m, i) => ({
          id: `${candidate.id}-m${i}`,
          time: m.time,
          caption: m.caption,
          imageUrl: m.imageUrl || `/candidates/${folder}/moment-${i + 1}.jpg`,
          reactions: [],
        })),
      });
      setRevealData({
        id: candidate.id,
        profile: {
          ...profile,
          imageUrl: `/candidates/${folder}/profile.jpg`,
        },
        dailyMoments: moments,
        highlightMoments: moments.slice(-2).map(m => ({
          time: m.time,
          caption: m.caption,
        })),
      });
    } catch {
      nextCandidate();
    }
    setInterestPending(false);
  }

  function handleRevealContinue() {
    setRevealData(null);
    nextCandidate();
  }

  function handleOpenLog() {
    if (!revealData?.id) return;
    navigate(`/log/${revealData.id}`);
  }

  if (!sessionId) return null;

  return (
    <main className="experiment">
      {revealData && (
        <ProfileReveal
          reveal={revealData}
          sessionId={sessionId}
          condition={condition}
          onContinue={handleRevealContinue}
          onOpenLog={handleOpenLog}
        />
      )}
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

      {!revealData && !loading && !error && candidate && (
        <div className={`card-wrap ${cardVisible ? 'card-visible' : ''}`}>
          {condition === 'daily_first' ? (
            <DailyLifeCard
              candidate={candidate}
              onSkip={handleSkip}
              onInterest={handleInterest}
              interestPending={interestPending}
            />
          ) : (
            <ProfileCard
              candidate={candidate}
              onSkip={handleSkip}
              onInterest={handleInterest}
              interestPending={interestPending}
            />
          )}
        </div>
      )}
      <TabBar />
    </main>
  );
}
