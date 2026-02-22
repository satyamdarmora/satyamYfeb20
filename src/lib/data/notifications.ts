// ---------------------------------------------------------------------------
// Notifications -- queue & helpers
// ---------------------------------------------------------------------------

import type { AppNotification } from '../types';

// ---- Notification queue -----------------------------------------------------

const notifications: AppNotification[] = [];

// ---- Helpers ----------------------------------------------------------------

export function getNotifications(): AppNotification[] {
  return notifications;
}

export function addNotification(n: AppNotification): void {
  notifications.push(n);
}

export function dismissNotification(id: string): void {
  const n = notifications.find((x) => x.id === id);
  if (n) n.dismissed = true;
}
