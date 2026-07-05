import express from 'express';
import {
  getOverview, getUsers, updateUserRole, deleteUser,
  getOpportunitiesAdmin, toggleOpportunityActive, deleteOpportunityAdmin,
} from '../controllers/adminController.js';
import { protect } from '../middleware/verifyJWT.js';
import { adminOnly } from '../middleware/adminOnly.js';

const router = express.Router();

// Every admin route requires a valid token AND the Admin role
router.use(protect, adminOnly);

router.get('/overview', getOverview);
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/opportunities', getOpportunitiesAdmin);
router.patch('/opportunities/:id/active', toggleOpportunityActive);
router.delete('/opportunities/:id', deleteOpportunityAdmin);

export default router;
