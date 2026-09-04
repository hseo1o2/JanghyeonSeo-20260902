const TOKEN_KEY = 'authToken';
const USER_KEY  = 'authUser';

export function getToken()  { return localStorage.getItem(TOKEN_KEY); }
export function getUser()   { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } }
export function isLoggedIn(){ return !!getToken(); }

export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
