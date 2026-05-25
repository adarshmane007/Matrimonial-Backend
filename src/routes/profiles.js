import { Router } from 'express';
import multer from 'multer';
import { query, queryOne, queryAll } from '../db/database.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import {
  profileRules,
  profileIdParam,
  searchRules,
  validate,
} from '../utils/validators.js';
import { toPublicProfile } from '../utils/profileMapper.js';
import { parseHeightToCm } from '../utils/heightUtils.js';
import { normalizeLocationInput } from '../locations.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ok = /^image\/(jpeg|jpg|png|webp)$/i.test(file.mimetype);
    cb(ok ? null : new Error('Only JPG, PNG, or WebP images are allowed'), ok);
  },
});

function buildSearchQuery(filters) {
  const conditions = ["p.visibility != 'hidden'"];
  const params = [];
  let i = 1;

  const addEq = (col, val) => {
    if (val && val !== 'any' && val !== 'all') {
      conditions.push(`p.${col} = $${i++}`);
      params.push(val);
    }
  };

  addEq('gender', filters.gender);
  if (filters.ageFrom) {
    conditions.push(`p.age >= $${i++}`);
    params.push(filters.ageFrom);
  }
  if (filters.ageTo) {
    conditions.push(`p.age <= $${i++}`);
    params.push(filters.ageTo);
  }
  addEq('state', filters.state);
  addEq('district', filters.district);
  addEq('education_level', filters.education);
  addEq('marital_status', filters.maritalStatus);
  addEq('diet', filters.diet);
  addEq('manglik', filters.manglik);
  addEq('employment_type', filters.employmentType);
  addEq('mother_tongue', filters.motherTongue);
  addEq('family_type', filters.familyType);
  addEq('income_bracket', filters.incomeBracket);

  if (filters.kul?.trim()) {
    conditions.push(`p.kul ILIKE $${i++}`);
    params.push(`%${filters.kul.trim()}%`);
  }
  if (filters.occupation?.trim()) {
    conditions.push(`(p.occupation ILIKE $${i} OR p.education ILIKE $${i})`);
    params.push(`%${filters.occupation.trim()}%`);
    i++;
  }
  if (filters.heightFrom) {
    conditions.push(`p.height_cm >= $${i++}`);
    params.push(filters.heightFrom);
  }
  if (filters.heightTo) {
    conditions.push(`p.height_cm <= $${i++}`);
    params.push(filters.heightTo);
  }
  if (filters.verifiedOnly === true || filters.verifiedOnly === 'true') {
    conditions.push('p.is_verified = TRUE');
  }
  if (filters.withPhotoOnly === true || filters.withPhotoOnly === 'true') {
    conditions.push("p.photo_url IS NOT NULL AND p.photo_url != ''");
  }

  let orderBy = 'p.is_featured DESC, p.is_verified DESC, p.created_at DESC';
  if (filters.sort === 'age_asc') orderBy = 'p.age ASC, p.created_at DESC';
  if (filters.sort === 'age_desc') orderBy = 'p.age DESC, p.created_at DESC';

  return { where: conditions.join(' AND '), params, nextIndex: i, orderBy };
}

async function getChatStatus(viewerUserId, targetUserId) {
  if (!viewerUserId || !targetUserId) return 'none';
  if (viewerUserId === targetUserId) return 'self';

  const row = await queryOne(
    `SELECT * FROM chat_requests
     WHERE (from_user_id = $1 AND to_user_id = $2)
        OR (from_user_id = $2 AND to_user_id = $1)`,
    [viewerUserId, targetUserId]
  );
  if (!row) return 'none';
  if (row.status === 'accepted') {
    const [a, b] = viewerUserId < targetUserId ? [viewerUserId, targetUserId] : [targetUserId, viewerUserId];
    const conv = await queryOne(
      'SELECT id FROM chat_conversations WHERE user_one_id = $1 AND user_two_id = $2',
      [a, b]
    );
    return { status: 'accepted', conversationId: conv?.id ?? null };
  }
  if (row.status === 'pending') {
    return row.from_user_id === viewerUserId
      ? { status: 'pending_sent', requestId: row.id }
      : { status: 'pending_received', requestId: row.id };
  }
  return { status: 'declined', requestId: row.id };
}

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const row = await queryOne('SELECT * FROM profiles WHERE user_id = $1', [req.user.id]);

    if (!row) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const lang = req.query.lang === 'mr' ? 'mr' : 'en';
    res.json({
      success: true,
      data: {
        ...toPublicProfile(row, lang, { includeBiodata: true }),
        email: req.user.email ?? null,
        mobile: req.user.mobile ?? null,
        fullName: req.user.full_name,
      },
    });
  })
);

