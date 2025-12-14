import express from 'express';
import {
  getCommentStats,
  getCommentsByBookId,
  createComment,
  deleteComment,
  updateComment,
} from '../controllers/commentController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET comment statistics (average rating, count) for a book - public endpoint
router.get('/stats/:bookId', getCommentStats);

// GET comments for a book - public endpoint
router.get('/book/:bookId', getCommentsByBookId);

// POST a new comment - requires authentication
router.post('/', requireAuth, createComment);

// UPDATE a comment - requires authentication
router.put('/:commentId', requireAuth, updateComment);

// DELETE a comment - requires authentication
router.delete('/:commentId', requireAuth, deleteComment);

export default router;
