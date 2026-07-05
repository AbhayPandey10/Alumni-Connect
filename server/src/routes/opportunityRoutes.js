import express from 'express';
import { createOpportunity, getOpportunities, getRecommendedOpportunities, getMyOpportunities, updateOpportunity, setOpportunityActive, deleteMyOpportunity, requestReferral } from '../controllers/opportunityController.js';
import { protect } from '../middleware/verifyJWT.js';

const router = express.Router();

router.post('/', protect, createOpportunity);
router.get('/', protect, getOpportunities);
router.get('/recommended', protect, getRecommendedOpportunities);
router.get('/mine', protect, getMyOpportunities);
router.put('/:id', protect, updateOpportunity);
router.patch('/:id/active', protect, setOpportunityActive);
router.delete('/:id', protect, deleteMyOpportunity);
router.post('/:id/request', protect, requestReferral);

export default router;