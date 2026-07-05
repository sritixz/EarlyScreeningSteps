import express from 'express';
import {
  getReviewerApplications,
  approveReviewer,
  rejectReviewer,
  deactivateReviewer,
  reassignScreening,
  getUrgentDashboard,
  acknowledgeUrgent,
  getPlatformStats,
} from '../controllers/adminController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, requireRole('admin'));

router.get('/reviewer-applications', getReviewerApplications);
router.patch('/reviewer-applications/:id/approve', approveReviewer);
router.patch('/reviewer-applications/:id/reject', rejectReviewer);

router.patch('/reviewers/:id/deactivate', deactivateReviewer);

router.patch('/screenings/:id/reassign', reassignScreening);

router.get('/urgent', getUrgentDashboard);
router.patch('/urgent/:id/acknowledge', acknowledgeUrgent);

router.get('/stats', getPlatformStats);

export default router;
