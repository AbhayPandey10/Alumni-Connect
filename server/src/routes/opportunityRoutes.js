import express from 'express';
import { createOpportunity, getOpportunities, updateOpportunity, requestReferral } from '../controllers/opportunityController.js';
import { protect } from '../middleware/verifyJWT.js';

const router = express.Router();

router.post('/', protect, createOpportunity);
router.get('/', protect, getOpportunities);
router.put('/:id', protect, updateOpportunity);
router.post('/:id/request', protect, requestReferral);

export default router;