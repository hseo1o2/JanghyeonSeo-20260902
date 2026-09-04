import { useRef, useState } from 'react';
import './CandidateCard.css';

const THRESHOLD = 80;

export default function DailyLifeCard({ candidate, onSkip, onInterest, interestPending }) {
  const { dailyMoments } = candidate;
  const wrapRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, dx: 0 });
  const [swipeDir, setSwipeDir] = useState(null);

  function clientX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  function onDragStart(e) {
    if (interestPending) return;
    drag.current = { active: true, startX: clientX(e), dx: 0 };
    if (wrapRef.current) wrapRef.current.style.transition = 'none';
  }

  function onDragMove(e) {
    if (!drag.current.active) return;
    const dx = clientX(e) - drag.current.startX;
    drag.current.dx = dx;
    if (wrapRef.current) {
      wrapRef.current.style.transform = `translateX(${dx}px) rotate(${dx * 0.05}deg)`;
    }
    setSwipeDir(dx > 40 ? 'right' : dx < -40 ? 'left' : null);
  }

  function onDragEnd() {
    if (!drag.current.active) return;
    drag.current.active = false;
    const dx = drag.current.dx;
    drag.current.dx = 0;

    if (dx > THRESHOLD) {
      fly(1, onInterest);
    } else if (dx < -THRESHOLD) {
      fly(-1, onSkip);
    } else {
      snapBack();
    }
  }

  function fly(dir, callback) {
    if (!wrapRef.current) return;
    wrapRef.current.style.transition = 'transform 0.3s ease-in';
    wrapRef.current.style.transform = `translateX(${dir * 130}%) rotate(${dir * 25}deg)`;
    setSwipeDir(null);
    setTimeout(() => callback?.(), 250);
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
                  draggable="false"
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
    </div>
  );
}
