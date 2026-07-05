import express from 'express';
import { generateRoadmap, getMyRoadmap, generateInterviewPrep } from '../controllers/careerGuidanceController.js';
import { protect } from '../middleware/verifyJWT.js';

const router = express.Router();

router.post('/roadmap', protect, generateRoadmap);
router.get('/roadmap/me', protect, getMyRoadmap);
router.post('/interview-prep', protect, generateInterviewPrep);

export default router;