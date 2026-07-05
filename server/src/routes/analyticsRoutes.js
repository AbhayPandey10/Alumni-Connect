import express from 'express';
import { getAnalytics, getAnalyticsInsights } from '../controllers/analyticsController.js';
import { protect } from '../middleware/verifyJWT.js';

const router = express.Router();

router.get('/', protect, getAnalytics);
router.get('/insights', protect, getAnalyticsInsights);

export default router;
