import api from './api.js';

export async function fetchReadBookIds() {
  const { data } = await api.get('/account/read');
  return data.readBookIds || [];
}

export async function markBookAsRead(bookId) {
  const { data } = await api.post('/account/read', { bookId });
  return data.bookId;
}
