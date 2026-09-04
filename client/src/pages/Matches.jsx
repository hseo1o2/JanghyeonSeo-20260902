import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TabBar from '../components/TabBar.jsx';
import { getMatches, subscribeMatches } from '../lib/matches.js';
import './Matches.css';

function lastLine(match) {
  const mine = match.myMoments || [];
  const theirs = match.theirMoments || [];
  const msgs = match.messages || [];
  const lastMoment = [...mine, ...theirs].sort((a, b) => String(b.time).localeCompare(String(a.time)))[0];
  const lastMsg = msgs[msgs.length - 1];
  if (lastMsg) return lastMsg.text;
  if (lastMoment) return lastMoment.caption;
  return '오늘 로그가 열렸어요';
}

export default function Matches() {
  const [matches, setMatches] = useState(getMatches);

  useEffect(() => subscribeMatches(setMatches), []);

  return (
    <main className="matches-page">
      <header className="matches-header">
        <p className="matches-eyebrow">같이 쌓는 하루</p>
        <h1 className="matches-title">로그</h1>
      </header>

      {matches.length === 0 ? (
        <div className="matches-empty">
          <p>아직 열린 로그가 없어요</p>
          <p className="matches-empty-sub">발견에서 하루를 보고, 더 알고 싶은 사람과 로그를 시작하세요.</p>
          <Link to="/discover" className="btn-primary matches-cta">발견으로</Link>
        </div>
      ) : (
        <ul className="matches-list">
          {matches.map(m => (
            <li key={m.id}>
              <Link to={`/log/${m.id}`} className="matches-row">
                <img src={m.imageUrl} alt="" className="matches-avatar" />
                <div className="matches-meta">
                  <div className="matches-name-row">
                    <span className="matches-name">{m.name}</span>
                    <span className="matches-age">{m.age}세</span>
                  </div>
                  <p className="matches-preview">{lastLine(m)}</p>
                </div>
                <span className="matches-count">{(m.theirMoments?.length || 0) + (m.myMoments?.length || 0)}장면</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <TabBar />
    </main>
  );
}
