import api from './api.js';

export async function fetchSavedBookIds() {
  const { data } = await api.get('/account/saved');
  return data.savedBookIds || [];
}

export async function saveBook(bookId) {
  const { data } = await api.post('/account/saved', { bookId });
  return data.bookId;
}

export async function removeSavedBook(bookId) {
  await api.delete(`/account/saved/${bookId}`);
  return bookId;
}
