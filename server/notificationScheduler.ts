import { getDb, saveDatabase } from './db.js';
import { broadcastNotificationEvent, broadcastAdminNotificationStats } from './websocket.js';

let schedulerTimer: NodeJS.Timeout | null = null;

export function checkScheduledAndExpiredNotifications(): void {
  const db = getDb();
  if (!db.notifications || db.notifications.length === 0) return;

  const now = new Date();
  let hasChanges = false;

  for (const notif of db.notifications) {
    // 1. Check Scheduled -> Published transition
    if (notif.status === 'scheduled' && notif.scheduledAt) {
      const schedDate = new Date(notif.scheduledAt);
      if (schedDate <= now) {
        notif.status = 'published';
        notif.publishedAt = now.toISOString();
        notif.updatedAt = now.toISOString();
        hasChanges = true;

        console.log(`[FAWNIC SCHEDULER] Automatically published notification: "${notif.title}" (ID: ${notif.id})`);

        // Real-time broadcast to all eligible clients
        broadcastNotificationEvent({
          action: 'created',
          notification: notif,
        });
      }
    }

    // 2. Check Published -> Expired transition
    if (notif.status === 'published' && notif.expiresAt) {
      const expDate = new Date(notif.expiresAt);
      if (expDate <= now) {
        notif.status = 'expired';
        notif.updatedAt = now.toISOString();
        hasChanges = true;

        console.log(`[FAWNIC SCHEDULER] Notification expired: "${notif.title}" (ID: ${notif.id})`);

        // Real-time broadcast to remove from customer views
        broadcastNotificationEvent({
          action: 'deleted',
          notificationId: notif.id,
        });
        // Also send update to admin dashboards
        broadcastNotificationEvent({
          action: 'updated',
          notification: notif,
        });
      }
    }
  }

  if (hasChanges) {
    saveDatabase();
    broadcastAdminNotificationStats();
  }
}

export function startNotificationScheduler(): void {
  if (schedulerTimer) clearInterval(schedulerTimer);

  // Immediate check on startup
  checkScheduledAndExpiredNotifications();

  // Periodic check every 20 seconds
  schedulerTimer = setInterval(() => {
    checkScheduledAndExpiredNotifications();
  }, 20000);
}
