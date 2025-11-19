const TOKEN_KEY = 'alexandread:token';
const PROFILE_KEY = 'alexandread:profile';

function getStore() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export function getStoredToken() {
  const store = getStore();
  if (!store) return null;
  return store.getItem(TOKEN_KEY);
}

export function getStoredProfile() {
  const store = getStore();
  if (!store) return null;
  try {
    const raw = store.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Unable to parse stored profile', err);
    return null;
  }
}

export function persistSession(token, profile) {
  const store = getStore();
  if (!store) return;
  if (token) {
    store.setItem(TOKEN_KEY, token);
  } else {
    store.removeItem(TOKEN_KEY);
  }
  if (profile) {
    store.setItem(PROFILE_KEY, JSON.stringify(profile));
  } else {
    store.removeItem(PROFILE_KEY);
  }
}

export function updateStoredProfile(profile) {
  const store = getStore();
  if (!store) return;
  if (profile) {
    store.setItem(PROFILE_KEY, JSON.stringify(profile));
  } else {
    store.removeItem(PROFILE_KEY);
  }
}

export function clearStoredAuth() {
  const store = getStore();
  if (!store) return;
  store.removeItem(TOKEN_KEY);
  store.removeItem(PROFILE_KEY);
}
