import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  listCurrentReading,
  listReadingHistory,
  getReadingStatus,
  startReading,
  finishReading,
} from '../controllers/readingController.js';

const router = express.Router();

router.get('/', requireAuth, listCurrentReading);
router.get('/history', requireAuth, listReadingHistory);
router.get('/:bookId', requireAuth, getReadingStatus);
router.post('/:bookId/start', requireAuth, startReading);
router.post('/:bookId/finish', requireAuth, finishReading);

export default router;
