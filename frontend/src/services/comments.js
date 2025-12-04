import api from './api.js';

/**
 * Get comment statistics for a book
 * @param {number} bookId - The book ID
 * @returns {Promise<Object>} - { averageRating: number | null, totalComments: number }
 */
export async function fetchCommentStats(bookId) {
  const res = await api.get(`/comments/stats/${bookId}`);
  return res.data;
}

/**
 * Get all comments for a book
 * @param {number} bookId - The book ID
 * @param {number} limit - Number of comments to fetch (default: 10)
 * @param {number} offset - Offset for pagination (default: 0)
 * @returns {Promise<Object>} - { comments: Array, total: number }
 */
export async function fetchComments(bookId, limit = 10, offset = 0) {
  const res = await api.get(`/comments/book/${bookId}`, {
    params: { limit, offset },
  });
  return res.data;
}

/**
 * Create a new comment
 * @param {number} bookId - The book ID
 * @param {number} rating - Rating from 1 to 10
 * @param {string} comment - The comment text (optional, max 500 chars)
 * @returns {Promise<Object>} - The created comment
 */
export async function postComment(bookId, rating, comment) {
  const res = await api.post('/comments', {
    bookId,
    rating,
    comment,
  });
  return res.data;
}

/**
 * Update an existing comment
 * @param {number} commentId - The comment ID
 * @param {number} rating - Rating from 1 to 10
 * @param {string} comment - The comment text (optional, max 500 chars)
 * @returns {Promise<Object>} - The updated comment
 */
export async function updateCommentRequest(commentId, rating, comment) {
  const res = await api.put(`/comments/${commentId}`, {
    rating,
    comment,
  });
  return res.data;
}

/**
 * Delete a comment
 * @param {number} commentId - The comment ID to delete
 * @returns {Promise<Object>} - Success message
 */
export async function deleteCommentRequest(commentId) {
  const res = await api.delete(`/comments/${commentId}`);
  return res.data;
}
