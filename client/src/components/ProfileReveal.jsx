import './ProfileReveal.css';
import { BASE_URL as BASE } from '../api/client.js';

export default function ProfileReveal({ reveal, onContinue }) {
  const { profile, highlightMoments } = reveal;

  return (
    <div className="reveal-overlay">
      <div className="reveal-sheet">
        <div className="reveal-handle" />
        <p className="reveal-badge">프로필 공개</p>

        <div className="reveal-image-wrap">
          <img
            src={`${BASE}${profile.imageUrl}`}
            alt="후보 프로필"
            className="reveal-image"
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>

        <div className="reveal-body">
          <div className="reveal-identity">
            <span className="reveal-name">{profile.name}</span>
            <span className="reveal-age">{profile.age}세</span>
          </div>
          <p className="reveal-occupation">{profile.occupation}</p>

          <div className="reveal-hobbies">
            {profile.hobbies.map(h => (
              <span key={h} className="card-tag">{h}</span>
            ))}
          </div>

          <p className="reveal-bio">{profile.bio}</p>

          {highlightMoments?.length > 0 && (
            <div className="reveal-moments">
              <p className="reveal-moments-label">방금 봤던 일상 순간들</p>
              {highlightMoments.map((m, i) => (
                <div key={i} className="reveal-moment">
                  <span className="moment-time">{m.time}</span>
                  <span className="moment-caption">{m.caption}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="reveal-footer">
          <button className="btn-primary" onClick={onContinue}>
            다음 후보 보기
          </button>
        </footer>
      </div>
    </div>
  );
}
