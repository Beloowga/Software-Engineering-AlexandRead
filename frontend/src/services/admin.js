import api from './api.js';

export async function createBook(payload) {
  const { data } = await api.post('/admin/books', payload);
  return data;
}

export async function updateBook(bookId, payload) {
  const { data } = await api.put(`/admin/books/${bookId}`, payload);
  return data;
}

export async function deleteBook(bookId) {
  await api.delete(`/admin/books/${bookId}`);
}

export async function fetchAdminComments(params = {}) {
  const { data } = await api.get('/admin/comments', { params });
  return data;
}

export async function uploadCoverFile(dataUrl, filename) {
  const { data } = await api.post('/admin/upload/cover', { file: dataUrl, filename });
  return data;
}

export async function uploadBookContent(dataUrl, filename) {
  const { data } = await api.post('/admin/upload/book', { file: dataUrl, filename });
  return data;
}

export async function updateAdminComment(commentId, payload) {
  const { data } = await api.put(`/admin/comments/${commentId}`, payload);
  return data;
}

export async function deleteAdminComment(commentId) {
  await api.delete(`/admin/comments/${commentId}`);
}
