import express from 'express';
import { getUserNotifications, markAsRead, markTypeAsRead, deleteNotification } from '../controllers/notificationController.js';
import {protect} from '../middleware/verifyJWT.js';

const router = express.Router();

router.get('/', protect, getUserNotifications);
router.put('/read-type', protect, markTypeAsRead);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);

export default router;