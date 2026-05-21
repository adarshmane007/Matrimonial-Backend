import { Router } from 'express';
import { body } from 'express-validator';
import { parseBiodata } from '../utils/biodataParser.js';
import { validate } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post(
  '/parse',
  [body('biodata').trim().isLength({ min: 20, max: 8000 })],
  validate,
  asyncHandler(async (req, res) => {
    const { parsed, warnings } = parseBiodata(req.body.biodata);

    if (!parsed) {
      return res.status(400).json({
        success: false,
        message: warnings[0] || 'Could not parse biodata',
        warnings,
      });
    }

    res.json({
      success: true,
      message: 'Biodata parsed — review fields before creating profile',
      data: { parsed, warnings },
    });
  })
);

export default router;
