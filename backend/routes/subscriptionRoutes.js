import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getSubscription,
  startSubscription,
  updateAutoRenew,
} from '../controllers/subscriptionController.js';

const router = express.Router();

router.get('/me', requireAuth, getSubscription);
router.post('/start', requireAuth, startSubscription);
router.patch('/auto-renew', requireAuth, updateAutoRenew);

export default router;
