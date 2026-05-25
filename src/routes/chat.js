import { Router } from 'express';
import { query, queryOne, queryAll, withTransaction } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { body, param } from 'express-validator';
import { validate } from '../utils/validators.js';

const router = Router();
router.use(authenticate);

function orderedPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

async function getOrCreateConversation(userA, userB) {
  const [one, two] = orderedPair(userA, userB);
  let conv = await queryOne(
    'SELECT * FROM chat_conversations WHERE user_one_id = $1 AND user_two_id = $2',
    [one, two]
  );
  if (!conv) {
    conv = await queryOne(
      `INSERT INTO chat_conversations (user_one_id, user_two_id)
       VALUES ($1, $2) RETURNING *`,
      [one, two]
    );
  }
  return conv;
}

router.post(
  '/requests',
  [body('toProfileId').isInt({ min: 1 }), body('message').optional().trim().isLength({ max: 500 })],
  validate,
  asyncHandler(async (req, res) => {
    const target = await queryOne('SELECT * FROM profiles WHERE id = $1', [req.body.toProfileId]);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    if (target.user_id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot send request to yourself' });
    }

    const existing = await queryOne(
      `SELECT * FROM chat_requests
       WHERE (from_user_id = $1 AND to_user_id = $2)
          OR (from_user_id = $2 AND to_user_id = $1)`,
      [req.user.id, target.user_id]
    );

    if (existing) {
      if (existing.status === 'accepted') {
        const conv = await getOrCreateConversation(req.user.id, target.user_id);
        return res.json({
          success: true,
          message: 'You are already connected',
          data: { requestId: existing.id, status: 'accepted', conversationId: conv.id },
        });
      }
      return res.status(409).json({
        success: false,
        message:
          existing.status === 'pending'
            ? 'Chat request already pending'
            : 'Chat request was declined earlier',
        data: { requestId: existing.id, status: existing.status },
      });
    }

    const row = await queryOne(
      `INSERT INTO chat_requests (from_user_id, to_user_id, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, target.user_id, req.body.message || null]
    );

    res.status(201).json({
      success: true,
      message: 'Chat request sent',
      data: { requestId: row.id, status: 'pending' },
    });
  })
);

router.get(
  '/unread-summary',
  asyncHandler(async (req, res) => {
    const pendingRow = await queryOne(
      `SELECT COUNT(*)::int AS c FROM chat_requests
       WHERE to_user_id = $1 AND status = 'pending'`,
      [req.user.id]
    );

    const unreadRow = await queryOne(
      `SELECT COUNT(*)::int AS c
       FROM chat_messages m
       JOIN chat_conversations c ON c.id = m.conversation_id
       WHERE (c.user_one_id = $1 OR c.user_two_id = $1)
         AND m.sender_id != $1
         AND m.read_at IS NULL`,
      [req.user.id]
    );

    const pendingRequests = pendingRow?.c ?? 0;
    const unreadMessages = unreadRow?.c ?? 0;

    res.json({
      success: true,
      data: {
        pendingRequests,
        unreadMessages,
        total: pendingRequests + unreadMessages,
      },
    });
  })
);

router.get(
  '/requests/incoming',
  asyncHandler(async (req, res) => {
    const rows = await queryAll(
      `SELECT cr.*, u.full_name, p.id AS profile_id, p.display_name, p.photo_url, p.age, p.district
       FROM chat_requests cr
       JOIN users u ON u.id = cr.from_user_id
       LEFT JOIN profiles p ON p.user_id = cr.from_user_id
       WHERE cr.to_user_id = $1 AND cr.status = 'pending'
       ORDER BY cr.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: rows.map((r) => ({
        requestId: r.id,
        message: r.message,
        createdAt: r.created_at,
        fromUser: { id: r.from_user_id, fullName: r.full_name },
        profile: r.profile_id
          ? {
              id: r.profile_id,
              displayName: r.display_name,
              photoUrl: r.photo_url,
              age: r.age,
              district: r.district,
            }
          : null,
      })),
    });
  })
);

