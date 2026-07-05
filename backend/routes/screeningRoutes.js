import express from 'express';
import {
  createScreening,
  getScreenings,
  getScreeningById,
  getChildScreeningHistory,
  startReview,
} from '../controllers/screeningController.js';
import { protect, requireRole } from '../middleware/auth.js';
import { handleVideoUpload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(requireRole('parent'), handleVideoUpload, createScreening)
  .get(requireRole('parent', 'reviewer', 'admin'), getScreenings);

router.get(
  '/child/:childId/history',
  requireRole('parent', 'reviewer', 'admin'),
  getChildScreeningHistory
);

router.get('/:id', requireRole('parent', 'reviewer', 'admin'), getScreeningById);

router.patch('/:id/start', requireRole('reviewer'), startReview);

export default router;
