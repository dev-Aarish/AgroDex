import cron from 'node-cron';
import { supabase } from '../db.js';

const DRY_RUN = process.env.DRY_RUN !== 'false';

// Thresholds are processed from longest to shortest so that each bucket
// uses a non-overlapping date range:
//   365-day bucket: last_active_at < 365 days ago
//    60-day bucket: last_active_at >= 365 days ago AND < 60 days ago
//    30-day bucket: last_active_at >= 60 days ago  AND < 30 days ago
const THRESHOLDS = [
  { label: '365-day', days: 365 },
  { label: '60-day',  days: 60 },
  { label: '30-day',  days: 30 },
];

/**
 * Fetch inactive users whose last_active_at falls within a date range.
 * @param {Date} cutoffDate  - upper bound (exclusive): last_active_at < cutoffDate
 * @param {Date|null} floorDate - lower bound (inclusive): last_active_at >= floorDate (null = no lower bound)
 * @returns {Promise<Array>}
 */
async function fetchInactiveUsers(cutoffDate, floorDate = null) {
  let query = supabase
    .from('profiles')
    .select('id, username, last_active_at')
    .lt('last_active_at', cutoffDate.toISOString());

  if (floorDate) {
    query = query.gte('last_active_at', floorDate.toISOString());
  }

  const { data, error } = await query.limit(100);

  if (error) {
    throw new Error(`Failed to query inactive users: ${error.message}`);
  }

  return data || [];
}

async function deleteUser(userId) {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(error.message);
  }

  // Best-effort audit log — warn on failure, never throw
  const { error: auditError } = await supabase
    .from('account_deletion_log')
    .insert({ user_id: userId });

  if (auditError) {
    console.warn(`[cron] audit log insert failed for user id=${userId}:`, auditError.message);
  }
}

async function runInactiveUserCleanup() {
  console.log(`[cron] Starting inactive user cleanup (DRY_RUN=${DRY_RUN})`);

  let totalProcessed = 0;

  for (let i = 0; i < THRESHOLDS.length; i++) {
    const threshold = THRESHOLDS[i];

    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - threshold.days);

      // The floor is the cutoff of the *previous* (longer) threshold so that
      // buckets never overlap.  The first bucket (365-day) has no floor.
      const floorDate = i > 0
        ? (() => { const d = new Date(); d.setDate(d.getDate() - THRESHOLDS[i - 1].days); return d; })()
        : null;

      let users;
      try {
        users = await fetchInactiveUsers(cutoff, floorDate);
      } catch (err) {
        console.error(`[cron] ${threshold.label} — failed to fetch users:`, err.message);
        continue;
      }

      console.log(`[cron] ${threshold.label} — found ${users.length} user(s)`);

      for (const user of users) {
        if (DRY_RUN) {
          console.log(`[cron] [DRY_RUN] ${threshold.label} — would delete user id=${user.id} username=${user.username} last_active=${user.last_active_at}`);
          totalProcessed++;
          continue;
        }

        try {
          await deleteUser(user.id);
          console.log(`[cron] ${threshold.label} — deleted user id=${user.id} username=${user.username}`);
          totalProcessed++;
        } catch (err) {
          console.error(`[cron] ${threshold.label} — failed to delete user id=${user.id} username=${user.username}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`[cron] ${threshold.label} — unexpected error:`, err.message);
    }
  }

  console.log(`[cron] Cleanup complete. Total processed: ${totalProcessed}`);
}

export function startCronJobs() {
  console.log(`[cron] Scheduling inactive user cleanup (DRY_RUN=${DRY_RUN})`);

  cron.schedule('0 3 * * *', () => {
    runInactiveUserCleanup().catch(err => {
      console.error('[cron] Unhandled error in cleanup job:', err.message);
    });
  }, { timezone: 'UTC' });
}
