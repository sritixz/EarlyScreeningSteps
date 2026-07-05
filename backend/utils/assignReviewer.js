import User from '../models/User.js';
import Screening from '../models/Screening.js';

/**
 * Finds the best reviewer to auto-assign a new screening to:
 * approved + available + active reviewers, ranked by fewest open
 * (assigned or in_review) cases. Returns the reviewer's User doc, or
 * null if no eligible reviewer exists (screening stays unassigned/"submitted").
 */
const findBestReviewer = async () => {
  const eligibleReviewers = await User.find({
    role: 'reviewer',
    applicationStatus: 'approved',
    isAvailable: true,
    isActive: true,
  }).select('_id');

  if (eligibleReviewers.length === 0) return null;

  const reviewerIds = eligibleReviewers.map((r) => r._id);

  const openCaseCounts = await Screening.aggregate([
    {
      $match: {
        assignedReviewerId: { $in: reviewerIds },
        status: { $in: ['assigned', 'in_review'] },
      },
    },
    {
      $group: {
        _id: '$assignedReviewerId',
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = new Map(openCaseCounts.map((c) => [String(c._id), c.count]));

  let best = null;
  let bestCount = Infinity;

  for (const reviewer of eligibleReviewers) {
    const count = countMap.get(String(reviewer._id)) || 0;
    if (count < bestCount) {
      bestCount = count;
      best = reviewer;
    }
  }

  return best;
};

export default findBestReviewer;
