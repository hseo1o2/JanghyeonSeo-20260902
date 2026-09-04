export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function authHeaders() {
  try {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch { return {}; }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const startExperiment = (condition) =>
  request(`/api/experiment/start${condition ? `?condition=${condition}` : ''}`);

export const getCandidate = (id, sessionId) =>
  request(`/api/candidates/${id}?sessionId=${sessionId}`);

export const revealProfile = (id, sessionId) =>
  request(`/api/candidates/${id}/reveal?sessionId=${sessionId}`);

export const postEvent = (payload) =>
  request('/api/events', { method: 'POST', body: JSON.stringify(payload) });

export const getConversationStarters = (candidateId, sessionId) =>
  request('/api/conversation-starters', {
    method: 'POST',
    body: JSON.stringify({ candidateId, sessionId }),
  });

export const submitSurvey = (payload) =>
  request('/api/survey', { method: 'POST', body: JSON.stringify(payload) });

export const login = (email, password) =>
  request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const getDemoAccounts = () =>
  request('/api/auth/accounts');
