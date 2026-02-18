// Shared server-side notification store
// This module runs ONLY on the server (Node.js process)
// The module-level array persists across requests in the dev server

export interface ServerNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  amount?: number;
  task_id?: string;
  timestamp: string;
  dismissed: boolean;
}

const notifications: ServerNotification[] = [];

export function getUndismissedNotifications(): ServerNotification[] {
  return notifications.filter((n) => !n.dismissed);
}

export function addNotificationServer(n: ServerNotification): void {
  notifications.push(n);
}

export function dismissNotificationServer(id: string): void {
  const found = notifications.find((n) => n.id === id);
  if (found) found.dismissed = true;
}
