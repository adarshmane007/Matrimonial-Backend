import { body, param, query, validationResult } from 'express-validator';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    const detail = first?.msg || first?.message || 'Validation failed';
    return res.status(400).json({
      success: false,
      message: typeof detail === 'string' ? detail : 'Validation failed',
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
  body('state').optional().trim().isLength({ max: 10 }),
  body('cityKey').optional().trim().isLength({ max: 80 }),
  body('cityCustom').optional({ values: 'null' }).trim().isLength({ max: 80 }),
  body('district').optional({ values: 'null' }).trim(),
  body('city').optional({ values: 'null' }).trim().isLength({ max: 80 }),
  body('education').optional({ values: 'null' }).trim().isLength({ max: 200 }),
  body('educationLevel')
    .optional({ values: 'null' })
    .isIn(['grad', 'pg', 'eng', 'med', 'mba']),
  body('occupation').optional({ values: 'null' }).trim().isLength({ max: 120 }),
  body('height').optional({ values: 'null' }).trim().isLength({ max: 20 }),
  body('kul').optional({ values: 'null' }).trim().isLength({ max: 60 }),
  body('bio').optional({ values: 'null' }).trim().isLength({ max: 8000 }),
  body('salary').optional({ values: 'null' }).trim().isLength({ max: 80 }),
  body().custom((_value, { req }) => {
    if (!req.body.email && !req.body.mobile) {
      throw new Error('Email or mobile is required');
    }
    if (!req.body.state && !req.body.district && !req.body.cityKey && !req.body.city) {
      throw new Error('State and city are required');
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
  body('state').optional().trim().isLength({ max: 10 }),
  body('cityKey').optional().trim().isLength({ max: 80 }),
  body('cityCustom').optional({ values: 'null' }).trim().isLength({ max: 80 }),
  body('district').optional({ values: 'null' }).trim(),
  body('city').optional({ values: 'null' }).trim().isLength({ max: 80 }),
  body('education').optional({ values: 'null' }).trim().isLength({ max: 200 }),
  body('educationLevel')
    .optional({ values: 'null' })
    .isIn(['grad', 'pg', 'eng', 'med', 'mba']),
  body('occupation').optional({ values: 'null' }).trim().isLength({ max: 120 }),
  body('height').optional({ values: 'null' }).trim().isLength({ max: 20 }),
  body('kul').optional({ values: 'null' }).trim().isLength({ max: 60 }),
  body('bio').optional({ values: 'null' }).trim().isLength({ max: 8000 }),
  body('salary').optional({ values: 'null' }).trim().isLength({ max: 80 }),
  body('photoUrl').optional({ values: 'null' }).trim().isLength({ max: 500000 }),
  body('biodataUrl').optional({ values: 'null' }).trim().isLength({ max: 2800000 }),
  body('incomeBracket')
    .optional({ values: 'null' })
    .isIn(['below_3', '3_5', '5_10', '10_20', 'above_20']),
  body('maritalStatus')
    .optional({ values: 'null' })
    .isIn(['never_married', 'divorced', 'widowed', 'awaiting_divorce']),
  body('diet').optional({ values: 'null' }).isIn(['veg', 'non_veg', 'eggetarian']),
  body('manglik').optional({ values: 'null' }).isIn(['yes', 'no', 'dont_know']),
  body('employmentType')
    .optional({ values: 'null' })
    .isIn(['private', 'govt', 'business', 'not_working']),
  body('motherTongue').optional({ values: 'null' }).isIn(['marathi', 'hindi', 'english']),
  body('familyType').optional({ values: 'null' }).isIn(['joint', 'nuclear']),
  body('nativePlace').optional({ values: 'null' }).trim().isLength({ max: 80 }),
  body('fatherOccupation').optional({ values: 'null' }).trim().isLength({ max: 120 }),
  body('heightCm').optional({ values: 'null' }).isInt({ min: 140, max: 220 }),
  body('visibility').optional().isIn(['public', 'members', 'hidden']),
];

export const searchRules = [
  query('gender').optional().isIn(['bride', 'groom']),
  query('ageFrom').optional().isInt({ min: 18, max: 80 }),
  query('ageTo').optional().isInt({ min: 18, max: 80 }),
  query('state').optional().trim(),
  query('district').optional().trim(),
  query('city').optional().trim(),
  query('education').optional().isIn(['any', 'grad', 'pg', 'eng', 'med', 'mba']),
  query('kul').optional().trim().isLength({ max: 60 }),
  query('occupation').optional().trim().isLength({ max: 80 }),
  query('maritalStatus')
    .optional()
    .isIn(['any', 'never_married', 'divorced', 'widowed', 'awaiting_divorce']),
  query('diet').optional().isIn(['any', 'veg', 'non_veg', 'eggetarian']),
  query('manglik').optional().isIn(['any', 'yes', 'no', 'dont_know']),
  query('employmentType').optional().isIn(['any', 'private', 'govt', 'business', 'not_working']),
  query('motherTongue').optional().isIn(['any', 'marathi', 'hindi', 'english']),
  query('familyType').optional().isIn(['any', 'joint', 'nuclear']),
  query('incomeBracket')
    .optional()
    .isIn(['any', 'below_3', '3_5', '5_10', '10_20', 'above_20']),
  query('heightFrom').optional().isInt({ min: 140, max: 220 }),
  query('heightTo').optional().isInt({ min: 140, max: 220 }),
  query('verifiedOnly').optional().isIn(['true', 'false']),
  query('withPhotoOnly').optional().isIn(['true', 'false']),
  query('sort').optional().isIn(['recent', 'age_asc', 'age_desc']),
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
