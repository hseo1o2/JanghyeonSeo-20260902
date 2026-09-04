import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, getDemoAccounts } from '../api/client.js';
import { setAuth, isLoggedIn } from '../lib/auth.js';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [quickLoading, setQuickLoading] = useState(null);
  const [error, setError]           = useState(null);
  const [accounts, setAccounts]     = useState([]);

  useEffect(() => {
    if (isLoggedIn()) { navigate('/'); return; }
    getDemoAccounts().then(setAccounts).catch(() => {});
  }, [navigate]);

  async function quickLogin(acc) {
    if (quickLoading !== null) return;
    setQuickLoading(acc.email);
    setError(null);
    try {
      const { token, user } = await login(acc.email, acc.password);
      setAuth(token, user);
      navigate('/');
    } catch (err) {
      setError(err.message || '로그인에 실패했어요.');
      setQuickLoading(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await login(email.trim(), password);
      setAuth(token, user);
      navigate('/');
    } catch (err) {
      setError(err.message || '로그인에 실패했어요.');
    } finally {
      setLoading(false);
    }
  }

  const busy = loading || quickLoading !== null;

  return (
    <main className="login-wrap">
      <div className="login-card">
        <p className="login-eyebrow">체험하기</p>
        <h1 className="login-title">데모 계정으로<br />바로 시작하기</h1>
        <p className="login-subtitle">클릭 한 번으로 바로 로그인돼요</p>

        {accounts.length > 0 && (
          <div className="demo-accounts">
            <div className="demo-accounts-list">
              {accounts.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  className={`demo-account-btn${quickLoading === acc.email ? ' loading' : ''}`}
                  onClick={() => quickLogin(acc)}
                  disabled={busy}
                >
                  <span className="demo-account-name">{acc.name}</span>
                  <span className={`demo-account-badge ${acc.forcedCondition || 'random'}`}>
                    {quickLoading === acc.email ? '로그인 중…' :
                     acc.forcedCondition === 'daily_first'   ? '일상 먼저' :
                     acc.forcedCondition === 'profile_first' ? '프로필 먼저' : '랜덤'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="login-divider">
          <span>또는 직접 입력</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label">
            이메일
            <input
              type="email"
              className="login-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user01@demo.com"
              autoComplete="email"
              required
              disabled={busy}
            />
          </label>
          <label className="login-label">
            비밀번호
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Demo1234"
              autoComplete="current-password"
              required
              disabled={busy}
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primary login-submit" disabled={busy}>
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </form>

        <Link to="/" className="login-skip">로그인 없이 체험하기 →</Link>
      </div>
    </main>
  );
}