router.post(
  '/me/photo',
  authenticate,
  (req, res, next) => {
    photoUpload.single('photo')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Invalid photo upload',
        });
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file?.buffer?.length) {
      return res.status(400).json({ success: false, message: 'Please choose a photo to upload' });
    }

    const mime =
      req.file.mimetype === 'image/png'
        ? 'image/png'
        : req.file.mimetype === 'image/webp'
          ? 'image/webp'
          : 'image/jpeg';
    const dataUrl = `data:${mime};base64,${req.file.buffer.toString('base64')}`;

    if (dataUrl.length > 2_000_000) {
      return res.status(400).json({
        success: false,
        message: 'Photo is too large. Please use a smaller image (under 1 MB).',
      });
    }

    const existing = await queryOne('SELECT id FROM profiles WHERE user_id = $1', [req.user.id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    await query(
      `UPDATE profiles SET photo_url = $1, updated_at = NOW() WHERE user_id = $2`,
      [dataUrl, req.user.id]
    );

    const updated = await queryOne('SELECT * FROM profiles WHERE user_id = $1', [req.user.id]);
    const lang = req.query.lang === 'mr' ? 'mr' : 'en';
    res.json({
      success: true,
      message: 'Profile photo updated',
      data: toPublicProfile(updated, lang, { includeBiodata: true }),
    });
  })
);

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

    const filterInput = {
      gender: req.query.gender,
      ageFrom: req.query.ageFrom ? Number(req.query.ageFrom) : undefined,
      ageTo: req.query.ageTo ? Number(req.query.ageTo) : undefined,
      state: req.query.state,
      district: req.query.district,
      education: req.query.education,
      kul: req.query.kul,
      maritalStatus: req.query.maritalStatus,
      diet: req.query.diet,
      manglik: req.query.manglik,
      employmentType: req.query.employmentType,
      motherTongue: req.query.motherTongue,
      familyType: req.query.familyType,
      incomeBracket: req.query.incomeBracket,
      occupation: req.query.occupation,
      heightFrom: req.query.heightFrom ? Number(req.query.heightFrom) : undefined,
      heightTo: req.query.heightTo ? Number(req.query.heightTo) : undefined,
      verifiedOnly: req.query.verifiedOnly,
      withPhotoOnly: req.query.withPhotoOnly,
      sort: req.query.sort,
    };

    const { where, params, nextIndex, orderBy } = buildSearchQuery(filterInput);

    let searchWhere = where;
    let searchParams = [...params];
    let searchIdx = nextIndex;
    if (req.user?.id) {
      searchWhere += ` AND p.user_id != $${searchIdx++}`;
      searchParams.push(req.user.id);
    }

    const countRow = await queryOne(
      `SELECT COUNT(*)::int AS total FROM profiles p WHERE ${searchWhere}`,
      searchParams
    );

    const limitIdx = searchIdx;
    const offsetIdx = searchIdx + 1;
    const rows = await queryAll(
      `SELECT p.* FROM profiles p
       WHERE ${searchWhere}
       ORDER BY ${orderBy}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...searchParams, limit, offset]
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
        filters: filterInput,
      },
    });
  })
);

router.get(
  '/featured',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const lang = req.query.lang === 'mr' ? 'mr' : 'en';
    const limit = Math.min(Number(req.query.limit) || 6, 20);

    const params = [limit];
    const conditions = ["p.visibility != 'hidden'", 'u.deletion_scheduled_at IS NULL'];
    let paramIdx = 2;

    if (req.user?.id) {
      conditions.push(`p.user_id != $${paramIdx++}`);
      params.push(req.user.id);
    }

    const genderFilter = req.query.gender;
    if (genderFilter === 'bride' || genderFilter === 'groom') {
      conditions.push(`p.gender = $${paramIdx++}`);
      params.push(genderFilter);
    }

    const rows = await queryAll(
      `SELECT p.* FROM profiles p
       INNER JOIN users u ON u.id = p.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.is_featured DESC, p.is_verified DESC, p.created_at DESC
       LIMIT $1`,
      params
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

    const viewerId = req.user?.id;
    const chat = await getChatStatus(viewerId, row.user_id);
    const chatStatus = typeof chat === 'string' ? chat : chat.status;
    const includeBiodata = Boolean(
      viewerId &&
        viewerId !== row.user_id &&
        row.biodata_url &&
        chatStatus === 'accepted'
    );
    const profile = toPublicProfile(row, lang, { includeBiodata });

    res.json({
      success: true,
      data: {
        ...profile,
        isOwnProfile: req.user?.id === row.user_id,
        chatStatus,
        chatRequestId: typeof chat === 'object' ? chat.requestId : null,
        conversationId: typeof chat === 'object' ? chat.conversationId : null,
      },
    });
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

    const loc = normalizeLocationInput(req.body);

    const fields = {
      gender: req.body.gender,
      profile_creator: req.body.profileCreator,
      display_name: req.body.displayName?.trim(),
      age: req.body.age,
      state: loc.state,
      district: loc.district,
      city: loc.city,
      education: req.body.education?.trim(),
      education_level: req.body.educationLevel,
      occupation: req.body.occupation?.trim(),
      height: req.body.height?.trim(),
      kul: req.body.kul?.trim(),
      bio: req.body.bio?.trim(),
      salary: req.body.salary?.trim(),
      income_bracket: req.body.incomeBracket,
      marital_status: req.body.maritalStatus,
      diet: req.body.diet,
      manglik: req.body.manglik,
      employment_type: req.body.employmentType,
      mother_tongue: req.body.motherTongue,
      family_type: req.body.familyType,
      native_place: req.body.nativePlace?.trim(),
      father_occupation: req.body.fatherOccupation?.trim(),
      photo_url:
        req.body.photoUrl !== undefined && req.body.photoUrl !== null
          ? String(req.body.photoUrl).trim()
          : undefined,
      biodata_url: req.body.biodataUrl?.trim(),
      visibility: req.body.visibility,
      is_online: req.body.isOnline !== undefined ? Boolean(req.body.isOnline) : undefined,
    };

    if (req.body.height !== undefined || req.body.heightCm !== undefined) {
      const cm =
        req.body.heightCm != null
          ? Number(req.body.heightCm)
          : parseHeightToCm(req.body.height);
      fields.height_cm = cm || null;
      if (req.body.height !== undefined) fields.height = req.body.height?.trim() || null;
    }

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
    const lang = req.query.lang === 'mr' ? 'mr' : 'en';
    res.json({
      success: true,
      data: toPublicProfile(updated, lang, { includeBiodata: true }),
    });
  })
);

export default router;
