import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPublicOtpConfig, otpConfig } from './config.js';
import { sendOtpForMobile, verifyOtpForMobile } from './service.js';

const router = Router();

router.get(
  '/status',
  asyncHandler(async (_req, res) => {
    res.json({ success: true, data: getPublicOtpConfig() });
  })
);

const mobileBody = body('mobile').trim().notEmpty().withMessage('Mobile is required');

router.post(
  '/send',
  [mobileBody, validate],
  asyncHandler(async (req, res) => {
    if (!otpConfig.enabled) {
      return res.status(503).json({ success: false, message: 'OTP verification is not enabled' });
    }
    const result = await sendOtpForMobile(req.body.mobile);
    if (!result.ok) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message,
        retryAfterSeconds: result.retryAfterSeconds,
      });
    }
    res.json({
      success: true,
      message: result.message,
      data: { mobile: result.mobile, expiresAt: result.expiresAt },
    });
  })
);

router.post(
  '/verify',
  [
    mobileBody,
    body('code').trim().isLength({ min: 4, max: 8 }).withMessage('Invalid code'),
    validate,
  ],
  asyncHandler(async (req, res) => {
    if (!otpConfig.enabled) {
      return res.status(503).json({ success: false, message: 'OTP verification is not enabled' });
    }
    const result = await verifyOtpForMobile(req.body.mobile, req.body.code);
    if (!result.ok) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    res.json({
      success: true,
      message: result.message,
      data: {
        mobile: result.mobile,
        mobileVerificationToken: result.mobileVerificationToken,
        expiresAt: result.expiresAt,
      },
    });
  })
);

export default router;
