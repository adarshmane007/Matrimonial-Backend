import { query, queryOne } from '../db/database.js';

export const DELETION_GRACE_HOURS = 24;

export function getDeletionEffectiveAt(scheduledAt) {
  if (!scheduledAt) return null;
  const base = scheduledAt instanceof Date ? scheduledAt : new Date(scheduledAt);
  return new Date(base.getTime() + DELETION_GRACE_HOURS * 60 * 60 * 1000);
}

export function deletionStatusForUser(user) {
  if (!user?.deletion_scheduled_at) return null;
  const scheduledAt = new Date(user.deletion_scheduled_at);
  const effectiveAt = getDeletionEffectiveAt(scheduledAt);
  const canRecover = Date.now() < effectiveAt.getTime();
  return {
    scheduledAt: scheduledAt.toISOString(),
    effectiveAt: effectiveAt.toISOString(),
    canRecover,
    graceHours: DELETION_GRACE_HOURS,
  };
}

/** Permanently remove accounts whose 24-hour grace period has ended. */
export async function purgeExpiredAccountDeletions() {
  const result = await query(
    `DELETE FROM users
     WHERE deletion_scheduled_at IS NOT NULL
       AND deletion_scheduled_at <= NOW() - INTERVAL '24 hours'`
  );
  return result.rowCount ?? 0;
}

/** If grace period ended, delete the user; otherwise return the row. */
export async function resolveUserOrDelete(userId) {
  await purgeExpiredAccountDeletions();
  const user = await queryOne('SELECT * FROM users WHERE id = $1', [userId]);
  if (!user) return { user: null, deleted: false };

  if (user.deletion_scheduled_at) {
    const effectiveAt = getDeletionEffectiveAt(user.deletion_scheduled_at);
    if (Date.now() >= effectiveAt.getTime()) {
      await query('DELETE FROM users WHERE id = $1', [userId]);
      return { user: null, deleted: true };
    }
  }

  return { user, deleted: false };
}
