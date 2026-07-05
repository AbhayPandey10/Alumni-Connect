import express from 'express';
import { getLeaderboard } from '../controllers/leaderboardController.js';
import { protect } from '../middleware/verifyJWT.js';

const router = express.Router();

router.get('/', protect, getLeaderboard);

export default router;