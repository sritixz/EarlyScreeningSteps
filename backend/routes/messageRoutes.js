import express from 'express';
import {
  getMessages,
  createMessage,
  markMessagesRead,
} from '../controllers/messageController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, requireRole('parent', 'reviewer', 'admin'));

router.route('/:screeningId').get(getMessages).post(createMessage);

router.patch('/:screeningId/read', markMessagesRead);

export default router;
