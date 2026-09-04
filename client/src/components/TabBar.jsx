import { NavLink } from 'react-router-dom';
import { getMatches } from '../lib/matches.js';
import './TabBar.css';

export default function TabBar() {
  const count = getMatches().length;
  return (
    <nav className="tabbar">
      <NavLink to="/discover" className={({ isActive }) => `tabbar-item ${isActive ? 'active' : ''}`}>
        <span className="tabbar-icon">◇</span>
        <span>발견</span>
      </NavLink>
      <NavLink to="/matches" className={({ isActive }) => `tabbar-item ${isActive ? 'active' : ''}`}>
        <span className="tabbar-icon">▣</span>
        <span>로그{count > 0 ? ` ${count}` : ''}</span>
      </NavLink>
    </nav>
  );
}
