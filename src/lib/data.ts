// ---------------------------------------------------------------------------
// Wiom CSP App -- Seed Data Store & Helper Functions
// ---------------------------------------------------------------------------

import type {
  Task,
  AssuranceState,
  Technician,
  QueueBucket,
  TimelineEvent,
  WalletState,
  WalletTransaction,
  SupportCase,
  AppNotification,
} from './types';

// ---- Date helpers (all relative to "now") -----------------------------------

function iso(offsetMs: number = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// ---- Technicians ------------------------------------------------------------

const technicians: Technician[] = [
  { id: 'TECH-001', name: 'Ajay Patil',    band: 'A', available: true,  csp_id: 'CSP-MH-1001', phone: '+91 98765 43210', join_date: '2025-06-15', completed_count: 47 },
  { id: 'TECH-002', name: 'Suresh Kamble',  band: 'B', available: true,  csp_id: 'CSP-MH-1001', phone: '+91 98765 43211', join_date: '2025-08-01', completed_count: 31 },
  { id: 'TECH-003', name: 'Ramesh Jadhav',  band: 'B', available: false, csp_id: 'CSP-MH-1001', phone: '+91 98765 43212', join_date: '2025-09-10', completed_count: 22 },
  { id: 'TECH-004', name: 'Vikram Shinde',  band: 'C', available: true,  csp_id: 'CSP-MH-1001', phone: '+91 98765 43213', join_date: '2025-11-20', completed_count: 8  },
];

// ---- Seed tasks -------------------------------------------------------------

const tasks: Task[] = [
  // -----------------------------------------------------------------------
  // 1. HIGH RESTORE -- ALERTED -- 45 min SLA window left -- bucket 0
  // -----------------------------------------------------------------------
  {
    task_id: 'TSK-4001',
    task_type: 'RESTORE',
    state: 'ALERTED',
    priority: 'HIGH',
    created_by: 'SYSTEM',
    created_at: iso(-30 * MIN),
    sla_deadline_at: iso(45 * MIN),
    delegation_state: 'UNASSIGNED',
    owner_entity: 'CSP-MH-1001',
    queue_escalation_flag: undefined,
    retry_count: 0,
    connection_id: 'WM-CON-2845',
    customer_area: 'Andheri West',
    proof_bundle: {},
    event_log: [
      {
        timestamp: iso(-30 * MIN),
        event_type: 'CONNECTIVITY_LOSS_DETECTED',
        actor: 'wiom-monitor',
        actor_type: 'SYSTEM',
        detail: 'Packet loss exceeded threshold for WM-CON-2845 in Andheri West.',
      },
      {
        timestamp: iso(-30 * MIN),
        event_type: 'TASK_CREATED',
        actor: 'wiom-monitor',
        actor_type: 'SYSTEM',
        detail: 'Restore task created with HIGH priority. SLA 75 min.',
      },
      {
        timestamp: iso(-28 * MIN),
        event_type: 'CSP_NOTIFIED',
        actor: 'wiom-notify',
        actor_type: 'SYSTEM',
        detail: 'Push notification sent to CSP-MH-1001.',
      },
    ],
  },

  // -----------------------------------------------------------------------
  // 2. RESTORE retry chain -- retry_count 2, ASSIGNED -- bucket 1
  // -----------------------------------------------------------------------
  {
    task_id: 'TSK-4002',
    task_type: 'RESTORE',
    state: 'ASSIGNED',
    priority: 'HIGH',
    created_by: 'SYSTEM',
    created_at: iso(-4 * HOUR),
    sla_deadline_at: iso(2 * HOUR),
    delegation_state: 'ASSIGNED',
    delegation_accept_deadline_at: iso(20 * MIN),
    assigned_to: 'Suresh Kamble',
    owner_entity: 'CSP-MH-1001',
    queue_escalation_flag: 'RESTORE_RETRY',
    retry_count: 2,
    chain_id: 'CHAIN-R-0091',
    connection_id: 'WM-CON-3102',
    customer_area: 'Bandra East',
    proof_bundle: {},
    event_log: [
      {
        timestamp: iso(-4 * HOUR),
        event_type: 'CONNECTIVITY_LOSS_DETECTED',
        actor: 'wiom-monitor',
        actor_type: 'SYSTEM',
        detail: 'Packet loss exceeded threshold for WM-CON-3102 in Bandra East.',
      },
      {
        timestamp: iso(-3.5 * HOUR),
        event_type: 'RESTORE_ATTEMPTED',
        actor: 'Ajay Patil',
        actor_type: 'TECHNICIAN',
        detail: 'First restore attempt. Router rebooted -- issue persisted.',
      },
      {
        timestamp: iso(-2 * HOUR),
        event_type: 'RESTORE_ATTEMPTED',
        actor: 'Ajay Patil',
        actor_type: 'TECHNICIAN',
        detail: 'Second restore attempt. Replaced ethernet cable -- issue persisted.',
      },
      {
        timestamp: iso(-45 * MIN),
        event_type: 'REASSIGNED',
        actor: 'CSP-MH-1001',
        actor_type: 'CSP',
        detail: 'Reassigned to Suresh Kamble for third attempt. Chain CHAIN-R-0091.',
      },
    ],
  },

  // -----------------------------------------------------------------------
  // 3. INSTALL -- CLAIMED -- accept TTL expiring in 3 min -- bucket 2
  // -----------------------------------------------------------------------
  {
    task_id: 'TSK-4003',
    task_type: 'INSTALL',
    state: 'CLAIMED',
    priority: 'NORMAL',
    created_by: 'SYSTEM',
    created_at: iso(-2 * HOUR),
    due_at: iso(1 * DAY),
    accept_expires_at: iso(3 * MIN),
    delegation_state: 'ASSIGNED',
    delegation_accept_deadline_at: iso(3 * MIN),
    assigned_to: 'Ramesh Jadhav',
    owner_entity: 'CSP-MH-1001',
    queue_escalation_flag: 'CLAIM_TTL_EXPIRING',
    retry_count: 0,
    connection_id: 'WM-CON-2901',
    customer_area: 'Powai',
    proof_bundle: {},
    event_log: [
      {
        timestamp: iso(-2 * HOUR),
        event_type: 'TASK_CREATED',
        actor: 'wiom-scheduler',
        actor_type: 'SYSTEM',
        detail: 'Install order created for WM-CON-2901 in Powai.',
      },
      {
        timestamp: iso(-1.5 * HOUR),
        event_type: 'OFFERED',
        actor: 'wiom-scheduler',
        actor_type: 'SYSTEM',
        detail: 'Task offered to CSP-MH-1001.',
      },
      {
        timestamp: iso(-12 * MIN),
        event_type: 'CLAIMED',
        actor: 'CSP-MH-1001',
        actor_type: 'CSP',
        detail: 'CSP claimed the install task. Accept TTL started (15 min).',
      },
    ],
  },

  // -----------------------------------------------------------------------
  // 4. INSTALL -- SCHEDULED -- due in 2 hours -- bucket 2
  // -----------------------------------------------------------------------
  {
    task_id: 'TSK-4004',
    task_type: 'INSTALL',
    state: 'SCHEDULED',
    priority: 'NORMAL',
    created_by: 'SYSTEM',
    created_at: iso(-1 * DAY),
    due_at: iso(2 * HOUR),
    delegation_state: 'ACCEPTED',
    assigned_to: 'Ajay Patil',
    owner_entity: 'CSP-MH-1001',
    retry_count: 0,
    connection_id: 'WM-CON-2780',
    customer_area: 'Malad West',
    proof_bundle: {},
    event_log: [
      {
        timestamp: iso(-1 * DAY),
        event_type: 'TASK_CREATED',
        actor: 'wiom-scheduler',
        actor_type: 'SYSTEM',
        detail: 'Install order created for WM-CON-2780 in Malad West.',
      },
      {
        timestamp: iso(-23 * HOUR),
        event_type: 'OFFERED',
        actor: 'wiom-scheduler',
        actor_type: 'SYSTEM',
        detail: 'Task offered to CSP-MH-1001.',
      },
      {
        timestamp: iso(-22 * HOUR),
        event_type: 'CLAIMED',
        actor: 'CSP-MH-1001',
        actor_type: 'CSP',
        detail: 'CSP claimed the install task.',
      },
      {
        timestamp: iso(-20 * HOUR),
        event_type: 'SCHEDULED',
        actor: 'Ajay Patil',
        actor_type: 'TECHNICIAN',
        detail: 'Installation scheduled with customer for today.',
      },
    ],
  },

  // -----------------------------------------------------------------------
  // 5. INSTALL -- INSTALLED -- VERIFICATION_PENDING flag -- bucket 2
  // -----------------------------------------------------------------------
  {
    task_id: 'TSK-4005',
    task_type: 'INSTALL',
    state: 'INSTALLED',
    priority: 'NORMAL',
    created_by: 'SYSTEM',
    created_at: iso(-3 * DAY),
    due_at: iso(-1 * DAY),
    delegation_state: 'DONE',
    assigned_to: 'Suresh Kamble',
    owner_entity: 'CSP-MH-1001',
    queue_escalation_flag: 'VERIFICATION_PENDING',
    retry_count: 0,
    connection_id: 'WM-CON-2650',
    customer_area: 'Goregaon East',
    proof_bundle: {
      install_photo: 'proof://img/TSK-4005/install-front.jpg',
      router_serial: 'proof://img/TSK-4005/serial-plate.jpg',
    },
    event_log: [
      {
        timestamp: iso(-3 * DAY),
        event_type: 'TASK_CREATED',
        actor: 'wiom-scheduler',
        actor_type: 'SYSTEM',
        detail: 'Install order created for WM-CON-2650 in Goregaon East.',
      },
      {
        timestamp: iso(-2 * DAY),
        event_type: 'SCHEDULED',
        actor: 'Suresh Kamble',
        actor_type: 'TECHNICIAN',
        detail: 'Scheduled installation visit.',
      },
      {
        timestamp: iso(-1.5 * DAY),
        event_type: 'INSTALLED',
        actor: 'Suresh Kamble',
        actor_type: 'TECHNICIAN',
        detail: 'Hardware installed. Proofs uploaded. Awaiting activation verification.',
        proof: 'proof://img/TSK-4005/install-front.jpg',
      },
      {
        timestamp: iso(-1 * DAY),
        event_type: 'VERIFICATION_PENDING',
        actor: 'wiom-verify',
        actor_type: 'SYSTEM',
        detail: 'Activation verification not yet confirmed. Flag raised.',
      },
    ],
  },

  // -----------------------------------------------------------------------
  // 6. NETBOX -- COLLECTED -- return due in 5 hours -- bucket 3
  // -----------------------------------------------------------------------
  {
    task_id: 'TSK-4006',
    task_type: 'NETBOX',
    state: 'COLLECTED',
    priority: 'NORMAL',
    created_by: 'SYSTEM',
    created_at: iso(-2 * DAY),
    return_due_at: iso(5 * HOUR),
    delegation_state: 'IN_PROGRESS',
    assigned_to: 'Vikram Shinde',
    owner_entity: 'CSP-MH-1001',
    retry_count: 0,
    netbox_id: 'NB-MH-0455',
    connection_id: 'WM-CON-2510',
    customer_area: 'Jogeshwari West',
    proof_bundle: {
      pickup_selfie: 'proof://img/TSK-4006/pickup-selfie.jpg',
    },
    event_log: [
      {
        timestamp: iso(-2 * DAY),
        event_type: 'TASK_CREATED',
        actor: 'wiom-scheduler',
        actor_type: 'SYSTEM',
        detail: 'Netbox return task created for NB-MH-0455 at Jogeshwari West.',
      },
      {
        timestamp: iso(-1.5 * DAY),
        event_type: 'ASSIGNED',
        actor: 'CSP-MH-1001',
        actor_type: 'CSP',
        detail: 'Assigned to Vikram Shinde for pickup.',
      },
      {
        timestamp: iso(-6 * HOUR),
        event_type: 'COLLECTED',
        actor: 'Vikram Shinde',
        actor_type: 'TECHNICIAN',
        detail: 'Netbox collected from customer premises. Pickup proof uploaded.',
        proof: 'proof://img/TSK-4006/pickup-selfie.jpg',
      },
    ],
  },

  // -----------------------------------------------------------------------
  // 7. NETBOX -- PICKUP_REQUIRED -- pickup due in 10 hours -- bucket 4
  // -----------------------------------------------------------------------
  {
    task_id: 'TSK-4007',
    task_type: 'NETBOX',
    state: 'PICKUP_REQUIRED',
    priority: 'NORMAL',
    created_by: 'SYSTEM',
    created_at: iso(-1 * DAY),
    pickup_due_at: iso(10 * HOUR),
    delegation_state: 'UNASSIGNED',
    owner_entity: 'CSP-MH-1001',
    retry_count: 0,
    netbox_id: 'NB-MH-0462',
    connection_id: 'WM-CON-2390',
    customer_area: 'Borivali East',
    proof_bundle: {},
    event_log: [
      {
        timestamp: iso(-1 * DAY),
        event_type: 'TASK_CREATED',
        actor: 'wiom-scheduler',
        actor_type: 'SYSTEM',
        detail: 'Netbox pickup required for NB-MH-0462 at Borivali East.',
      },
      {
        timestamp: iso(-23 * HOUR),
        event_type: 'CSP_NOTIFIED',
        actor: 'wiom-notify',
        actor_type: 'SYSTEM',
        detail: 'Push notification sent to CSP-MH-1001 regarding netbox pickup.',
      },
    ],
  },

  // -----------------------------------------------------------------------
  // 8. INSTALL -- OFFERED -- offer TTL 4 min left -- bucket 5
  // -----------------------------------------------------------------------
  {
    task_id: 'TSK-4008',
    task_type: 'INSTALL',
    state: 'OFFERED',
    priority: 'NORMAL',
    created_by: 'SYSTEM',
    created_at: iso(-40 * MIN),
    due_at: iso(2 * DAY),
    offer_expires_at: iso(4 * MIN),
    delegation_state: 'UNASSIGNED',
    owner_entity: 'CSP-MH-1001',
    queue_escalation_flag: 'OFFER_TTL_EXPIRING',
    retry_count: 0,
    connection_id: 'WM-CON-3201',
    customer_area: 'Kandivali West',
    proof_bundle: {},
    event_log: [
      {
        timestamp: iso(-40 * MIN),
        event_type: 'TASK_CREATED',
        actor: 'wiom-scheduler',
        actor_type: 'SYSTEM',
        detail: 'Install order created for WM-CON-3201 in Kandivali West.',
      },
      {
        timestamp: iso(-40 * MIN),
        event_type: 'OFFERED',
        actor: 'wiom-scheduler',
        actor_type: 'SYSTEM',
        detail: 'Task offered to CSP-MH-1001. Offer TTL 45 min.',
      },
    ],
  },

  // -----------------------------------------------------------------------
  // 9. INSTALL -- OFFERED -- offer TTL 2 min left -- bucket 5
  // -----------------------------------------------------------------------
  {
    task_id: 'TSK-4009',
    task_type: 'INSTALL',
    state: 'OFFERED',
    priority: 'NORMAL',
    created_by: 'SYSTEM',
    created_at: iso(-43 * MIN),
    due_at: iso(2 * DAY),
    offer_expires_at: iso(2 * MIN),
    delegation_state: 'UNASSIGNED',
    owner_entity: 'CSP-MH-1001',
    queue_escalation_flag: 'OFFER_TTL_EXPIRING',
    retry_count: 0,
    connection_id: 'WM-CON-3215',
    customer_area: 'Dahisar East',
    proof_bundle: {},
    event_log: [
      {
        timestamp: iso(-43 * MIN),
        event_type: 'TASK_CREATED',
        actor: 'wiom-scheduler',
        actor_type: 'SYSTEM',
        detail: 'Install order created for WM-CON-3215 in Dahisar East.',
      },
      {
        timestamp: iso(-43 * MIN),
        event_type: 'OFFERED',
        actor: 'wiom-scheduler',
        actor_type: 'SYSTEM',
        detail: 'Task offered to CSP-MH-1001. Offer TTL 45 min.',
      },
      {
        timestamp: iso(-5 * MIN),
        event_type: 'TTL_WARNING',
        actor: 'wiom-scheduler',
        actor_type: 'SYSTEM',
        detail: 'Offer TTL expiring soon. 5 minutes remaining.',
      },
    ],
  },

  // -----------------------------------------------------------------------
  // 10. RESTORE -- IN_PROGRESS -- normal priority -- bucket 6
  // -----------------------------------------------------------------------
  {
    task_id: 'TSK-4010',
    task_type: 'RESTORE',
    state: 'IN_PROGRESS',
    priority: 'NORMAL',
    created_by: 'SYSTEM',
    created_at: iso(-3 * HOUR),
    sla_deadline_at: iso(6 * HOUR),
    delegation_state: 'IN_PROGRESS',
    assigned_to: 'Ajay Patil',
    owner_entity: 'CSP-MH-1001',
    retry_count: 0,
    connection_id: 'WM-CON-2975',
    customer_area: 'Versova',
    proof_bundle: {},
    event_log: [
      {
        timestamp: iso(-3 * HOUR),
        event_type: 'CONNECTIVITY_LOSS_DETECTED',
        actor: 'wiom-monitor',
        actor_type: 'SYSTEM',
        detail: 'Connectivity degraded for WM-CON-2975 in Versova.',
      },
      {
        timestamp: iso(-2.5 * HOUR),
        event_type: 'ASSIGNED',
        actor: 'CSP-MH-1001',
        actor_type: 'CSP',
        detail: 'Assigned to Ajay Patil.',
      },
      {
        timestamp: iso(-1 * HOUR),
        event_type: 'IN_PROGRESS',
        actor: 'Ajay Patil',
        actor_type: 'TECHNICIAN',
        detail: 'Technician on-site. Diagnosing router issue.',
      },
    ],
  },

  // -----------------------------------------------------------------------
  // 11. INSTALL -- ACCEPTED -- delegation to technician -- bucket 6
  // -----------------------------------------------------------------------
  {
    task_id: 'TSK-4011',
    task_type: 'INSTALL',
    state: 'ACCEPTED',
    priority: 'NORMAL',
    created_by: 'SYSTEM',
    created_at: iso(-5 * HOUR),
    due_at: iso(1 * DAY),
    delegation_state: 'ACCEPTED',
    assigned_to: 'Ramesh Jadhav',
    owner_entity: 'CSP-MH-1001',
    retry_count: 0,
    connection_id: 'WM-CON-3050',
    customer_area: 'Vile Parle East',
    proof_bundle: {},
    event_log: [
      {
        timestamp: iso(-5 * HOUR),
        event_type: 'TASK_CREATED',
        actor: 'wiom-scheduler',
        actor_type: 'SYSTEM',
        detail: 'Install order created for WM-CON-3050 in Vile Parle East.',
      },
      {
        timestamp: iso(-4.5 * HOUR),
        event_type: 'OFFERED',
        actor: 'wiom-scheduler',
        actor_type: 'SYSTEM',
        detail: 'Task offered to CSP-MH-1001.',
      },
      {
        timestamp: iso(-4 * HOUR),
        event_type: 'CLAIMED',
        actor: 'CSP-MH-1001',
        actor_type: 'CSP',
        detail: 'CSP claimed the install task.',
      },
      {
        timestamp: iso(-3 * HOUR),
        event_type: 'ACCEPTED',
        actor: 'Ramesh Jadhav',
        actor_type: 'TECHNICIAN',
        detail: 'Technician accepted the delegated task.',
      },
    ],
  },

  // -----------------------------------------------------------------------
  // 12. NETBOX -- ASSIGNED -- normal -- bucket 6
  // -----------------------------------------------------------------------
  {
    task_id: 'TSK-4012',
    task_type: 'NETBOX',
    state: 'ASSIGNED',
    priority: 'NORMAL',
    created_by: 'SYSTEM',
    created_at: iso(-8 * HOUR),
    pickup_due_at: iso(1 * DAY),
    delegation_state: 'ASSIGNED',
    delegation_accept_deadline_at: iso(4 * HOUR),
    assigned_to: 'Suresh Kamble',
    owner_entity: 'CSP-MH-1001',
    retry_count: 0,
    netbox_id: 'NB-MH-0470',
    connection_id: 'WM-CON-2415',
    customer_area: 'Chembur',
    proof_bundle: {},
    event_log: [
      {
        timestamp: iso(-8 * HOUR),
        event_type: 'TASK_CREATED',
        actor: 'wiom-scheduler',
        actor_type: 'SYSTEM',
        detail: 'Netbox pickup required for NB-MH-0470 at Chembur.',
      },
      {
        timestamp: iso(-6 * HOUR),
        event_type: 'ASSIGNED',
        actor: 'CSP-MH-1001',
        actor_type: 'CSP',
        detail: 'Assigned to Suresh Kamble for pickup and return.',
      },
    ],
  },
];

// ---- Assurance state --------------------------------------------------------

const assuranceState: AssuranceState = {
  active_base: 42,
  cycle_earned: 12450,
  next_settlement_amount: 14200,
  next_settlement_date: '2026-02-28',
  sla_standing: 'Compliant',
  exposure_state: 'ELIGIBLE',
  exposure_reason: 'All SLA metrics within threshold for the current cycle.',
  exposure_since: '2025-11-01',
  active_restores: 2,
  unresolved_count: 0,
  capability_reset_active: false,
  active_base_events: [
    { date: iso(-2 * DAY),  change: 1,  connection_id: 'WM-CON-3201', reason: 'New activation verified' },
    { date: iso(-5 * DAY),  change: 1,  connection_id: 'WM-CON-3180', reason: 'New activation verified' },
    { date: iso(-7 * DAY),  change: -1, connection_id: 'WM-CON-2100', reason: 'Customer churn' },
    { date: iso(-10 * DAY), change: 1,  connection_id: 'WM-CON-3150', reason: 'New activation verified' },
    { date: iso(-14 * DAY), change: 1,  connection_id: 'WM-CON-3120', reason: 'New activation verified' },
  ],
  earnings_events: [
    { date: '2026-01-31', amount: 13800, type: 'SETTLEMENT',       reference: 'SETT-2026-01' },
    { date: '2026-01-15', amount: 500,   type: 'BONUS_ACTIVATION', reference: 'BONUS-ACT-0042' },
    { date: '2025-12-31', amount: 12200, type: 'SETTLEMENT',       reference: 'SETT-2025-12' },
    { date: '2025-12-10', amount: 750,   type: 'BONUS_RESTORE',    reference: 'BONUS-RST-0038' },
  ],
};

// ---- Bucket algorithm -------------------------------------------------------

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
      // TTL-expiring or verification-pending items surface here
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

// ---- Sorting ----------------------------------------------------------------

/**
 * Returns the most relevant urgency deadline for a task depending on its type
 * and state. Used as a secondary sort key within each bucket.
 */
function getUrgencyDeadline(task: Task): number {
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

  // Return the nearest future deadline, or Infinity if none
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
    // Primary: bucket
    const bucketA = getBucket(a);
    const bucketB = getBucket(b);
    if (bucketA !== bucketB) return bucketA - bucketB;

    // Secondary: nearest deadline (urgency)
    const urgA = getUrgencyDeadline(a);
    const urgB = getUrgencyDeadline(b);
    if (urgA !== urgB) return urgA - urgB;

    // Tertiary: age (oldest first)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

// ---- CRUD helpers -----------------------------------------------------------

export function getTaskById(id: string): Task | undefined {
  return tasks.find((t) => t.task_id === id);
}

export function getAllTasks(): Task[] {
  return [...tasks];
}

export function getAssuranceState(): AssuranceState {
  return assuranceState;
}

export function updateAssuranceState(updates: Partial<AssuranceState>): void {
  Object.assign(assuranceState, updates);
}

export function getTechnicians(): Technician[] {
  return technicians;
}

export function getTechnicianById(id: string): Technician | undefined {
  return technicians.find((t) => t.id === id);
}

export function getTasksForTechnician(techId: string): Task[] {
  const tech = technicians.find((t) => t.id === techId);
  if (!tech) return [];
  return tasks.filter((t) => t.assigned_to === tech.name);
}

export function getCompletedTasksForTechnician(techId: string): Task[] {
  const terminalStates = ['RESOLVED', 'VERIFIED', 'ACTIVATION_VERIFIED', 'RETURN_CONFIRMED', 'FAILED', 'UNRESOLVED', 'LOST_DECLARED'];
  return getTasksForTechnician(techId).filter((t) => terminalStates.includes(t.state));
}

export function addTechnician(tech: Technician): void {
  technicians.push(tech);
}

export function addTask(task: Task): void {
  tasks.push(task);
}

export function updateTask(id: string, updates: Partial<Task>): void {
  const idx = tasks.findIndex((t) => t.task_id === id);
  if (idx === -1) return;
  tasks[idx] = { ...tasks[idx], ...updates } as Task;
}

export function removeTask(id: string): void {
  const idx = tasks.findIndex((t) => t.task_id === id);
  if (idx !== -1) tasks.splice(idx, 1);
}

/** Alias -- matches the export name expected by consumers */
export const deleteTask = removeTask;

// ---- Wallet seed data -----------------------------------------------------

const walletState: WalletState = {
  balance: 14200,
  pending_settlement: 14200,
  frozen: false,
  transactions: [
    {
      id: 'TXN-001',
      date: iso(-2 * DAY),
      type: 'SETTLEMENT',
      amount: 13800,
      description: 'January 2026 settlement credit',
      status: 'COMPLETED',
    },
    {
      id: 'TXN-002',
      date: iso(-5 * DAY),
      type: 'BONUS',
      amount: 500,
      description: 'Activation bonus -- 5 installs in week',
      status: 'COMPLETED',
    },
    {
      id: 'TXN-003',
      date: iso(-10 * DAY),
      type: 'WITHDRAWAL',
      amount: -10000,
      description: 'Bank transfer to HDFC ***4421',
      status: 'COMPLETED',
    },
    {
      id: 'TXN-004',
      date: iso(-15 * DAY),
      type: 'SETTLEMENT',
      amount: 12200,
      description: 'December 2025 settlement credit',
      status: 'COMPLETED',
    },
    {
      id: 'TXN-005',
      date: iso(-18 * DAY),
      type: 'BONUS',
      amount: 750,
      description: 'Restore SLA bonus -- 100% compliance',
      status: 'COMPLETED',
    },
    {
      id: 'TXN-006',
      date: iso(0),
      type: 'SETTLEMENT',
      amount: 14200,
      description: 'February 2026 settlement -- pending',
      status: 'PENDING',
    },
  ],
};

// ---- Support cases seed data ----------------------------------------------

const supportCases: SupportCase[] = [
  {
    case_id: 'SUP-001',
    subject: 'Settlement amount mismatch for January 2026',
    status: 'OPEN',
    created_at: iso(-3 * DAY),
    updated_at: iso(-1 * DAY),
    messages: [
      {
        sender: 'CSP-MH-1001',
        text: 'My January settlement shows 13,800 but I expected 14,300 based on 43 active connections.',
        timestamp: iso(-3 * DAY),
      },
      {
        sender: 'Wiom Support',
        text: 'We are reviewing the discrepancy. One connection (WM-CON-2100) churned mid-cycle which adjusted the amount.',
        timestamp: iso(-1 * DAY),
      },
    ],
  },
  {
    case_id: 'SUP-002',
    subject: 'Netbox NB-MH-0455 return confirmation delayed',
    status: 'IN_PROGRESS',
    created_at: iso(-5 * DAY),
    updated_at: iso(-2 * DAY),
    linked_task_id: 'TSK-4006',
    messages: [
      {
        sender: 'CSP-MH-1001',
        text: 'Netbox was returned to warehouse 3 days ago but status still shows COLLECTED.',
        timestamp: iso(-5 * DAY),
      },
      {
        sender: 'Wiom Support',
        text: 'We have escalated to the warehouse team. Expect status update within 24 hours.',
        timestamp: iso(-3 * DAY),
      },
      {
        sender: 'Wiom Support',
        text: 'Warehouse confirmed receipt. Updating status shortly.',
        timestamp: iso(-2 * DAY),
      },
    ],
  },
  {
    case_id: 'SUP-003',
    subject: 'Technician band upgrade request for Suresh Kamble',
    status: 'RESOLVED',
    created_at: iso(-14 * DAY),
    updated_at: iso(-7 * DAY),
    messages: [
      {
        sender: 'CSP-MH-1001',
        text: 'Requesting band upgrade from B to A for Suresh Kamble based on performance.',
        timestamp: iso(-14 * DAY),
      },
      {
        sender: 'Wiom Support',
        text: 'Band upgrade approved. Effective next cycle.',
        timestamp: iso(-7 * DAY),
      },
    ],
  },
];

// ---- Notification queue ---------------------------------------------------

const notifications: AppNotification[] = [];

// ---- Wallet helpers -------------------------------------------------------

export function getWalletState(): WalletState {
  return walletState;
}

export function updateWalletState(updates: Partial<WalletState>): void {
  Object.assign(walletState, updates);
}

export function addWalletTransaction(txn: WalletTransaction): void {
  walletState.transactions.unshift(txn);
}

// ---- Support case helpers -------------------------------------------------

export function getSupportCases(): SupportCase[] {
  return supportCases;
}

export function addSupportCase(c: SupportCase): void {
  supportCases.push(c);
}

// ---- Notification helpers -------------------------------------------------

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
