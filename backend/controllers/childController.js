import asyncHandler from '../utils/asyncHandler.js';
import Child from '../models/Child.js';
import Screening from '../models/Screening.js';

/**
 * @desc    Create a child profile for the authenticated parent
 * @route   POST /api/children
 * @access  Private (parent)
 */
export const createChild = asyncHandler(async (req, res) => {
  const { name, dateOfBirth } = req.body;

  if (!name || !dateOfBirth) {
    res.status(400);
    throw new Error('Name and date of birth are required');
  }

  const child = await Child.create({
    parentId: req.user._id,
    name,
    dateOfBirth,
  });

  res.status(201).json({ child });
});

/**
 * @desc    List all children belonging to the authenticated parent
 * @route   GET /api/children
 * @access  Private (parent)
 */
export const getMyChildren = asyncHandler(async (req, res) => {
  const children = await Child.find({ parentId: req.user._id }).sort({ createdAt: -1 });
  res.json({ children });
});

/**
 * @desc    Get a single child, scoped to the owning parent
 * @route   GET /api/children/:id
 * @access  Private (parent)
 */
export const getChildById = asyncHandler(async (req, res) => {
  const child = await Child.findOne({ _id: req.params.id, parentId: req.user._id });

  if (!child) {
    res.status(404);
    throw new Error('Child not found');
  }

  res.json({ child });
});

/**
 * @desc    Update a child's details
 * @route   PUT /api/children/:id
 * @access  Private (parent)
 */
export const updateChild = asyncHandler(async (req, res) => {
  const child = await Child.findOne({ _id: req.params.id, parentId: req.user._id });

  if (!child) {
    res.status(404);
    throw new Error('Child not found');
  }

  const { name, dateOfBirth } = req.body;

  if (name !== undefined) child.name = name;
  if (dateOfBirth !== undefined) child.dateOfBirth = dateOfBirth;

  const updated = await child.save();

  res.json({ child: updated });
});

/**
 * @desc    Delete a child profile
 * @route   DELETE /api/children/:id
 * @access  Private (parent)
 *
 * Blocked if the child has any associated screenings, to preserve
 * clinical/audit history.
 */
export const deleteChild = asyncHandler(async (req, res) => {
  const child = await Child.findOne({ _id: req.params.id, parentId: req.user._id });

  if (!child) {
    res.status(404);
    throw new Error('Child not found');
  }

  const hasScreenings = await Screening.exists({ childId: child._id });
  if (hasScreenings) {
    res.status(400);
    throw new Error('Cannot delete a child with existing screening history');
  }

  await child.deleteOne();

  res.json({ message: 'Child deleted successfully' });
});
