import asyncHandler from '../utils/asyncHandler.js';
import Screening from '../models/Screening.js';
import Child from '../models/Child.js';
import findBestReviewer from '../utils/assignReviewer.js';

const computeTotalScore = (answersObj = {}) => {
  return Object.values(answersObj).reduce((sum, val) => {
    const num = Number(val);
    return sum + (Number.isFinite(num) ? num : 0);
  }, 0);
};

/**
 * @desc    Parent submits a new screening (questionnaire + optional video)
 * @route   POST /api/screenings
 * @access  Private (parent)
 */
export const createScreening = asyncHandler(async (req, res) => {
  const { childId, questionnaireAnswers, intake } = req.body;

  if (!childId || !questionnaireAnswers) {
    res.status(400);
    throw new Error('childId and questionnaireAnswers are required');
  }

  const child = await Child.findOne({ _id: childId, parentId: req.user._id });
  if (!child) {
    res.status(404);
    throw new Error('Child not found');
  }

  let parsedAnswers = questionnaireAnswers;
  if (typeof parsedAnswers === 'string') {
    try {
      parsedAnswers = JSON.parse(parsedAnswers);
    } catch {
      res.status(400);
      throw new Error('questionnaireAnswers must be valid JSON');
    }
  }

  const totalScore = computeTotalScore(parsedAnswers);

  const screening = new Screening({
    childId: child._id,
    parentId: req.user._id,
    jurisdiction: req.user.jurisdiction,
    questionnaireAnswers: parsedAnswers,
    totalScore,
    intake: intake || '',
    status: 'submitted',
  });

  if (req.file) {
    screening.videoMetadata = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      uploadedAt: new Date(),
    };
  }

  // Auto-assign to the available reviewer with fewest open cases
  const reviewer = await findBestReviewer();
  if (reviewer) {
    screening.assignedReviewerId = reviewer._id;
    screening.status = 'assigned';
  }

  await screening.save();

  res.status(201).json({ screening });
});

/**
 * @desc    List screenings visible to the authenticated user
 *          - parent: their own screenings
 *          - reviewer: screenings assigned to them (their worklist)
 *          - admin: all screenings (with optional filters)
 * @route   GET /api/screenings
 * @access  Private
 */
export const getScreenings = asyncHandler(async (req, res) => {
  const { status, isUrgent, childId } = req.query;
  const filter = {};

  if (req.user.role === 'parent') {
    filter.parentId = req.user._id;
  } else if (req.user.role === 'reviewer') {
    filter.assignedReviewerId = req.user._id;
  }
  // admin: no base restriction

  if (status) filter.status = status;
  if (isUrgent !== undefined) filter.isUrgent = isUrgent === 'true';
  if (childId) filter.childId = childId;

  const screenings = await Screening.find(filter)
    .populate('childId', 'name dateOfBirth')
    .populate('parentId', 'name email')
    .populate('assignedReviewerId', 'name email specialty')
    .sort({ isUrgent: -1, createdAt: -1 });

  res.json({ screenings });
});

/**
 * Internal helper: fetches a screening and enforces access control
 * based on the requester's role.
 */
const getAuthorizedScreening = async (req) => {
  const screening = await Screening.findById(req.params.id)
    .populate('childId', 'name dateOfBirth parentId')
    .populate('parentId', 'name email')
    .populate('assignedReviewerId', 'name email specialty');

  if (!screening) return null;

  const { role, _id } = req.user;

  const isOwner = role === 'parent' && String(screening.parentId._id) === String(_id);
  const isAssignedReviewer =
    role === 'reviewer' && String(screening.assignedReviewerId?._id) === String(_id);
  const isAdmin = role === 'admin';

  if (!isOwner && !isAssignedReviewer && !isAdmin) return 'forbidden';

  return screening;
};

/**
 * @desc    Get a single screening by ID (access-scoped)
 * @route   GET /api/screenings/:id
 * @access  Private
 */
export const getScreeningById = asyncHandler(async (req, res) => {
  const result = await getAuthorizedScreening(req);

  if (!result) {
    res.status(404);
    throw new Error('Screening not found');
  }

  if (result === 'forbidden') {
    res.status(403);
    throw new Error('You do not have access to this screening');
  }

  res.json({ screening: result });
});

/**
 * @desc    Get the full screening history for a given child
 *          (used by reviewers to see prior context for a case)
 * @route   GET /api/screenings/child/:childId/history
 * @access  Private (reviewer assigned to at least one screening for this
 *          child, or admin, or the owning parent)
 */
export const getChildScreeningHistory = asyncHandler(async (req, res) => {
  const { childId } = req.params;

  const child = await Child.findById(childId);
  if (!child) {
    res.status(404);
    throw new Error('Child not found');
  }

  const { role, _id } = req.user;

  if (role === 'parent' && String(child.parentId) !== String(_id)) {
    res.status(403);
    throw new Error('You do not have access to this child');
  }

  if (role === 'reviewer') {
    const hasAssignment = await Screening.exists({
      childId: child._id,
      assignedReviewerId: _id,
    });
    if (!hasAssignment) {
      res.status(403);
      throw new Error('You are not assigned to any screening for this child');
    }
  }

  const screenings = await Screening.find({ childId: child._id })
    .populate('assignedReviewerId', 'name email specialty')
    .sort({ createdAt: -1 });

  res.json({ child, screenings });
});

/**
 * @desc    Reviewer marks a screening as "in_review" (started working on it)
 * @route   PATCH /api/screenings/:id/start
 * @access  Private (assigned reviewer)
 */
export const startReview = asyncHandler(async (req, res) => {
  const screening = await Screening.findById(req.params.id);

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
    throw new Error('This screening has already been completed');
  }

  screening.status = 'in_review';
  await screening.save();

  res.json({ screening });
});
