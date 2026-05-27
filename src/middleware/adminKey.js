import { config } from '../config.js';

export function requireAdminKey(req, res, next) {
  if (!config.adminApiKey) {
    return res.status(503).json({
      success: false,
      message: 'Admin API is not configured (set ADMIN_API_KEY on the server)',
    });
  }
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (key !== config.adminApiKey) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
}
