import express from 'express';
import { getRecommendations } from '../controllers/recommendationController.js';

const router = express.Router();

// Route: GET /api/recommendations/:userId
router.get('/:userId', getRecommendations);

export default router;