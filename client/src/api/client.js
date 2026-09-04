export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function authHeaders() {
  try {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch { return {}; }
}

export function warmupHealth() {
  return fetch(`${BASE_URL}/api/health`, { cache: 'no-store' }).catch(() => null);
}

let inflightStart = null;
let inflightKey = null;

export function prefetchStart(condition) {
  const key = condition || '';
  if (inflightStart && inflightKey === key) return inflightStart;
  inflightKey = key;
  inflightStart = startExperiment(condition).catch(err => {
    inflightStart = null;
    inflightKey = null;
    throw err;
  });
  return inflightStart;
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

function localAssetFolder(candidateId) {
  return String(candidateId || '').replace('candidate_', 'candidate-');
}

function withLocalImages(data) {
  if (!data?.id) return data;
  const folder = localAssetFolder(data.id);
  const next = { ...data };
  if (next.profile) {
    next.profile = { ...next.profile, imageUrl: `/candidates/${folder}/profile.jpg` };
  }
  if (next.dailyMoments) {
    next.dailyMoments = next.dailyMoments.map((m, i) => ({
      ...m,
      imageUrl: `/candidates/${folder}/moment-${i + 1}.jpg`,
    }));
  }
  return next;
}

export const startExperiment = (condition) =>
  request(`/api/experiment/start${condition ? `?condition=${condition}` : ''}`).then(res => ({
    ...res,
    firstCandidate: res.firstCandidate ? withLocalImages(res.firstCandidate) : res.firstCandidate,
  }));

export const getCandidate = (id, sessionId) =>
  request(`/api/candidates/${id}?sessionId=${sessionId}`).then(withLocalImages);

export const revealProfile = (id, sessionId) =>
  request(`/api/candidates/${id}/reveal?sessionId=${sessionId}`).then(withLocalImages);

export async function getFullCandidate(id, sessionId) {
  try {
    return withLocalImages(await request(`/api/candidates/${id}/full?sessionId=${sessionId}`));
  } catch {
    try {
      return withLocalImages(await request(`/api/candidates/${id}/reveal?sessionId=${sessionId}`));
    } catch {
      return withLocalImages(await request(`/api/candidates/${id}?sessionId=${sessionId}`));
    }
  }
}

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
