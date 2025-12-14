import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  addReadBook,
  listReadBooks,
} from '../controllers/readBookController.js';

const router = express.Router();

router.get('/', requireAuth, listReadBooks);
router.post('/', requireAuth, addReadBook);

export default router;
