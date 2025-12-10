import api from './api.js';

export async function fetchCurrentReading() {
  const { data } = await api.get('/account/reading');
  return data.entries || [];
}

export async function fetchReadingStatus(bookId) {
  const { data } = await api.get(`/account/reading/${bookId}`);
  return data.entry || null;
}

export async function startReading(bookId) {
  const { data } = await api.post(`/account/reading/${bookId}/start`);
  return data.entry;
}

export async function finishReading(bookId) {
  const { data } = await api.post(`/account/reading/${bookId}/finish`);
  return data.entry;
}
