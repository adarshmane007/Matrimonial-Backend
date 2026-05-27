import { Router } from 'express';
import { query, queryAll, queryOne } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdminKey } from '../middleware/adminKey.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

function messageBody(row, lang) {
  if (lang === 'mr' && row.body_mr?.trim()) return row.body_mr.trim();
  return row.body;
}

/** Admin: broadcast a message to all active users (creates per-user inbox rows). */
router.post(
  '/broadcast',
  requireAdminKey,
  asyncHandler(async (req, res) => {
    const body = String(req.body?.body || '').trim();
    const bodyMr = String(req.body?.bodyMr || req.body?.body_mr || '').trim() || null;
    if (!body) {
      return res.status(400).json({ success: false, message: 'Message body is required' });
    }

    const result = await query(
      `INSERT INTO user_admin_messages (user_id, body, body_mr)
       SELECT u.id, $1, $2
       FROM users u
       WHERE u.deletion_scheduled_at IS NULL`,
      [body, bodyMr]
    );

    res.json({
      success: true,
      message: 'Admin message sent to all users',
      data: { recipients: result.rowCount ?? 0 },
    });
  })
);

/** Admin: send to one user by user id or mobile/email. */
router.post(
  '/send',
  requireAdminKey,
  asyncHandler(async (req, res) => {
    const body = String(req.body?.body || '').trim();
    const bodyMr = String(req.body?.bodyMr || req.body?.body_mr || '').trim() || null;
    const userId = req.body?.userId ? Number(req.body.userId) : null;
    const identifier = String(req.body?.identifier || '').trim();

    if (!body) {
      return res.status(400).json({ success: false, message: 'Message body is required' });
    }

    let targetId = userId;
    if (!targetId && identifier) {
      const user = await queryOne(
        `SELECT id FROM users
         WHERE mobile = $1 OR email = $1 OR LOWER(email) = LOWER($1)
         LIMIT 1`,
        [identifier]
      );
      targetId = user?.id;
    }
    if (!targetId) {
      return res.status(400).json({ success: false, message: 'userId or identifier is required' });
    }

    const row = await queryOne(
      `INSERT INTO user_admin_messages (user_id, body, body_mr)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, body, body_mr, read_at, created_at`,
      [targetId, body, bodyMr]
    );

    res.status(201).json({ success: true, data: row });
  })
);

/** User: unread banner for home strip after login. */
router.get(
  '/messages/banner',
  authenticate,
  asyncHandler(async (req, res) => {
    const lang = req.query.lang === 'mr' ? 'mr' : 'en';
    const row = await queryOne(
      `SELECT id, body, body_mr, created_at
       FROM user_admin_messages
       WHERE user_id = $1 AND read_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (!row) {
      return res.json({ success: true, data: { show: false } });
    }

    res.json({
      success: true,
      data: {
        show: true,
        messageId: row.id,
        preview: messageBody(row, lang),
        createdAt: row.created_at,
      },
    });
  })
);

/** User: all admin messages (read-only inbox). */
router.get(
  '/messages',
  authenticate,
  asyncHandler(async (req, res) => {
    const lang = req.query.lang === 'mr' ? 'mr' : 'en';
    const rows = await queryAll(
      `SELECT id, body, body_mr, read_at, created_at
       FROM user_admin_messages
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [req.user.id]
    );

    const unreadCount = rows.filter((r) => !r.read_at).length;

    res.json({
      success: true,
      data: {
        messages: rows.map((r) => ({
          id: r.id,
          body: messageBody(r, lang),
          readAt: r.read_at,
          createdAt: r.created_at,
          isRead: Boolean(r.read_at),
        })),
        unreadCount,
      },
    });
  })
);

/** User: mark one or all admin messages as read. */
router.post(
  '/messages/read',
  authenticate,
  asyncHandler(async (req, res) => {
    const messageId = req.body?.messageId ? Number(req.body.messageId) : null;
    if (messageId) {
      await query(
        `UPDATE user_admin_messages SET read_at = NOW()
         WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
        [messageId, req.user.id]
      );
    } else {
      await query(
        `UPDATE user_admin_messages SET read_at = NOW()
         WHERE user_id = $1 AND read_at IS NULL`,
        [req.user.id]
      );
    }
    res.json({ success: true });
  })
);

export default router;
