import './CandidateCard.css';

export default function DailyLifeCard({ candidate, onSkip, onInterest, interestPending }) {
  const { dailyMoments } = candidate;

  return (
    <article className="candidate-card">
      <p className="card-daily-label">오늘의 하루</p>

      <div className="card-moments">
        {dailyMoments.map((m, i) => (
          <div key={i} className="moment">
            <div className="moment-image-wrap">
              <img
                src={m.imageUrl}
                alt={m.caption}
                className="moment-image"
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="moment-info">
              <time className="moment-time">{m.time}</time>
              <p className="moment-caption">{m.caption}</p>
            </div>
          </div>
        ))}
      </div>

      <footer className="card-footer">
        <button className="btn-secondary" onClick={onSkip} disabled={interestPending}>넘기기</button>
        <button className="btn-primary" onClick={onInterest} disabled={interestPending}>
          {interestPending ? '…' : '더 알아보고 싶어요'}
        </button>
      </footer>
    </article>
  );
}
