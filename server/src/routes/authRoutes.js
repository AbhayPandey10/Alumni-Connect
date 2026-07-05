import express from 'express';
import { registerUser, loginUser, googleAuth, verifyOtp, resendOtp } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

export default router;