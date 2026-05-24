import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resolveUserOrDelete } from '../utils/accountDeletion.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret);
    const { user, deleted } = await resolveUserOrDelete(payload.userId);

    if (!user) {
      const message = deleted
        ? 'Your account has been permanently deleted.'
        : 'User not found';
      return res.status(401).json({ success: false, message });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret);
    const { user } = await resolveUserOrDelete(payload.userId);
    if (user) req.user = user;
  } catch {
    /* ignore invalid token */
  }
  next();
});
