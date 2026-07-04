import express from 'express';
import { upsertProfile, getMyProfile } from '../controllers/profileController.js';
import { protect } from '../middleware/verifyJWT.js';

const router = express.Router();

router.post('/', protect, upsertProfile);
router.get('/me', protect, getMyProfile);

export default router;