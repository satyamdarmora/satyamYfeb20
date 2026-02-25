// ---------------------------------------------------------------------------
// Task queue bucket algorithm & sorting -- pure functions, no data store deps
// ---------------------------------------------------------------------------

import type { Task, QueueBucket } from './types';

/**
 * Determines the queue bucket for a task.
 *
 * Bucket 0 -- HIGH-priority RESTORE in ALERTED (active connectivity loss)
 * Bucket 1 -- Retry chains / escalations (retry_count > 0 OR chain escalation flag)
 * Bucket 2 -- Active installs (CLAIMED/ACCEPTED/SCHEDULED/INSTALLED) with
 *             expiring TTLs or VERIFICATION_PENDING
 * Bucket 3 -- Netbox returns that are COLLECTED (return pending to Wiom)
 * Bucket 4 -- Netbox pickups still PICKUP_REQUIRED
 * Bucket 5 -- OFFERED installs with expiring offer TTL
 * Bucket 6 -- Everything else (normal in-progress work)
 */
export function getBucket(task: Task): QueueBucket {
  // Bucket 0 -- HIGH RESTORE that is still ALERTED
  if (
    task.task_type === 'RESTORE' &&
    task.priority === 'HIGH' &&
    task.state === 'ALERTED'
  ) {
    return 0;
  }

  // Bucket 1 -- Retry chains / chain escalation
  if (
    task.retry_count > 0 ||
    task.queue_escalation_flag === 'CHAIN_ESCALATION_PENDING' ||
    task.queue_escalation_flag === 'RESTORE_RETRY'
  ) {
    return 1;
  }

  // Bucket 2 -- Active installs with urgency signals
  if (task.task_type === 'INSTALL') {
    const activeInstallStates = ['CLAIMED', 'ACCEPTED', 'SCHEDULED', 'INSTALLED'];
    if (activeInstallStates.includes(task.state)) {
      if (
        task.queue_escalation_flag === 'CLAIM_TTL_EXPIRING' ||
        task.queue_escalation_flag === 'VERIFICATION_PENDING' ||
        (task.state === 'SCHEDULED' && task.due_at)
      ) {
        return 2;
      }
    }
  }

  // Bucket 3 -- Netbox collected, return pending
  if (task.task_type === 'NETBOX' && task.state === 'COLLECTED') {
    return 3;
  }

  // Bucket 4 -- Netbox pickup required
  if (task.task_type === 'NETBOX' && task.state === 'PICKUP_REQUIRED') {
    return 4;
  }

  // Bucket 5 -- Offered installs with TTL expiring
  if (
    task.task_type === 'INSTALL' &&
    task.state === 'OFFERED' &&
    task.queue_escalation_flag === 'OFFER_TTL_EXPIRING'
  ) {
    return 5;
  }

  // Bucket 6 -- everything else
  return 6;
}

/**
 * Returns the most relevant urgency deadline for a task depending on its type
 * and state. Used as a secondary sort key within each bucket.
 */
export function getUrgencyDeadline(task: Task): number {
  const deadlineCandidates: (string | undefined)[] = [
    task.sla_deadline_at,
    task.offer_expires_at,
    task.accept_expires_at,
    task.return_due_at,
    task.pickup_due_at,
    task.due_at,
  ];

  const timestamps = deadlineCandidates
    .filter((d): d is string => d !== undefined)
    .map((d) => new Date(d).getTime());

  if (timestamps.length === 0) return Infinity;
  return Math.min(...timestamps);
}

/**
 * Sorts tasks in queue display order:
 *   1. By bucket (ascending -- 0 is most urgent)
 *   2. By nearest urgency deadline (ascending -- soonest first)
 *   3. By created_at (ascending -- oldest first)
 */
export function sortTasksByQueue(inputTasks: Task[]): Task[] {
  return [...inputTasks].sort((a, b) => {
    const bucketA = getBucket(a);
    const bucketB = getBucket(b);
    if (bucketA !== bucketB) return bucketA - bucketB;

    const urgA = getUrgencyDeadline(a);
    const urgB = getUrgencyDeadline(b);
    if (urgA !== urgB) return urgA - urgB;

    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}
