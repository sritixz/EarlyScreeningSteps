import asyncHandler from '../utils/asyncHandler.js';
import Screening from '../models/Screening.js';

/**
 * @desc    Reviewer submits structured findings for an assigned screening.
 *          Reviews are immutable once submitted — this endpoint can only
 *          be called once per screening (status moves to "completed").
 * @route   POST /api/reviews/:screeningId
 * @access  Private (assigned reviewer)
 */
export const submitReview = asyncHandler(async (req, res) => {
  const { riskLevel, observations, recommendedNextSteps, notes } = req.body;

  if (!riskLevel || !['low', 'medium', 'high'].includes(riskLevel)) {
    res.status(400);
    throw new Error('A valid riskLevel (low, medium, high) is required');
  }

  const screening = await Screening.findById(req.params.screeningId);

  if (!screening) {
    res.status(404);
    throw new Error('Screening not found');
  }

  if (String(screening.assignedReviewerId) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You are not assigned to this screening');
  }

  if (screening.status === 'completed') {
    res.status(400);
    throw new Error('This screening already has a completed, immutable review');
  }

  screening.review = {
    riskLevel,
    observations: Array.isArray(observations) ? observations : [],
    recommendedNextSteps: recommendedNextSteps || null,
    notes: notes || null,
    reviewedBy: req.user._id,
    completedAt: new Date(),
  };
  screening.status = 'completed';

  await screening.save();

  res.status(201).json({ screening });
});

/**
 * @desc    Reviewer (or admin) flags a screening as urgent, e.g. before
 *          or during review, so admins get an in-app notification.
 * @route   POST /api/reviews/:screeningId/flag-urgent
 * @access  Private (assigned reviewer, admin)
 */
export const flagUrgent = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    res.status(400);
    throw new Error('A reason is required to flag a screening as urgent');
  }

  const screening = await Screening.findById(req.params.screeningId);

  if (!screening) {
    res.status(404);
    throw new Error('Screening not found');
  }

  const isAssignedReviewer =
    req.user.role === 'reviewer' &&
    String(screening.assignedReviewerId) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isAssignedReviewer && !isAdmin) {
    res.status(403);
    throw new Error('You are not authorized to flag this screening');
  }

  screening.isUrgent = true;
  screening.urgentFlaggedBy = req.user._id;
  screening.urgentFlaggedAt = new Date();
  screening.urgentReason = reason;
  // A new flag supersedes any prior acknowledgment
  screening.urgentAcknowledgedBy = null;
  screening.urgentAcknowledgedAt = null;

  await screening.save();

  res.json({ screening });
});

/**
 * @desc    Get the review for a given screening (read-only view)
 * @route   GET /api/reviews/:screeningId
 * @access  Private (parent owner, assigned reviewer, admin)
 */
export const getReview = asyncHandler(async (req, res) => {
  const screening = await Screening.findById(req.params.screeningId).populate(
    'review.reviewedBy',
    'name email specialty'
  );

  if (!screening) {
    res.status(404);
    throw new Error('Screening not found');
  }

  const { role, _id } = req.user;
  const isOwner = role === 'parent' && String(screening.parentId) === String(_id);
  const isAssignedReviewer =
    role === 'reviewer' && String(screening.assignedReviewerId) === String(_id);
  const isAdmin = role === 'admin';

  if (!isOwner && !isAssignedReviewer && !isAdmin) {
    res.status(403);
    throw new Error('You do not have access to this review');
  }

  if (screening.status !== 'completed') {
    res.status(404);
    throw new Error('A review has not yet been completed for this screening');
  }

  res.json({ review: screening.review });
});
