import { body, param, query, validationResult } from 'express-validator';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
}

export const registerRules = [
  body('fullName').trim().notEmpty().isLength({ max: 120 }),
  body('email').optional({ values: 'null' }).isEmail().normalizeEmail(),
  body('mobile')
    .optional({ values: 'null' })
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Invalid mobile number'),
  body('password').isLength({ min: 6, max: 128 }),
  body('gender').isIn(['bride', 'groom']),
  body('age').isInt({ min: 18, max: 80 }),
  body('district').trim().notEmpty(),
  body('city').optional({ values: 'null' }).trim().isLength({ max: 80 }),
  body('education').optional({ values: 'null' }).trim().isLength({ max: 200 }),
  body('educationLevel')
    .optional({ values: 'null' })
    .isIn(['grad', 'pg', 'eng', 'med', 'mba']),
  body('occupation').optional({ values: 'null' }).trim().isLength({ max: 120 }),
  body('height').optional({ values: 'null' }).trim().isLength({ max: 20 }),
  body('kul').optional({ values: 'null' }).trim().isLength({ max: 60 }),
  body('bio').optional({ values: 'null' }).trim().isLength({ max: 8000 }),
  body().custom((_value, { req }) => {
    if (!req.body.email && !req.body.mobile) {
      throw new Error('Email or mobile is required');
    }
    return true;
  }),
];

export const loginRules = [
  body('identifier').trim().notEmpty(),
  body('password').notEmpty(),
];

export const profileRules = [
  body('gender').optional().isIn(['bride', 'groom']),
  body('displayName').optional().trim().isLength({ min: 2, max: 120 }),
  body('age').optional().isInt({ min: 18, max: 80 }),
  body('district').optional().trim().notEmpty(),
  body('educationLevel')
    .optional({ values: 'null' })
    .isIn(['grad', 'pg', 'eng', 'med', 'mba']),
  body('visibility').optional().isIn(['public', 'members', 'hidden']),
];

export const searchRules = [
  query('gender').optional().isIn(['bride', 'groom']),
  query('ageFrom').optional().isInt({ min: 18, max: 80 }),
  query('ageTo').optional().isInt({ min: 18, max: 80 }),
  query('district').optional().trim(),
  query('education').optional().isIn(['any', 'grad', 'pg', 'eng', 'med', 'mba']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
];

export const interestRules = [
  body('profileId').isInt({ min: 1 }),
  body('message').optional().trim().isLength({ max: 500 }),
];

export const contactRules = [
  body('name').trim().notEmpty().isLength({ max: 120 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('subject').optional().trim().isLength({ max: 200 }),
  body('message').trim().notEmpty().isLength({ max: 2000 }),
];

export const profileIdParam = [param('id').isInt({ min: 1 })];
