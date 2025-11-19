import express from 'express';
import {
  getCurrentProfile,
  updateProfile,
  uploadAvatar,
  deleteAccount,
} from '../controllers/accountController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', requireAuth, getCurrentProfile);
router.put('/me', requireAuth, updateProfile);
router.post('/me/avatar', requireAuth, uploadAvatar);
router.delete('/me', requireAuth, deleteAccount);

export default router;
