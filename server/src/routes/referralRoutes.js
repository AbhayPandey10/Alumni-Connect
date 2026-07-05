import express from 'express';
import { requestReferral, getReceivedReferrals, getSentReferrals, updateReferralStatus } from '../controllers/referralController.js';
import { protect } from '../middleware/verifyJWT.js';

const router = express.Router();

router.post('/', protect, requestReferral);
router.get('/received', protect, getReceivedReferrals);
router.get('/sent', protect, getSentReferrals);
router.patch('/:id/status', protect, updateReferralStatus);

export default router;