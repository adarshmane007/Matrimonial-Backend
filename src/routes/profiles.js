import { Router } from 'express';
import { query, queryOne, queryAll } from '../db/database.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import {
  profileRules,
  profileIdParam,
  searchRules,
  validate,
} from '../utils/validators.js';
import { toPublicProfile } from '../utils/profileMapper.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

function buildSearchQuery(filters) {
  const conditions = ["p.visibility != 'hidden'"];
  const params = [];
  let i = 1;

  if (filters.gender) {
    conditions.push(`p.gender = $${i++}`);
    params.push(filters.gender);
  }
  if (filters.ageFrom) {
    conditions.push(`p.age >= $${i++}`);
    params.push(filters.ageFrom);
  }
  if (filters.ageTo) {
    conditions.push(`p.age <= $${i++}`);
    params.push(filters.ageTo);
  }
  if (filters.district && filters.district !== 'all') {
    conditions.push(`p.district = $${i++}`);
    params.push(filters.district);
  }
  if (filters.education && filters.education !== 'any') {
    conditions.push(`p.education_level = $${i++}`);
    params.push(filters.education);
  }

  return { where: conditions.join(' AND '), params, nextIndex: i };
}

router.get(
  '/search',
  searchRules,
  validate,
  optionalAuth,
  asyncHandler(async (req, res) => {
    const lang = req.query.lang === 'mr' ? 'mr' : 'en';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const { where, params, nextIndex } = buildSearchQuery({
      gender: req.query.gender,
      ageFrom: req.query.ageFrom ? Number(req.query.ageFrom) : undefined,
      ageTo: req.query.ageTo ? Number(req.query.ageTo) : undefined,
      district: req.query.district,
      education: req.query.education,
    });

    const countRow = await queryOne(
      `SELECT COUNT(*)::int AS total FROM profiles p WHERE ${where}`,
      params
    );

    const limitIdx = nextIndex;
    const offsetIdx = nextIndex + 1;
    const rows = await queryAll(
      `SELECT p.* FROM profiles p
       WHERE ${where}
       ORDER BY p.is_featured DESC, p.is_verified DESC, p.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...params, limit, offset]
    );

    const total = countRow?.total ?? 0;

    res.json({
      success: true,
      data: {
        profiles: rows.map((r) => toPublicProfile(r, lang)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 0,
        },
        filters: {
          gender: req.query.gender || null,
          ageFrom: req.query.ageFrom || null,
          ageTo: req.query.ageTo || null,
          district: req.query.district || 'all',
          education: req.query.education || 'any',
        },
      },
    });
  })
);

router.get(
  '/featured',
  asyncHandler(async (req, res) => {
    const lang = req.query.lang === 'mr' ? 'mr' : 'en';
    const limit = Math.min(Number(req.query.limit) || 6, 20);

    const rows = await queryAll(
      `SELECT * FROM profiles
       WHERE visibility != 'hidden'
       ORDER BY is_featured DESC, is_verified DESC, created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      data: rows.map((r) => toPublicProfile(r, lang)),
    });
  })
);

router.get(
  '/:id',
  profileIdParam,
  validate,
  optionalAuth,
  asyncHandler(async (req, res) => {
    const lang = req.query.lang === 'mr' ? 'mr' : 'en';
    const row = await queryOne('SELECT * FROM profiles WHERE id = $1', [req.params.id]);

    if (!row || row.visibility === 'hidden') {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.json({ success: true, data: toPublicProfile(row, lang) });
  })
);

router.put(
  '/me',
  authenticate,
  profileRules,
  validate,
  asyncHandler(async (req, res) => {
    const existing = await queryOne('SELECT * FROM profiles WHERE user_id = $1', [req.user.id]);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const fields = {
      gender: req.body.gender,
      display_name: req.body.displayName?.trim(),
      age: req.body.age,
      district: req.body.district?.trim(),
      city: req.body.city?.trim(),
      education: req.body.education?.trim(),
      education_level: req.body.educationLevel,
      occupation: req.body.occupation?.trim(),
      height: req.body.height?.trim(),
      kul: req.body.kul?.trim(),
      bio: req.body.bio?.trim(),
      photo_url: req.body.photoUrl?.trim(),
      visibility: req.body.visibility,
      is_online: req.body.isOnline !== undefined ? Boolean(req.body.isOnline) : undefined,
    };

    const updates = [];
    const values = [];
    let i = 1;

    for (const [col, val] of Object.entries(fields)) {
      if (val !== undefined) {
        updates.push(`${col} = $${i++}`);
        values.push(val);
      }
    }

    if (updates.length === 0) {
      return res.json({ success: true, data: toPublicProfile(existing) });
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.user.id);

    await query(`UPDATE profiles SET ${updates.join(', ')} WHERE user_id = $${i}`, values);

    const updated = await queryOne('SELECT * FROM profiles WHERE user_id = $1', [req.user.id]);
    res.json({ success: true, data: toPublicProfile(updated) });
  })
);

export default router;
