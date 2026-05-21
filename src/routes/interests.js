import { Router } from 'express';
import { query, queryOne, queryAll } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { interestRules, validate } from '../utils/validators.js';
import { toPublicProfile } from '../utils/profileMapper.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  interestRules,
  validate,
  asyncHandler(async (req, res) => {
    const { profileId, message } = req.body;
    const target = await queryOne('SELECT * FROM profiles WHERE id = $1', [profileId]);

    if (!target) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    if (target.user_id === req.user.id) {
      return res
        .status(400)
        .json({ success: false, message: 'Cannot express interest in your own profile' });
    }

    const existing = await queryOne(
      'SELECT id, status FROM interests WHERE from_user_id = $1 AND to_profile_id = $2',
      [req.user.id, profileId]
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Interest already sent',
        data: { interestId: existing.id, status: existing.status },
      });
    }

    const result = await queryOne(
      `INSERT INTO interests (from_user_id, to_profile_id, message)
       VALUES ($1, $2, $3) RETURNING id`,
      [req.user.id, profileId, message || null]
    );

    res.status(201).json({
      success: true,
      message: 'Interest expressed successfully',
      data: { interestId: result.id, status: 'pending' },
    });
  })
);

router.get(
  '/sent',
  asyncHandler(async (req, res) => {
    const lang = req.query.lang === 'mr' ? 'mr' : 'en';
    const rows = await queryAll(
      `SELECT i.id AS interest_id, i.status, i.message, i.created_at,
              p.id, p.user_id, p.gender, p.display_name, p.age, p.district, p.city,
              p.education, p.education_level, p.occupation, p.height, p.kul, p.bio,
              p.photo_url, p.is_verified, p.is_online, p.is_featured, p.visibility,
              p.created_at AS profile_created_at
       FROM interests i
       JOIN profiles p ON p.id = i.to_profile_id
       WHERE i.from_user_id = $1
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: rows.map((row) => ({
        interestId: row.interest_id,
        status: row.status,
        message: row.message,
        createdAt: row.created_at,
        profile: toPublicProfile(
          {
            id: row.id,
            display_name: row.display_name,
            gender: row.gender,
            age: row.age,
            district: row.district,
            city: row.city,
            education: row.education,
            education_level: row.education_level,
            occupation: row.occupation,
            height: row.height,
            kul: row.kul,
            bio: row.bio,
            photo_url: row.photo_url,
            is_verified: row.is_verified,
            is_online: row.is_online,
            is_featured: row.is_featured,
            created_at: row.profile_created_at,
          },
          lang
        ),
      })),
    });
  })
);

router.get(
  '/received',
  asyncHandler(async (req, res) => {
    const myProfile = await queryOne('SELECT id FROM profiles WHERE user_id = $1', [
      req.user.id,
    ]);

    if (!myProfile) {
      return res.json({ success: true, data: [] });
    }

    const rows = await queryAll(
      `SELECT i.*, u.full_name, u.email, u.mobile
       FROM interests i
       JOIN users u ON u.id = i.from_user_id
       WHERE i.to_profile_id = $1
       ORDER BY i.created_at DESC`,
      [myProfile.id]
    );

    res.json({
      success: true,
      data: rows.map((row) => ({
        interestId: row.id,
        status: row.status,
        message: row.message,
        createdAt: row.created_at,
        fromUser: {
          id: row.from_user_id,
          fullName: row.full_name,
        },
      })),
    });
  })
);

router.patch(
  '/:id/respond',
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['accepted', 'declined'].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: 'Status must be accepted or declined' });
    }

    const myProfile = await queryOne('SELECT id FROM profiles WHERE user_id = $1', [
      req.user.id,
    ]);

    if (!myProfile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const interest = await queryOne('SELECT * FROM interests WHERE id = $1', [req.params.id]);
    if (!interest || interest.to_profile_id !== myProfile.id) {
      return res.status(404).json({ success: false, message: 'Interest not found' });
    }

    await query(`UPDATE interests SET status = $1, updated_at = NOW() WHERE id = $2`, [
      status,
      req.params.id,
    ]);

    res.json({
      success: true,
      message: `Interest ${status}`,
      data: { interestId: interest.id, status },
    });
  })
);

export default router;
