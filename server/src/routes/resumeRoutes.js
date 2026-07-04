import express from 'express';
import { analyzeResume, generateMessage } from '../controllers/resumeController.js';
import { protect } from '../middleware/verifyJWT.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/analyze', protect, upload.single('resume'), analyzeResume);
router.post('/generate-message', protect, generateMessage);

export default router;