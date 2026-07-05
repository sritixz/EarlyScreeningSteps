import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Screening from '../models/Screening.js';

/**
 * @desc    List reviewer applications, optionally filtered by status
 * @route   GET /api/admin/reviewer-applications?status=pending
 * @access  Private (admin)
 */
export const getReviewerApplications = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { role: 'reviewer' };
  if (status) filter.applicationStatus = status;

  const applications = await User.find(filter).sort({ appliedAt: -1 });

  res.json({ applications });
});

/**
 * @desc    Approve a reviewer application
 * @route   PATCH /api/admin/reviewer-applications/:id/approve
 * @access  Private (admin)
 */
export const approveReviewer = asyncHandler(async (req, res) => {
  const reviewer = await User.findOne({ _id: req.params.id, role: 'reviewer' });

  if (!reviewer) {
    res.status(404);
    throw new Error('Reviewer application not found');
  }

  reviewer.applicationStatus = 'approved';
  reviewer.reviewedAt = new Date();
  reviewer.reviewedBy = req.user._id;
  reviewer.isAvailable = true;

  await reviewer.save();

  res.json({ reviewer: reviewer.toSafeObject() });
});

/**
 * @desc    Reject a reviewer application
 * @route   PATCH /api/admin/reviewer-applications/:id/reject
 * @access  Private (admin)
 */
export const rejectReviewer = asyncHandler(async (req, res) => {
  const reviewer = await User.findOne({ _id: req.params.id, role: 'reviewer' });

  if (!reviewer) {
    res.status(404);
    throw new Error('Reviewer application not found');
  }

  reviewer.applicationStatus = 'rejected';
  reviewer.reviewedAt = new Date();
  reviewer.reviewedBy = req.user._id;
  reviewer.isAvailable = false;

  await reviewer.save();

  res.json({ reviewer: reviewer.toSafeObject() });
});

/**
 * @desc    Deactivate a reviewer account (e.g. for misconduct or leave).
 *          Deactivated reviewers are excluded from auto-assignment and
 *          cannot log in.
 * @route   PATCH /api/admin/reviewers/:id/deactivate
 * @access  Private (admin)
 */
export const deactivateReviewer = asyncHandler(async (req, res) => {
  const reviewer = await User.findOne({ _id: req.params.id, role: 'reviewer' });

  if (!reviewer) {
    res.status(404);
    throw new Error('Reviewer not found');
  }

  reviewer.isActive = false;
  reviewer.isAvailable = false;

  await reviewer.save();

  res.json({ reviewer: reviewer.toSafeObject() });
});

/**
 * @desc    Reassign a screening to a different reviewer, overriding
 *          auto-assignment.
 * @route   PATCH /api/admin/screenings/:id/reassign
 * @access  Private (admin)
 */
export const reassignScreening = asyncHandler(async (req, res) => {
  const { reviewerId } = req.body;

  if (!reviewerId) {
    res.status(400);
    throw new Error('reviewerId is required');
  }

  const screening = await Screening.findById(req.params.id);
  if (!screening) {
    res.status(404);
    throw new Error('Screening not found');
  }

  if (screening.status === 'completed') {
    res.status(400);
    throw new Error('Cannot reassign a completed screening');
  }

  const reviewer = await User.findOne({
    _id: reviewerId,
    role: 'reviewer',
    applicationStatus: 'approved',
    isActive: true,
  });

  if (!reviewer) {
    res.status(404);
    throw new Error('Target reviewer not found or not approved/active');
  }

  screening.assignedReviewerId = reviewer._id;
  if (screening.status === 'submitted') {
    screening.status = 'assigned';
  }

  await screening.save();

  res.json({ screening });
});

/**
 * @desc    Dashboard of all urgent screenings, prioritizing unacknowledged
 * @route   GET /api/admin/urgent
 * @access  Private (admin)
 */
export const getUrgentDashboard = asyncHandler(async (req, res) => {
  const urgentScreenings = await Screening.find({ isUrgent: true })
    .populate('childId', 'name dateOfBirth')
    .populate('parentId', 'name email')
    .populate('assignedReviewerId', 'name email specialty')
    .populate('urgentFlaggedBy', 'name role')
    .sort({ urgentAcknowledgedAt: 1, urgentFlaggedAt: -1 });

  res.json({ urgentScreenings });
});

/**
 * @desc    Admin acknowledges an urgent flag
 * @route   PATCH /api/admin/urgent/:id/acknowledge
 * @access  Private (admin)
 */
export const acknowledgeUrgent = asyncHandler(async (req, res) => {
  const screening = await Screening.findById(req.params.id);

  if (!screening) {
    res.status(404);
    throw new Error('Screening not found');
  }

  if (!screening.isUrgent) {
    res.status(400);
    throw new Error('This screening is not flagged as urgent');
  }

  screening.urgentAcknowledgedBy = req.user._id;
  screening.urgentAcknowledgedAt = new Date();

  await screening.save();

  res.json({ screening });
});

/**
 * @desc    Platform-wide stats for the admin dashboard
 * @route   GET /api/admin/stats
 * @access  Private (admin)
 */
export const getPlatformStats = asyncHandler(async (req, res) => {
  const [
    totalParents,
    totalReviewers,
    pendingReviewerApplications,
    approvedReviewers,
    totalScreenings,
    screeningsByStatus,
    urgentOpenCount,
    completedThisMonth,
  ] = await Promise.all([
    User.countDocuments({ role: 'parent' }),
    User.countDocuments({ role: 'reviewer' }),
    User.countDocuments({ role: 'reviewer', applicationStatus: 'pending' }),
    User.countDocuments({ role: 'reviewer', applicationStatus: 'approved' }),
    Screening.countDocuments({}),
    Screening.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Screening.countDocuments({ isUrgent: true, status: { $ne: 'completed' } }),
    Screening.countDocuments({
      status: 'completed',
      'review.completedAt': {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    }),
  ]);

  const statusBreakdown = screeningsByStatus.reduce((acc, s) => {
    acc[s._id] = s.count;
    return acc;
  }, {});

  res.json({
    stats: {
      totalParents,
      totalReviewers,
      pendingReviewerApplications,
      approvedReviewers,
      totalScreenings,
      statusBreakdown,
      urgentOpenCount,
      completedThisMonth,
    },
  });
});
