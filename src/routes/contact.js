import { Router } from 'express';
import { queryOne } from '../db/database.js';
import { contactRules, validate } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post(
  '/',
  contactRules,
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    const result = await queryOne(
      `INSERT INTO contact_messages (name, email, phone, subject, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, email || null, phone || null, subject || null, message]
    );

    res.status(201).json({
      success: true,
      message: 'Thank you. We will get back to you soon.',
      data: { messageId: result.id },
    });
  })
);

export default router;
