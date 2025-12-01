import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  addSavedBook,
  listSavedBooks,
  removeSavedBook,
} from '../controllers/savedBookController.js';

const router = express.Router();

router.get('/', requireAuth, listSavedBooks);
router.post('/', requireAuth, addSavedBook);
router.delete('/:bookId', requireAuth, removeSavedBook);

export default router;
