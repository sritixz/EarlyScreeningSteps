import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

/**
 * Verifies the JWT from the Authorization header and attaches the
 * authenticated user (minus password) to req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized: no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized: invalid or expired token');
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    res.status(401);
    throw new Error('Not authorized: user no longer exists');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Account is deactivated. Contact support.');
  }

  req.user = user;
  next();
});

/**
 * Restricts access to the given roles. Must be used after `protect`.
 * Usage: requireRole('admin'), requireRole('reviewer', 'admin')
 */
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized: no authenticated user');
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Forbidden: requires role(s): ${roles.join(', ')}`);
    }

    next();
  };
