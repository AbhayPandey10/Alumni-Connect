import express from 'express';
import { generateRoadmap, getMyRoadmap } from '../controllers/careerGuidanceController.js';
import { protect } from '../middleware/verifyJWT.js';

const router = express.Router();

router.post('/roadmap', protect, generateRoadmap);
router.get('/roadmap/me', protect, getMyRoadmap);

export default router;