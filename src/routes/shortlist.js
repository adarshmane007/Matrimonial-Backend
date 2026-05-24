import { Router } from 'express';
import { param } from 'express-validator';
import { queryAll, queryOne } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate, profileIdParam } from '../utils/validators.js';
import { toPublicProfile } from '../utils/profileMapper.js';

const router = Router();

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const lang = req.query.lang === 'mr' ? 'mr' : 'en';
    const rows = await queryAll(
      `SELECT p.* FROM shortlisted_profiles s
       JOIN profiles p ON p.id = s.profile_id
       WHERE s.user_id = $1 AND p.visibility != 'hidden'
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    res.json({
      success: true,
      data: rows.map((r) => toPublicProfile(r, lang)),
    });
  })
);

router.get(
  '/ids',
  authenticate,
  asyncHandler(async (req, res) => {
    const rows = await queryAll(
      `SELECT profile_id FROM shortlisted_profiles WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({
      success: true,
      data: rows.map((r) => r.profile_id),
    });
  })
);

router.post(
  '/:profileId',
  authenticate,
  profileIdParam,
  validate,
  asyncHandler(async (req, res) => {
    const profileId = Number(req.params.profileId);
    const target = await queryOne('SELECT id, user_id FROM profiles WHERE id = $1', [profileId]);
    if (!target || target.user_id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Invalid profile' });
    }
    await queryOne(
      `INSERT INTO shortlisted_profiles (user_id, profile_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, profile_id) DO NOTHING`,
      [req.user.id, profileId]
    );
    res.json({ success: true, message: 'Added to shortlist' });
  })
);

router.delete(
  '/:profileId',
  authenticate,
  profileIdParam,
  validate,
  asyncHandler(async (req, res) => {
    await queryOne(
      `DELETE FROM shortlisted_profiles WHERE user_id = $1 AND profile_id = $2`,
      [req.user.id, Number(req.params.profileId)]
    );
    res.json({ success: true, message: 'Removed from shortlist' });
  })
);

export default router;
