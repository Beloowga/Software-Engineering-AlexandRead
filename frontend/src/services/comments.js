import api from './api.js';

export async function fetchCommentStats(bookId) {
  const res = await api.get(`/comments/stats/${bookId}`);
  return res.data;
}

export async function fetchComments(bookId, limit = 10, offset = 0) {
  const res = await api.get(`/comments/book/${bookId}`, {
    params: { limit, offset },
  });
  return res.data;
}

export async function postComment(bookId, rating, comment) {
  const res = await api.post('/comments', {
    bookId,
    rating,
    comment,
  });
  return res.data;
}

export async function updateCommentRequest(commentId, rating, comment) {
  const res = await api.put(`/comments/${commentId}`, {
    rating,
    comment,
  });
  return res.data;
}

export async function deleteCommentRequest(commentId) {
  const res = await api.delete(`/comments/${commentId}`);
  return res.data;
}
