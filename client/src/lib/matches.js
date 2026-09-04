const KEY = 'matches';

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('matches-changed'));
}

export function getMatches() {
  return read().sort((a, b) => (b.matchedAt || '').localeCompare(a.matchedAt || ''));
}

export function getMatch(candidateId) {
  return read().find(m => m.id === candidateId) || null;
}

export function upsertMatch(partial) {
  const list = read();
  const i = list.findIndex(m => m.id === partial.id);
  const next = i >= 0 ? { ...list[i], ...partial } : {
    theirMoments: [],
    myMoments: [],
    messages: [],
    matchedAt: new Date().toISOString(),
    ...partial,
  };
  if (i >= 0) list[i] = next;
  else list.unshift(next);
  write(list);
  return next;
}

export function addMyMoment(candidateId, moment) {
  const list = read();
  const i = list.findIndex(m => m.id === candidateId);
  if (i < 0) return null;
  const entry = {
    id: `me-${Date.now()}`,
    author: 'me',
    reactions: [],
    ...moment,
  };
  list[i] = { ...list[i], myMoments: [...(list[i].myMoments || []), entry] };
  write(list);
  return list[i];
}

export function addReaction(candidateId, entryId, emoji) {
  const list = read();
  const i = list.findIndex(m => m.id === candidateId);
  if (i < 0) return null;
  const toggle = moments => (moments || []).map(m => {
    if (m.id !== entryId) return m;
    const has = (m.reactions || []).includes(emoji);
    return {
      ...m,
      reactions: has ? m.reactions.filter(r => r !== emoji) : [...(m.reactions || []), emoji],
    };
  });
  list[i] = {
    ...list[i],
    theirMoments: toggle(list[i].theirMoments),
    myMoments: toggle(list[i].myMoments),
  };
  write(list);
  return list[i];
}

export function addMessage(candidateId, message) {
  const list = read();
  const i = list.findIndex(m => m.id === candidateId);
  if (i < 0) return null;
  const entry = {
    id: `msg-${Date.now()}`,
    at: new Date().toISOString(),
    ...message,
  };
  list[i] = { ...list[i], messages: [...(list[i].messages || []), entry] };
  write(list);
  return list[i];
}

export function subscribeMatches(fn) {
  const handler = () => fn(getMatches());
  window.addEventListener('matches-changed', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('matches-changed', handler);
    window.removeEventListener('storage', handler);
  };
}
