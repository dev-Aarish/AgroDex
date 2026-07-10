import cron from 'node-cron';
import { supabase } from '../db.js';

const DRY_RUN = process.env.DRY_RUN !== 'false';

const THRESHOLDS = [ 
  { label: '30-day', days: 30 },
  { label: '60-day', days: 60 },
  { label: '365-day', days: 365 },
];

async function fetchInactiveUsers(cutoffDate) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, last_active_at')
    .lt('last_active_at', cutoffDate.toISOString());

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
}

async function processThreshold(threshold) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - threshold.days);

  console.log(`[cron] Processing ${threshold.label} threshold (cutoff: ${cutoff.toISOString()})`);

  let users;
  try {
    users = await fetchInactiveUsers(cutoff);
  } catch (err) {
    console.error(`[cron] ${threshold.label} — failed to fetch users:`, err.message);
    return;
  }

  console.log(`[cron] ${threshold.label} — found ${users.length} inactive user(s)`);

  for (const user of users) {
    if (DRY_RUN) {
      console.log(`[cron] [DRY_RUN] Would delete user id=${user.id} username=${user.username} last_active=${user.last_active_at}`);
      continue;
    }

    try {
      await deleteUser(user.id);
      console.log(`[cron] Deleted user id=${user.id} username=${user.username}`);
    } catch (err) {
      console.error(`[cron] Failed to delete user id=${user.id} username=${user.username}:`, err.message);
    }
  }
}

async function runInactiveUserCleanup() {
  console.log(`[cron] Starting inactive user cleanup (DRY_RUN=${DRY_RUN})`);

  const alreadyDeleted = new Set();

  for (const threshold of THRESHOLDS) {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - threshold.days);

      let users;
      try {
        users = await fetchInactiveUsers(cutoff);
      } catch (err) {
        console.error(`[cron] ${threshold.label} — failed to fetch users:`, err.message);
        continue;
      }

      const remaining = users.filter(u => !alreadyDeleted.has(u.id));
      console.log(`[cron] ${threshold.label} — found ${remaining.length} user(s) (${users.length} total, ${users.length - remaining.length} already processed)`);

      for (const user of remaining) {
        if (DRY_RUN) {
          console.log(`[cron] [DRY_RUN] ${threshold.label} — would delete user id=${user.id} username=${user.username} last_active=${user.last_active_at}`);
          alreadyDeleted.add(user.id);
          continue;
        }

        try {
          await deleteUser(user.id);
          console.log(`[cron] ${threshold.label} — deleted user id=${user.id} username=${user.username}`);
          alreadyDeleted.add(user.id);
        } catch (err) {
          console.error(`[cron] ${threshold.label} — failed to delete user id=${user.id} username=${user.username}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`[cron] ${threshold.label} — unexpected error:`, err.message);
    }
  }

  console.log(`[cron] Cleanup complete. Total processed: ${alreadyDeleted.size}`);
}

export function startCronJobs() {
  console.log(`[cron] Scheduling inactive user cleanup (DRY_RUN=${DRY_RUN})`);

  cron.schedule('0 3 * * *', () => {
    runInactiveUserCleanup().catch(err => {
      console.error('[cron] Unhandled error in cleanup job:', err.message);
    });
  });
}
