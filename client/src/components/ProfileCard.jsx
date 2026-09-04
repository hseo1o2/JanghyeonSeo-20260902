import { useRef, useState } from 'react';
import './CandidateCard.css';

const THRESHOLD = 80;

export default function ProfileCard({ candidate, onSkip, onInterest, interestPending }) {
  const { profile } = candidate;
  const wrapRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, dx: 0 });
  const [swipeDir, setSwipeDir] = useState(null);

  function point(e) {
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX, y: t.clientY };
  }

  function onDragStart(e) {
    if (interestPending) return;
    const p = point(e);
    drag.current = { active: false, startX: p.x, startY: p.y, dx: 0 };
    if (wrapRef.current) wrapRef.current.style.transition = 'none';
  }

  function onDragMove(e) {
    if (!drag.current.startX && drag.current.startX !== 0) return;
    const p = point(e);
    const dx = p.x - drag.current.startX;
    const dy = p.y - drag.current.startY;
    if (!drag.current.active) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) { drag.current.startX = null; return; }
      drag.current.active = true;
    }
    drag.current.dx = dx;
    if (wrapRef.current)
      wrapRef.current.style.transform = `translateX(${dx}px) rotate(${dx * 0.05}deg)`;
    setSwipeDir(dx > 40 ? 'right' : dx < -40 ? 'left' : null);
  }

  function onDragEnd() {
    if (!drag.current.active) return;
    drag.current.active = false;
    const dx = drag.current.dx;
    drag.current.dx = 0;
    if (dx > THRESHOLD) fly(1, onInterest);
    else if (dx < -THRESHOLD) fly(-1, onSkip);
    else snapBack();
  }

  function fly(dir, cb) {
    if (!wrapRef.current) return;
    wrapRef.current.style.transition = 'transform 0.3s ease-in';
    wrapRef.current.style.transform = `translateX(${dir * 130}%) rotate(${dir * 25}deg)`;
    setSwipeDir(null);
    setTimeout(() => cb?.(), 250);
  }

  function snapBack() {
    if (!wrapRef.current) return;
    wrapRef.current.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    wrapRef.current.style.transform = '';
    setSwipeDir(null);
  }

  return (
    <div
      ref={wrapRef}
      className="swipe-wrap"
      data-dir={swipeDir}
      onMouseDown={e => { e.preventDefault(); onDragStart(e); }}
      onMouseMove={e => drag.current.active && onDragMove(e)}
      onMouseUp={onDragEnd}
      onMouseLeave={() => drag.current.active && onDragEnd()}
      onTouchStart={onDragStart}
      onTouchMove={onDragMove}
      onTouchEnd={onDragEnd}
    >
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
