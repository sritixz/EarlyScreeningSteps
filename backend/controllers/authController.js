import asyncHandler from '../utils/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import User from '../models/User.js';

/**
 * @desc    Register a new user (parent, reviewer, or admin-invited)
 * @route   POST /api/auth/signup
 * @access  Public
 *
 * NOTE: In production, admin signup should be gated behind an invite
 * flow rather than open registration. For now, any role can be requested
 * at signup; reviewer accounts land in "pending" status until approved.
 */
export const signup = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    jurisdiction,
    licenseNumber,
    specialty,
    consentAccepted,
  } = req.body;

  if (!name || !email || !password || !jurisdiction) {
    res.status(400);
    throw new Error('Name, email, password, and jurisdiction are required');
  }

  const allowedRoles = ['parent', 'reviewer', 'admin'];
  const resolvedRole = allowedRoles.includes(role) ? role : 'parent';

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  if (resolvedRole === 'reviewer' && !licenseNumber) {
    res.status(400);
    throw new Error('License number is required for reviewer applications');
  }

  const consent = {
    accepted: Boolean(consentAccepted),
    acceptedAt: consentAccepted ? new Date() : null,
    version: consentAccepted ? process.env.CONSENT_VERSION || '1.0' : null,
  };

  const userData = {
    name,
    email,
    password,
    role: resolvedRole,
    jurisdiction,
    consent,
  };

  if (resolvedRole === 'reviewer') {
    userData.licenseNumber = licenseNumber;
    userData.specialty = specialty || null;
    userData.applicationStatus = 'pending';
    userData.appliedAt = new Date();
    userData.isAvailable = false; // not assignable until approved
  }

  const user = await User.create(userData);

  const token = generateToken(user._id);

  res.status(201).json({
    token,
    user: user.toSafeObject(),
  });
});

/**
 * @desc    Log in an existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Account is deactivated. Contact support.');
  }

  const token = generateToken(user._id);

  res.json({
    token,
    user: user.toSafeObject(),
  });
});

/**
 * @desc    Get the authenticated user's profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

/**
 * @desc    Update the authenticated user's own profile (limited fields)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, specialty, isAvailable, consentAccepted } = req.body;

  const user = req.user;

  if (name !== undefined) user.name = name;

  if (user.role === 'reviewer') {
    if (specialty !== undefined) user.specialty = specialty;
    // Reviewers may only toggle availability once approved
    if (isAvailable !== undefined && user.applicationStatus === 'approved') {
      user.isAvailable = Boolean(isAvailable);
    }
  }

  if (consentAccepted === true && !user.consent.accepted) {
    user.consent = {
      accepted: true,
      acceptedAt: new Date(),
      version: process.env.CONSENT_VERSION || '1.0',
    };
  }

  const updated = await user.save();

  res.json({ user: updated.toSafeObject() });
});
