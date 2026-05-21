import { Router } from 'express';
import { queryOne } from '../db/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const profileCount = await queryOne(
      `SELECT COUNT(*)::int AS count FROM profiles WHERE visibility != $1`,
      ['hidden']
    );

    const verifiedCount = await queryOne(
      `SELECT COUNT(*)::int AS count FROM profiles WHERE is_verified = TRUE`
    );

    const matchCount = await queryOne(
      `SELECT COUNT(*)::int AS count FROM interests WHERE status = 'accepted'`
    );

    const userCount = await queryOne(`SELECT COUNT(*)::int AS count FROM users`);

    res.json({
      success: true,
      data: {
        verifiedProfiles: formatStat(profileCount?.count ?? 0, profileCount?.count ?? 0),
        successfulMatches: formatStat(matchCount?.count ?? 0, 12000),
        totalMembers: userCount?.count ?? 0,
        community: '100% Maratha',
        isLive: true,
      },
    });
  })
);

function formatStat(actual, marketingFallback) {
  const display = actual >= 100 ? actual : marketingFallback;
  return {
    count: actual,
    display: display >= 1000 ? `${Math.floor(display / 1000)}K+` : `${display}+`,
  };
}

export default router;
