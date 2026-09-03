import { useState } from 'react';
import { getConversationStarters, postEvent } from '../api/client.js';
import './ConversationStarter.css';

export default function ConversationStarter({ candidateId, sessionId, condition }) {
  const [starters, setStarters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleRequest() {
    postEvent({
      sessionId, condition,
      candidateId,
      event: 'conversation_intent_clicked',
      elapsedMs: 0,
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    setLoading(true);
    setError(null);
    try {
      const { starters: items } = await getConversationStarters(candidateId, sessionId);
      if (items.length === 0) {
        setError('대화 주제를 생성하지 못했어요. 잠시 후 다시 시도해주세요.');
      } else {
        setStarters(items);
      }
    } catch {
      setError('대화 주제를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="starter-section">
      {!starters && !loading && (
        <button className="starter-trigger" onClick={handleRequest} disabled={loading}>
          💬 대화 주제 추천받기
        </button>
      )}

      {loading && (
        <div className="starter-loading">
          <div className="spinner" />
          <span>AI가 대화 주제를 생각하는 중...</span>
        </div>
      )}

      {error && (
        <div className="starter-loading">
          <span>{error}</span>
        </div>
      )}

      {starters && starters.length > 0 && (
        <div className="starter-list">
          {starters.map((s, i) => (
            <div key={i} className="starter-item">{s}</div>
          ))}
        </div>
      )}
    </div>
  );
}
