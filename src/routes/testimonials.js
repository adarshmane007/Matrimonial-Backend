import { Router } from 'express';
import { queryAll } from '../db/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const lang = req.query.lang === 'mr' ? 'mr' : 'en';
    const rows = await queryAll(
      `SELECT * FROM testimonials
       WHERE is_published = TRUE
       ORDER BY sort_order ASC, id ASC`
    );

    res.json({
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        coupleNames: row.couple_names,
        location: row.location,
        text: lang === 'mr' && row.story_mr ? row.story_mr : row.story_en,
        marriedYear: row.married_year,
        rating: row.rating,
      })),
    });
  })
);

export default router;