router.get(
  '/requests/outgoing',
  asyncHandler(async (req, res) => {
    const rows = await queryAll(
      `SELECT cr.*, p.id AS profile_id, p.display_name, p.photo_url
       FROM chat_requests cr
       JOIN profiles p ON p.user_id = cr.to_user_id
       WHERE cr.from_user_id = $1
       ORDER BY cr.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: rows.map((r) => ({
        requestId: r.id,
        status: r.status,
        message: r.message,
        createdAt: r.created_at,
        profile: {
          id: r.profile_id,
          displayName: r.display_name,
          photoUrl: r.photo_url,
        },
      })),
    });
  })
);

router.patch(
  '/requests/:id/respond',
  [param('id').isInt({ min: 1 }), body('action').isIn(['accept', 'decline'])],
  validate,
  asyncHandler(async (req, res) => {
    const request = await queryOne('SELECT * FROM chat_requests WHERE id = $1', [req.params.id]);

    if (!request || request.to_user_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already responded' });
    }

    const status = req.body.action === 'accept' ? 'accepted' : 'declined';
    await query(`UPDATE chat_requests SET status = $1, updated_at = NOW() WHERE id = $2`, [
      status,
      request.id,
    ]);

    let conversationId = null;
    if (status === 'accepted') {
      const conv = await getOrCreateConversation(request.from_user_id, request.to_user_id);
      conversationId = conv.id;
    }

    res.json({
      success: true,
      message: status === 'accepted' ? 'Chat request accepted' : 'Chat request declined',
      data: { requestId: request.id, status, conversationId },
    });
  })
);

router.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    const rows = await queryAll(
      `SELECT c.*,
              CASE WHEN c.user_one_id = $1 THEN u2.full_name ELSE u1.full_name END AS other_name,
              CASE WHEN c.user_one_id = $1 THEN c.user_two_id ELSE c.user_one_id END AS other_user_id,
              p.id AS other_profile_id, p.display_name, p.photo_url,
              (SELECT body FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
              (SELECT created_at FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_at,
              (SELECT COUNT(*)::int FROM chat_messages m
               WHERE m.conversation_id = c.id AND m.sender_id != $1 AND m.read_at IS NULL) AS unread_count
       FROM chat_conversations c
       JOIN users u1 ON u1.id = c.user_one_id
       JOIN users u2 ON u2.id = c.user_two_id
       LEFT JOIN profiles p ON p.user_id = CASE WHEN c.user_one_id = $1 THEN c.user_two_id ELSE c.user_one_id END
       WHERE c.user_one_id = $1 OR c.user_two_id = $1
       ORDER BY last_at DESC NULLS LAST, c.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: rows.map((r) => ({
        conversationId: r.id,
        otherUserId: r.other_user_id,
        otherName: r.other_name,
        profile: r.other_profile_id
          ? { id: r.other_profile_id, displayName: r.display_name, photoUrl: r.photo_url }
          : null,
        lastMessage: r.last_message,
        lastAt: r.last_at,
        unreadCount: r.unread_count ?? 0,
      })),
    });
  })
);

router.get(
  '/conversations/:id/messages',
  [param('id').isInt({ min: 1 })],
  validate,
  asyncHandler(async (req, res) => {
    const conv = await queryOne('SELECT * FROM chat_conversations WHERE id = $1', [req.params.id]);
    if (!conv || (conv.user_one_id !== req.user.id && conv.user_two_id !== req.user.id)) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const messages = await queryAll(
      `SELECT m.*, u.full_name AS sender_name
       FROM chat_messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [req.params.id]
    );

    await query(
      `UPDATE chat_messages SET read_at = NOW()
       WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL`,
      [req.params.id, req.user.id]
    );

    res.json({
      success: true,
      data: messages.map((m) => ({
        id: m.id,
        body: m.body,
        senderId: m.sender_id,
        senderName: m.sender_name,
        isMine: m.sender_id === req.user.id,
        createdAt: m.created_at,
      })),
    });
  })
);

router.post(
  '/conversations/:id/disconnect',
  [param('id').isInt({ min: 1 })],
  validate,
  asyncHandler(async (req, res) => {
    const conv = await queryOne('SELECT * FROM chat_conversations WHERE id = $1', [req.params.id]);
    if (!conv || (conv.user_one_id !== req.user.id && conv.user_two_id !== req.user.id)) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const otherUserId =
      conv.user_one_id === req.user.id ? conv.user_two_id : conv.user_one_id;

    await withTransaction(async (client) => {
      await client.query('DELETE FROM chat_messages WHERE conversation_id = $1', [conv.id]);
      await client.query('DELETE FROM chat_conversations WHERE id = $1', [conv.id]);
      await client.query(
        `DELETE FROM chat_requests
         WHERE (from_user_id = $1 AND to_user_id = $2)
            OR (from_user_id = $2 AND to_user_id = $1)`,
        [req.user.id, otherUserId]
      );
    });

    res.json({
      success: true,
      message: 'Connection removed. You can send a new chat request from their profile.',
      data: { disconnected: true },
    });
  })
);

router.post(
  '/conversations/:id/messages',
  [
    param('id').isInt({ min: 1 }),
    body('body').trim().notEmpty().isLength({ max: 2000 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const conv = await queryOne('SELECT * FROM chat_conversations WHERE id = $1', [req.params.id]);
    if (!conv || (conv.user_one_id !== req.user.id && conv.user_two_id !== req.user.id)) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const row = await queryOne(
      `INSERT INTO chat_messages (conversation_id, sender_id, body)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, req.user.id, req.body.body.trim()]
    );

    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        body: row.body,
        senderId: row.sender_id,
        isMine: true,
        createdAt: row.created_at,
      },
    });
  })
);

export default router;
