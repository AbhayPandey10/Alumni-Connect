import express from 'express';
import { requestReferral, updateReferralStatus } from '../controllers/referralController.js';
import { protect } from '../middleware/verifyJWT.js';

const router = express.Router();

router.post('/', protect, requestReferral);
router.patch('/:id/status', protect, updateReferralStatus);

export default router;