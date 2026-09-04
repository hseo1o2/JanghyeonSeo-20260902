import './CandidateCard.css';
import { BASE_URL as BASE } from '../api/client.js';

export default function ProfileCard({ candidate, onSkip, onInterest, interestPending }) {
  const { profile } = candidate;

  return (
    <article className="candidate-card">
      <div className="card-image-wrap">
        <img
          src={`${BASE}${profile.imageUrl}`}
          alt="후보 프로필"
          className="card-image"
          onError={e => { e.target.style.display = 'none'; }}
        />
      </div>

      <div className="card-body">
        <div className="card-identity">
          <span className="card-name">{profile.name}</span>
          <span className="card-age">{profile.age}세</span>
        </div>
        <p className="card-occupation">{profile.occupation}</p>

        <div className="card-hobbies">
          {profile.hobbies.map(h => (
            <span key={h} className="card-tag">{h}</span>
          ))}
        </div>

        <p className="card-bio">{profile.bio}</p>
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
