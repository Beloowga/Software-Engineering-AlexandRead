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

router.get('/stats/:bookId', getCommentStats);
router.get('/book/:bookId', getCommentsByBookId);
router.post('/', requireAuth, createComment);
router.put('/:commentId', requireAuth, updateComment);
router.delete('/:commentId', requireAuth, deleteComment);

export default router;
