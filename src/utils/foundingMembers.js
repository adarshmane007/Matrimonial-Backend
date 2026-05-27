import { queryAll } from '../db/database.js';

const FOUNDING_LIMIT = 50;
let foundingUserIds = new Set();

export async function refreshFoundingMemberIds() {
  const rows = await queryAll(
    `SELECT id FROM users
     WHERE deletion_scheduled_at IS NULL
     ORDER BY created_at ASC, id ASC
     LIMIT $1`,
    [FOUNDING_LIMIT]
  );
  foundingUserIds = new Set(rows.map((r) => r.id));
}

export function isFoundingMember(userId) {
  if (userId == null) return false;
  return foundingUserIds.has(Number(userId));
}
