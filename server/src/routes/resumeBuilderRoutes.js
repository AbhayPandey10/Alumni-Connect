import express from 'express';
import { saveDraft, getDraft, exportPdf } from '../controllers/resumeBuilderController.js';
import { protect } from '../middleware/verifyJWT.js';

const router = express.Router();

router.post('/draft', protect, saveDraft);
router.get('/draft', protect, getDraft);
router.post('/export', protect, exportPdf);

export default router;