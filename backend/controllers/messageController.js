import asyncHandler from '../utils/asyncHandler.js';
import Screening from '../models/Screening.js';
import Message from '../models/Message.js';

/**
 * Confirms the requesting user is a participant (parent, assigned reviewer,
 * or admin) on the given screening, and returns the screening doc.
 */
const authorizeParticipant = async (req) => {
  const screening = await Screening.findById(req.params.screeningId);
  if (!screening) return null;

  const { role, _id } = req.user;
  const isParent = role === 'parent' && String(screening.parentId) === String(_id);
  const isReviewer =
    role === 'reviewer' && String(screening.assignedReviewerId) === String(_id);
  const isAdmin = role === 'admin';

  if (!isParent && !isReviewer && !isAdmin) return 'forbidden';

  return screening;
};

/**
 * @desc    Get all messages in a screening's thread, oldest first
 *          (client polls this endpoint for updates)
 * @route   GET /api/messages/:screeningId
 * @access  Private (participants only)
 */
export const getMessages = asyncHandler(async (req, res) => {
  const screening = await authorizeParticipant(req);

  if (!screening) {
    res.status(404);
    throw new Error('Screening not found');
  }
  if (screening === 'forbidden') {
    res.status(403);
    throw new Error('You do not have access to this conversation');
  }

  const { since } = req.query;
  const filter = { screeningId: req.params.screeningId };
  if (since) {
    filter.createdAt = { $gt: new Date(since) };
  }

  const messages = await Message.find(filter)
    .populate('senderId', 'name role')
    .sort({ createdAt: 1 });

  res.json({ messages });
});

/**
 * @desc    Post a new message to a screening's thread
 * @route   POST /api/messages/:screeningId
 * @access  Private (participants only)
 */
export const createMessage = asyncHandler(async (req, res) => {
  const screening = await authorizeParticipant(req);

  if (!screening) {
    res.status(404);
    throw new Error('Screening not found');
  }
  if (screening === 'forbidden') {
    res.status(403);
    throw new Error('You do not have access to this conversation');
  }

  const { body } = req.body;
  if (!body || !body.trim()) {
    res.status(400);
    throw new Error('Message body cannot be empty');
  }

  const message = await Message.create({
    screeningId: screening._id,
    senderId: req.user._id,
    senderRole: req.user.role,
    body: body.trim(),
  });

  res.status(201).json({ message });
});

/**
 * @desc    Mark messages in a thread as read by the requesting user
 *          (marks all not sent by the requester and not yet read)
 * @route   PATCH /api/messages/:screeningId/read
 * @access  Private (participants only)
 */
export const markMessagesRead = asyncHandler(async (req, res) => {
  const screening = await authorizeParticipant(req);

  if (!screening) {
    res.status(404);
    throw new Error('Screening not found');
  }
  if (screening === 'forbidden') {
    res.status(403);
    throw new Error('You do not have access to this conversation');
  }

  const result = await Message.updateMany(
    {
      screeningId: screening._id,
      senderId: { $ne: req.user._id },
      readAt: null,
    },
    { $set: { readAt: new Date() } }
  );

  res.json({ updatedCount: result.modifiedCount });
});
