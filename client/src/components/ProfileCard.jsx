import useSwipe from '../hooks/useSwipe.js';
import './CandidateCard.css';

export default function ProfileCard({ candidate, onSkip, onInterest, interestPending }) {
  const { profile } = candidate;
  const { swipeBind } = useSwipe({ onSkip, onInterest, disabled: interestPending });

  return (
    <div {...swipeBind}>
      <span className="swipe-badge swipe-badge-left">넘기기</span>
      <span className="swipe-badge swipe-badge-right">관심</span>

      <article className="candidate-card">
        {/* Hero image with name overlay */}
        <div className="card-hero">
          <img
            src={profile.imageUrl}
            alt="후보 프로필"
            className="card-hero-image"
            draggable="false"
            fetchPriority="high"
            decoding="async"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div className="card-hero-gradient" />
          <div className="card-hero-identity">
            <span className="card-name">{profile.name}</span>
            <span className="card-age">{profile.age}세</span>
          </div>
        </div>

        {/* Info section */}
        <div className="card-info">
          <div className="card-occupation-row">
            <span className="card-occupation-icon">💼</span>
            <span className="card-occupation">{profile.occupation}</span>
          </div>

          <div className="card-hobbies">
            {profile.hobbies.map(h => (
              <span key={h} className="card-tag">{h}</span>
            ))}
          </div>

          <p className="card-bio">{profile.bio}</p>
        </div>

        <footer className="card-footer">
          <button className="btn-secondary" onClick={onSkip} disabled={interestPending}>
            넘기기
          </button>
          <button className="btn-primary" onClick={onInterest} disabled={interestPending}>
            {interestPending ? '…' : '더 알아보고 싶어요'}
          </button>
        </footer>
      </article>
    </div>
  );
}
