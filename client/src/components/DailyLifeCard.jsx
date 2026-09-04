import useSwipe from '../hooks/useSwipe.js';
import './CandidateCard.css';

export default function DailyLifeCard({ candidate, onSkip, onInterest, interestPending }) {
  const { dailyMoments } = candidate;
  const { swipeBind } = useSwipe({ onSkip, onInterest, disabled: interestPending });

  return (
    <div {...swipeBind}>
      <span className="swipe-badge swipe-badge-left">넘기기</span>
      <span className="swipe-badge swipe-badge-right">관심</span>

      <article className="candidate-card">
        <div className="card-day-header">
          <span className="card-day-label">오늘의 하루</span>
          <span className="card-day-dot" />
          <span className="card-day-label">{dailyMoments.length}장면</span>
        </div>

        <div className="card-moments">
          {dailyMoments.map((m, i) => (
            <div key={i} className="moment">
              <div className="moment-image-wrap">
                <img
                  src={m.imageUrl}
                  alt={m.caption}
                  className="moment-image"
                  draggable="false"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <span className="moment-time-badge">{m.time}</span>
              </div>
              <div className="moment-caption-wrap">
                <p className="moment-caption">{m.caption}</p>
              </div>
            </div>
          ))}
        </div>

        <footer className="card-footer">
          <button className="btn-secondary" onClick={onSkip} disabled={interestPending}>
            넘기기
          </button>
          <button className="btn-primary" onClick={onInterest} disabled={interestPending}>
            {interestPending ? '…' : '관심 있어요'}
          </button>
        </footer>
      </article>
    </div>
  );
}
