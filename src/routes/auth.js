import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne, withTransaction } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { signToken } from '../utils/tokens.js';
import { registerRules, loginRules, validate } from '../utils/validators.js';
import { toPublicProfile } from '../utils/profileMapper.js';
import { normalizeLocationInput } from '../locations.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  deletionStatusForUser,
  purgeExpiredAccountDeletions,
  resolveUserOrDelete,
} from '../utils/accountDeletion.js';
import { normalizeMobileE164, mobileLookupVariants } from '../utils/normalizeMobile.js';
import { cmToDisplay, parseHeightToCm } from '../utils/heightUtils.js';

async function ensureDeletionColumn() {
  await query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ`
  );
}

const router = Router();

async function findUserByIdentifier(identifier) {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    return queryOne('SELECT * FROM users WHERE email = $1', [trimmed.toLowerCase()]);
  }
  const variants = mobileLookupVariants(trimmed);
  if (!variants.length) return null;
  const placeholders = variants.map((_, i) => `$${i + 1}`).join(', ');
  return queryOne(`SELECT * FROM users WHERE mobile IN (${placeholders})`, variants);
}

function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    mobile: user.mobile,
    fullName: user.full_name,
    isVerified: Boolean(user.is_verified),
    createdAt: user.created_at,
    accountDeletion: deletionStatusForUser(user),
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
      profileCreator,
      age,
      education,
      educationLevel,
      occupation,
      height,
      heightCm,
      kul,
      bio,
      salary,
    } = req.body;

    let heightText = height?.trim() || null;
    let heightCmValue = null;
    if (heightCm != null && heightCm !== '') {
      const cm = Number(heightCm);
      if (cm >= 140 && cm <= 220) {
        heightCmValue = cm;
        heightText = cmToDisplay(cm);
      }
    } else if (heightText) {
      heightCmValue = parseHeightToCm(heightText);
    }

    const normalizedEmail = email?.toLowerCase() || null;
    const normalizedMobile = mobile ? normalizeMobileE164(mobile) : null;

    if (mobile && !normalizedMobile) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number' });
    }

    if (normalizedEmail) {
      const exists = await queryOne('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      if (exists) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }
    }
    if (normalizedMobile) {
      const variants = mobileLookupVariants(mobile);
      const placeholders = variants.map((_, i) => `$${i + 1}`).join(', ');
      const exists = await queryOne(
        `SELECT id FROM users WHERE mobile IN (${placeholders})`,
        variants
      );
      if (exists) {
        return res.status(409).json({
          success: false,
          message: 'This mobile number is already registered. One account per phone number.',
        });
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
          user_id, gender, profile_creator, display_name, age, state, district, city,
          education, education_level, occupation, height, height_cm, kul, bio, salary, is_featured
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, FALSE)`,
        [
          newUserId,
          gender,
          profileCreator,
          fullName.trim(),
          age,
          loc.state,
          loc.district,
          loc.city || null,
          education || null,
          educationLevel || null,
          occupation || null,
          heightText,
          heightCmValue,
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
    await ensureDeletionColumn();
    await purgeExpiredAccountDeletions();
    const user = await findUserByIdentifier(identifier);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ success: false, message: 'Invalid email/mobile or password' });
    }

    const { user: activeUser, deleted } = await resolveUserOrDelete(user.id);
    if (!activeUser) {
      return res.status(401).json({
        success: false,
        message: deleted
          ? 'Your account has been permanently deleted.'
          : 'Invalid email/mobile or password',
      });
    }

    const profile = await queryOne('SELECT * FROM profiles WHERE user_id = $1', [activeUser.id]);
    const token = signToken(activeUser.id);
    const accountDeletion = deletionStatusForUser(activeUser);

    res.json({
      success: true,
      message: accountDeletion
        ? 'Signed in. Your account is still scheduled for deletion.'
        : 'Login successful',
      data: {
        token,
        user: formatUser(activeUser),
        profile: profile ? toPublicProfile(profile) : null,
        deletionPending: Boolean(accountDeletion),
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

router.post(
  '/account/delete-request',
  authenticate,
  asyncHandler(async (req, res) => {
    await ensureDeletionColumn();

    if (req.user.deletion_scheduled_at) {
      return res.json({
        success: true,
        message: 'Account deletion is already scheduled.',
        data: {
          user: formatUser(req.user),
          accountDeletion: deletionStatusForUser(req.user),
        },
      });
    }

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE users SET deletion_scheduled_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [req.user.id]
      );
      await client.query(
        `UPDATE profiles SET visibility = 'hidden', updated_at = NOW() WHERE user_id = $1`,
        [req.user.id]
      );
    });

    const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.user.id]);
    res.json({
      success: true,
      message:
        'Your account is scheduled for deletion in 24 hours. You can recover it until then.',
      data: { user: formatUser(user), accountDeletion: deletionStatusForUser(user) },
    });
  })
);

router.post(
  '/account/cancel-deletion',
  authenticate,
  asyncHandler(async (req, res) => {
    await ensureDeletionColumn();

    if (!req.user.deletion_scheduled_at) {
      return res.status(400).json({
        success: false,
        message: 'No account deletion is scheduled.',
      });
    }

    const status = deletionStatusForUser(req.user);
    if (!status?.canRecover) {
      return res.status(410).json({
        success: false,
        message: 'The recovery period has ended. Your account can no longer be restored.',
      });
    }

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE users SET deletion_scheduled_at = NULL, updated_at = NOW() WHERE id = $1`,
        [req.user.id]
      );
      await client.query(
        `UPDATE profiles SET visibility = 'members', updated_at = NOW() WHERE user_id = $1`,
        [req.user.id]
      );
    });

    const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.user.id]);
    res.json({
      success: true,
      message: 'Account deletion cancelled. Your profile is visible again.',
      data: { user: formatUser(user) },
    });
  })
);

router.post('/logout', authenticate, (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
