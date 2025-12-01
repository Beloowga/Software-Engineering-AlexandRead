import api from './api.js';

export async function fetchSubscription() {
  const { data } = await api.get('/subscription/me');
  return data.subscription;
}

export async function startSubscription(autoRenew = true) {
  const { data } = await api.post('/subscription/start', { autoRenew });
  return data.subscription;
}

export async function updateAutoRenew(autoRenew) {
  const { data } = await api.patch('/subscription/auto-renew', { autoRenew });
  return data.subscription;
}
