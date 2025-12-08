import express from 'express';
import {
  createBook,
  updateBook,
  deleteBook,
  uploadCover,
  uploadBookFile,
} from '../controllers/bookController.js';
import {
  adminDeleteComment,
  adminListComments,
  adminUpdateComment,
} from '../controllers/commentController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth, requireAdmin);

// Book management
router.post('/books', createBook);
router.put('/books/:id', updateBook);
router.delete('/books/:id', deleteBook);
router.post('/upload/cover', uploadCover);
router.post('/upload/book', uploadBookFile);

// Comment and rating moderation
router.get('/comments', adminListComments);
router.put('/comments/:id', adminUpdateComment);
router.delete('/comments/:id', adminDeleteComment);

export default router;
