import express from 'express';
import { submitReview, flagUrgent, getReview } from '../controllers/reviewController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/:screeningId', requireRole('reviewer'), submitReview);
router.post('/:screeningId/flag-urgent', requireRole('reviewer', 'admin'), flagUrgent);
router.get('/:screeningId', requireRole('parent', 'reviewer', 'admin'), getReview);

export default router;
