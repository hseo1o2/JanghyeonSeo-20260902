import { NavLink } from 'react-router-dom';
import { getMatches } from '../lib/matches.js';
import './TabBar.css';

function IconDiscover({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="10" rx="2" />
      <rect x="14" y="3" width="7" height="6" rx="2" />
      <rect x="14" y="13" width="7" height="8" rx="2" />
      <rect x="3" y="17" width="7" height="4" rx="2" />
    </svg>
  );
}

function IconLog({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function TabBar() {
  const count = getMatches().length;
  return (
    <nav className="tabbar">
      <NavLink to="/discover" className={({ isActive }) => `tabbar-item ${isActive ? 'active' : ''}`}>
        {({ isActive }) => (
          <>
            <IconDiscover active={isActive} />
            <span>발견</span>
          </>
        )}
      </NavLink>
      <NavLink to="/matches" className={({ isActive }) => `tabbar-item ${isActive ? 'active' : ''}`}>
        {({ isActive }) => (
          <>
            <span className="tabbar-icon-wrap">
              <IconLog active={isActive} />
              {count > 0 && <span className="tabbar-badge">{count}</span>}
            </span>
            <span>로그</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
