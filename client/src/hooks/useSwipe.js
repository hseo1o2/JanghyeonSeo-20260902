import { useRef, useState } from 'react';

const THRESHOLD = 80;

export default function useSwipe({ onSkip, onInterest, disabled }) {
  const wrapRef = useRef(null);
  const drag = useRef({ tracking: false, active: false, startX: 0, startY: 0, dx: 0 });
  const [swipeDir, setSwipeDir] = useState(null);

  function fly(dir, cb) {
    if (!wrapRef.current) return;
    wrapRef.current.style.transition = 'transform 0.28s ease-in';
    wrapRef.current.style.transform = `translateX(${dir * 130}%) rotate(${dir * 22}deg)`;
    setSwipeDir(null);
    window.setTimeout(() => cb?.(), 240);
  }

  function snapBack() {
    if (!wrapRef.current) return;
    wrapRef.current.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
    wrapRef.current.style.transform = '';
    setSwipeDir(null);
  }

  function onPointerDown(e) {
    if (disabled) return;
    if (e.target.closest('button, a, input, textarea')) return;
    drag.current = {
      tracking: true,
      active: false,
      startX: e.clientX,
      startY: e.clientY,
      dx: 0,
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    if (wrapRef.current) wrapRef.current.style.transition = 'none';
  }

  function onPointerMove(e) {
    if (!drag.current.tracking) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    if (!drag.current.active) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.current.tracking = false;
        snapBack();
        return;
      }
      drag.current.active = true;
    }
    if (e.cancelable) e.preventDefault();
    drag.current.dx = dx;
    if (wrapRef.current) {
      wrapRef.current.style.transform = `translateX(${dx}px) rotate(${dx * 0.04}deg)`;
    }
    setSwipeDir(dx > 40 ? 'right' : dx < -40 ? 'left' : null);
  }

  function onPointerUp() {
    if (!drag.current.tracking) return;
    const wasActive = drag.current.active;
    const dx = drag.current.dx;
    drag.current.tracking = false;
    drag.current.active = false;
    drag.current.dx = 0;
    if (!wasActive) {
      snapBack();
      return;
    }
    if (dx > THRESHOLD) fly(1, onInterest);
    else if (dx < -THRESHOLD) fly(-1, onSkip);
    else snapBack();
  }

  const swipeBind = {
    ref: wrapRef,
    className: 'swipe-wrap',
    'data-dir': swipeDir,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  };

  return { swipeBind, swipeDir };
}
