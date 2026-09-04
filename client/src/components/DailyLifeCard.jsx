import { useRef, useState } from 'react';
import './CandidateCard.css';

const THRESHOLD = 80;

export default function DailyLifeCard({ candidate, onSkip, onInterest, interestPending }) {
  const { dailyMoments } = candidate;
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
            {interestPending ? '…' : '더 알아보고 싶어요'}
          </button>
        </footer>
      </article>
    </div>
  );
}
