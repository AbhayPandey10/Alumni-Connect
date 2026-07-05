import express from 'express';
import {
  sendConnectionRequest, respondToRequest, getMyConnections,
  getPendingRequests, getConnectionStatus, removeConnection,
} from '../controllers/connectionController.js';
import { protect } from '../middleware/verifyJWT.js';

const router = express.Router();

router.get('/', protect, getMyConnections);
router.get('/pending', protect, getPendingRequests);
router.get('/status/:userId', protect, getConnectionStatus);
router.post('/request', protect, sendConnectionRequest);
router.put('/:id/respond', protect, respondToRequest);
router.delete('/:id', protect, removeConnection);

export default router;
