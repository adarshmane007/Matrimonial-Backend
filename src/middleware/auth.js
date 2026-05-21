import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { queryOne } from '../db/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const USER_SELECT = `SELECT id, email, mobile, full_name, is_verified, created_at
  FROM users WHERE id = $1`;

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await queryOne(USER_SELECT, [payload.userId]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
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
    const user = await queryOne(USER_SELECT, [payload.userId]);
    if (user) req.user = user;
  } catch {
    /* ignore invalid token */
  }
  next();
});
