const KEY = 'pendingChat';

export function setPendingChat(candidateId, text) {
  sessionStorage.setItem(KEY, JSON.stringify({ candidateId, text }));
}

export function takePendingChat(candidateId) {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.candidateId !== candidateId || !data.text) return null;
    sessionStorage.removeItem(KEY);
    return String(data.text);
  } catch {
    sessionStorage.removeItem(KEY);
    return null;
  }
}
