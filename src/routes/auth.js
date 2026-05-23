import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne, withTransaction } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { signToken } from '../utils/tokens.js';
import { registerRules, loginRules, validate } from '../utils/validators.js';
import { toPublicProfile } from '../utils/profileMapper.js';
import { normalizeLocationInput } from '../locations.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

async function findUserByIdentifier(identifier) {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    return queryOne('SELECT * FROM users WHERE email = $1', [trimmed.toLowerCase()]);
  }
  const mobile = trimmed.replace(/\s/g, '');
  const withPlus = mobile.startsWith('+') ? mobile : `+91${mobile.replace(/^0/, '')}`;
  return queryOne('SELECT * FROM users WHERE mobile = $1 OR mobile = $2', [mobile, withPlus]);
}

function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    mobile: user.mobile,
    fullName: user.full_name,
    isVerified: Boolean(user.is_verified),
    createdAt: user.created_at,
  };
}

router.post(
  '/register',
  registerRules,
  validate,
  asyncHandler(async (req, res) => {
    const loc = normalizeLocationInput(req.body);

    const {
      fullName,
      email,
      mobile,
      password,
      gender,
      age,
      education,
      educationLevel,
      occupation,
      height,
      kul,
      bio,
      salary,
    } = req.body;

    const normalizedEmail = email?.toLowerCase() || null;
    const normalizedMobile = mobile?.replace(/\s/g, '') || null;

    if (normalizedEmail) {
      const exists = await queryOne('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      if (exists) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }
    }
    if (normalizedMobile) {
      const exists = await queryOne('SELECT id FROM users WHERE mobile = $1', [normalizedMobile]);
      if (exists) {
        return res.status(409).json({ success: false, message: 'Mobile already registered' });
      }
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const userId = await withTransaction(async (client) => {
      const userResult = await client.query(
        `INSERT INTO users (email, mobile, password_hash, full_name)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [normalizedEmail, normalizedMobile, passwordHash, fullName.trim()]
      );
      const newUserId = userResult.rows[0].id;

      await client.query(
        `INSERT INTO profiles (
          user_id, gender, display_name, age, state, district, city,
          education, education_level, occupation, height, kul, bio, salary, is_featured
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, FALSE)`,
        [
          newUserId,
          gender,
          fullName.trim(),
          age,
          loc.state,
          loc.district,
          loc.city || null,
          education || null,
          educationLevel || null,
          occupation || null,
          height || null,
          kul || null,
          bio || null,
          salary || null,
        ]
      );
      return newUserId;
    });

    const token = signToken(userId);
    const user = await queryOne(
      `SELECT id, email, mobile, full_name, is_verified, created_at FROM users WHERE id = $1`,
      [userId]
    );
    const profile = await queryOne('SELECT * FROM profiles WHERE user_id = $1', [userId]);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: formatUser(user),
        profile: toPublicProfile(profile),
      },
    });
  })
);

router.post(
  '/login',
  loginRules,
  validate,
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;
    const user = await findUserByIdentifier(identifier);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ success: false, message: 'Invalid email/mobile or password' });
    }

    const profile = await queryOne('SELECT * FROM profiles WHERE user_id = $1', [user.id]);
    const token = signToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: formatUser(user),
        profile: profile ? toPublicProfile(profile) : null,
      },
    });
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const profile = await queryOne('SELECT * FROM profiles WHERE user_id = $1', [req.user.id]);
    res.json({
      success: true,
      data: {
        user: formatUser(req.user),
        profile: profile ? toPublicProfile(profile) : null,
      },
    });
  })
);

router.post('/logout', authenticate, (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
