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
  DepositLedger,
  DepositTransaction,
  NetBoxUnit,
  RateCard,
  SLAOverallState,
  SLADomain,
  SLAConsequence,
  SLAStateTransition,
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
  // Sync SLA standing from the 4-domain state engine (single source of truth)
  assuranceState.sla_standing = getSLAState().overall_standing;
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

// ---- Rate Card ------------------------------------------------------------

const rateCard: RateCard = {
  version: '1.0',
  effective_from: '2026-01-01',
  base_payout_per_recharge: 85,
  short_duration_payout: 45,
  install_handling_fee: 150,
  collection_handling_fee: 100,
  bonus_tiers: [
    { tier: 'Good',      quality_band: 'Meets minimum stability threshold', multiplier_percent: 5  },
    { tier: 'Very Good', quality_band: 'Above defined band',                multiplier_percent: 10 },
    { tier: 'Excellent', quality_band: 'Top defined band',                  multiplier_percent: 15 },
  ],
  security_deposit_per_netbox: 1500,
  replacement_cost: 1500,
  carry_fee_per_day: 2,
  carry_fee_grace_days: 15,
  withdrawal_cycle: 'Weekly',
  min_withdrawal: 500,
};

// ---- NetBox Inventory & Deposit Ledger ------------------------------------

const netboxUnits: NetBoxUnit[] = [
  // Active with customer -- healthy
  { netbox_id: 'NB-MH-0440', connection_id: 'WM-CON-2650', customer_area: 'Goregaon East',    status: 'WITH_CUSTOMER', issued_at: iso(-90 * DAY), subscription_expiry_at: iso(30 * DAY), carry_fee_eligible: false, carry_fee_accrued: 0, days_past_expiry: 0 },
  { netbox_id: 'NB-MH-0441', connection_id: 'WM-CON-2780', customer_area: 'Malad West',       status: 'WITH_CUSTOMER', issued_at: iso(-60 * DAY), subscription_expiry_at: iso(15 * DAY), carry_fee_eligible: false, carry_fee_accrued: 0, days_past_expiry: 0 },
  { netbox_id: 'NB-MH-0442', connection_id: 'WM-CON-2845', customer_area: 'Andheri West',     status: 'WITH_CUSTOMER', issued_at: iso(-45 * DAY), subscription_expiry_at: iso(20 * DAY), carry_fee_eligible: false, carry_fee_accrued: 0, days_past_expiry: 0 },
  { netbox_id: 'NB-MH-0443', connection_id: 'WM-CON-2901', customer_area: 'Powai',            status: 'WITH_CUSTOMER', issued_at: iso(-30 * DAY), subscription_expiry_at: iso(25 * DAY), carry_fee_eligible: false, carry_fee_accrued: 0, days_past_expiry: 0 },
  // Expired with customer -- past grace, carry fee accruing
  { netbox_id: 'NB-MH-0450', connection_id: 'WM-CON-2390', customer_area: 'Borivali East',    status: 'EXPIRED_WITH_CUSTOMER', issued_at: iso(-120 * DAY), subscription_expiry_at: iso(-25 * DAY), carry_fee_eligible: true, carry_fee_start_at: iso(-10 * DAY), carry_fee_accrued: 20, days_past_expiry: 25 },
  // Expired with customer -- within grace, no carry fee yet
  { netbox_id: 'NB-MH-0451', connection_id: 'WM-CON-2510', customer_area: 'Jogeshwari West',  status: 'EXPIRED_WITH_CUSTOMER', issued_at: iso(-100 * DAY), subscription_expiry_at: iso(-10 * DAY), carry_fee_eligible: false, carry_fee_accrued: 0, days_past_expiry: 10 },
  // Collected, in transit back to warehouse
  { netbox_id: 'NB-MH-0455', connection_id: 'WM-CON-2510', customer_area: 'Jogeshwari West',  status: 'COLLECTED_IN_TRANSIT', issued_at: iso(-110 * DAY), subscription_expiry_at: iso(-20 * DAY), collected_at: iso(-2 * DAY), carry_fee_eligible: false, carry_fee_start_at: iso(-5 * DAY), carry_fee_accrued: 6, days_past_expiry: 20 },
  // In warehouse (returned successfully)
  { netbox_id: 'NB-MH-0430', connection_id: 'WM-CON-2100', customer_area: 'Dadar West',       status: 'IN_WAREHOUSE', issued_at: iso(-180 * DAY), subscription_expiry_at: iso(-60 * DAY), returned_at: iso(-45 * DAY), carry_fee_eligible: false, carry_fee_accrued: 0, days_past_expiry: 0 },
  // Lost unit
  { netbox_id: 'NB-MH-0420', connection_id: 'WM-CON-1980', customer_area: 'Worli',            status: 'LOST', issued_at: iso(-200 * DAY), subscription_expiry_at: iso(-90 * DAY), lost_declared_at: iso(-60 * DAY), carry_fee_eligible: false, carry_fee_accrued: 0, days_past_expiry: 0 },
  // Damaged unit
  { netbox_id: 'NB-MH-0425', connection_id: 'WM-CON-2050', customer_area: 'Parel',            status: 'DAMAGED', issued_at: iso(-150 * DAY), subscription_expiry_at: iso(-40 * DAY), returned_at: iso(-30 * DAY), carry_fee_eligible: false, carry_fee_accrued: 0, days_past_expiry: 0 },
];

const depositTransactions: DepositTransaction[] = [
  { id: 'DEP-001', date: iso(-200 * DAY), type: 'DEPOSIT_COLLECTED', amount: 1500,  netbox_id: 'NB-MH-0420', description: 'Security deposit collected -- NB-MH-0420' },
  { id: 'DEP-002', date: iso(-180 * DAY), type: 'DEPOSIT_COLLECTED', amount: 1500,  netbox_id: 'NB-MH-0430', description: 'Security deposit collected -- NB-MH-0430' },
  { id: 'DEP-003', date: iso(-150 * DAY), type: 'DEPOSIT_COLLECTED', amount: 1500,  netbox_id: 'NB-MH-0425', description: 'Security deposit collected -- NB-MH-0425' },
  { id: 'DEP-004', date: iso(-120 * DAY), type: 'DEPOSIT_COLLECTED', amount: 1500,  netbox_id: 'NB-MH-0450', description: 'Security deposit collected -- NB-MH-0450' },
  { id: 'DEP-005', date: iso(-110 * DAY), type: 'DEPOSIT_COLLECTED', amount: 1500,  netbox_id: 'NB-MH-0455', description: 'Security deposit collected -- NB-MH-0455' },
  { id: 'DEP-006', date: iso(-100 * DAY), type: 'DEPOSIT_COLLECTED', amount: 1500,  netbox_id: 'NB-MH-0451', description: 'Security deposit collected -- NB-MH-0451' },
  { id: 'DEP-007', date: iso(-90 * DAY),  type: 'DEPOSIT_COLLECTED', amount: 1500,  netbox_id: 'NB-MH-0440', description: 'Security deposit collected -- NB-MH-0440' },
  { id: 'DEP-008', date: iso(-60 * DAY),  type: 'DEPOSIT_COLLECTED', amount: 1500,  netbox_id: 'NB-MH-0441', description: 'Security deposit collected -- NB-MH-0441' },
  { id: 'DEP-009', date: iso(-45 * DAY),  type: 'DEPOSIT_COLLECTED', amount: 1500,  netbox_id: 'NB-MH-0442', description: 'Security deposit collected -- NB-MH-0442' },
  { id: 'DEP-010', date: iso(-30 * DAY),  type: 'DEPOSIT_COLLECTED', amount: 1500,  netbox_id: 'NB-MH-0443', description: 'Security deposit collected -- NB-MH-0443' },
  // Loss deduction
  { id: 'DEP-011', date: iso(-60 * DAY),  type: 'LOSS_DEDUCTION',    amount: -1500, netbox_id: 'NB-MH-0420', description: 'Loss recovery -- NB-MH-0420 declared lost' },
  // Damage deduction
  { id: 'DEP-012', date: iso(-30 * DAY),  type: 'DAMAGE_DEDUCTION',  amount: -800,  netbox_id: 'NB-MH-0425', description: 'Damage repair cost -- NB-MH-0425' },
  // Refund for returned unit
  { id: 'DEP-013', date: iso(-45 * DAY),  type: 'DEPOSIT_REFUND',    amount: -1500, netbox_id: 'NB-MH-0430', description: 'Deposit refund -- NB-MH-0430 returned' },
];

function computeDepositLedger(): DepositLedger {
  const securityPerUnit = rateCard.security_deposit_per_netbox;
  const activeStatuses: NetBoxUnit['status'][] = ['WITH_CUSTOMER', 'EXPIRED_WITH_CUSTOMER', 'COLLECTED_IN_TRANSIT'];
  const activeUnits = netboxUnits.filter((u) => activeStatuses.includes(u.status));
  const lostUnits = netboxUnits.filter((u) => u.status === 'LOST');
  const returnedUnits = netboxUnits.filter((u) => u.status === 'IN_WAREHOUSE');
  const totalLossDeductions = lostUnits.length * rateCard.replacement_cost;
  const damageDeductions = depositTransactions
    .filter((t) => t.type === 'DAMAGE_DEDUCTION')
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const refunds = depositTransactions
    .filter((t) => t.type === 'DEPOSIT_REFUND')
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalCollected = netboxUnits.length * securityPerUnit;
  const depositBalance = totalCollected - totalLossDeductions - damageDeductions - refunds;
  const exitRefund = (activeUnits.length * securityPerUnit) - (lostUnits.length * rateCard.replacement_cost) - damageDeductions;

  return {
    security_deposit_per_unit: securityPerUnit,
    replacement_cost: rateCard.replacement_cost,
    carry_fee_per_day: rateCard.carry_fee_per_day,
    carry_fee_grace_days: rateCard.carry_fee_grace_days,
    total_issued: netboxUnits.length,
    total_returned: returnedUnits.length,
    total_lost: lostUnits.length,
    total_active: activeUnits.length,
    deposit_balance: depositBalance,
    total_loss_deductions: totalLossDeductions,
    exit_refund_estimate: Math.max(0, exitRefund),
    transactions: depositTransactions,
    units: netboxUnits,
  };
}

// ---- Wallet carry fee & loss recovery seed transactions -------------------
// These go into the existing wallet transactions array
const carryFeeAndLossTxns: WalletTransaction[] = [
  {
    id: 'TXN-CF-001',
    date: iso(-1 * DAY),
    type: 'CARRY_FEE',
    amount: -20,
    description: 'Carry fee -- NB-MH-0450 (10 days x ₹2/day)',
    status: 'COMPLETED',
  },
  {
    id: 'TXN-CF-002',
    date: iso(-2 * DAY),
    type: 'CARRY_FEE',
    amount: -6,
    description: 'Carry fee -- NB-MH-0455 (3 days x ₹2/day)',
    status: 'COMPLETED',
  },
  {
    id: 'TXN-IH-001',
    date: iso(-5 * DAY),
    type: 'INSTALL_HANDLING',
    amount: 150,
    description: 'Install handling fee -- WM-CON-2650',
    status: 'COMPLETED',
  },
  {
    id: 'TXN-CH-001',
    date: iso(-3 * DAY),
    type: 'COLLECTION_HANDLING',
    amount: 100,
    description: 'Collection handling fee -- NB-MH-0455',
    status: 'COMPLETED',
  },
];

// ---- Wallet helpers -------------------------------------------------------

// Inject carry fee / handling txns into wallet on first access
let walletSeeded = false;
function seedWalletExtras() {
  if (walletSeeded) return;
  walletSeeded = true;
  walletState.transactions.push(...carryFeeAndLossTxns);
  // Adjust balance for carry fee debits
  const cfTotal = carryFeeAndLossTxns.reduce((s, t) => s + t.amount, 0);
  walletState.balance += cfTotal;
}

export function getWalletState(): WalletState {
  seedWalletExtras();
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

// ---- Rate Card helpers ----------------------------------------------------

export function getRateCard(): RateCard {
  return rateCard;
}

// ---- Deposit & NetBox Inventory helpers -----------------------------------

export function getDepositLedger(): DepositLedger {
  return computeDepositLedger();
}

export function getNetBoxUnits(): NetBoxUnit[] {
  return netboxUnits;
}

export function getNetBoxUnitById(id: string): NetBoxUnit | undefined {
  return netboxUnits.find((u) => u.netbox_id === id);
}

export function updateNetBoxUnit(id: string, updates: Partial<NetBoxUnit>): void {
  const idx = netboxUnits.findIndex((u) => u.netbox_id === id);
  if (idx !== -1) {
    netboxUnits[idx] = { ...netboxUnits[idx], ...updates } as NetBoxUnit;
  }
}

export function addNetBoxUnit(unit: NetBoxUnit): void {
  netboxUnits.push(unit);
}

export function addDepositTransaction(txn: DepositTransaction): void {
  depositTransactions.push(txn);
}

export function getDepositTransactions(): DepositTransaction[] {
  return depositTransactions;
}

// ---- SLA Framework (4-Domain State Engine) --------------------------------

// Domain-level state computation helper
function computeDomainState(domain: SLADomain): 'Compliant' | 'At Risk' | 'Non-Compliant' {
  let anyBelowMin = false;
  let anySevere = false;

  for (const m of domain.sub_metrics) {
    if (m.sample_count < m.min_sample) continue; // skip if insufficient sample
    const breached = m.threshold_direction === 'above'
      ? m.value < m.threshold
      : m.value > m.threshold;
    const severe = m.threshold_direction === 'above'
      ? m.value < m.severe_threshold
      : m.value > m.severe_threshold;
    if (severe) anySevere = true;
    if (breached) anyBelowMin = true;
  }

  if (anySevere) return 'Non-Compliant';
  if (anyBelowMin) return 'At Risk';
  return 'Compliant';
}

// Compute overall SLA state from domain pattern
function computeOverallStanding(domains: SLADomain[]): 'Compliant' | 'At Risk' | 'Non-Compliant' {
  const states = domains.map((d) => d.state);
  if (states.includes('Non-Compliant')) return 'Non-Compliant';
  const atRiskCount = states.filter((s) => s === 'At Risk').length;
  if (atRiskCount >= 2) return 'Non-Compliant'; // 2+ domains at risk = non-compliant
  if (atRiskCount >= 1) return 'At Risk';
  return 'Compliant';
}

function getConsequence(standing: 'Compliant' | 'At Risk' | 'Non-Compliant'): SLAConsequence {
  switch (standing) {
    case 'Compliant':
      return { routing: 'Full', bonus_eligibility: 'Eligible', enablement: 'None' };
    case 'At Risk':
      return { routing: 'Graduated taper', bonus_eligibility: 'Bonus pause', enablement: 'Available' };
    case 'Non-Compliant':
      return { routing: 'Significant taper', bonus_eligibility: 'Bonus removal', enablement: 'Mandatory' };
  }
}

// Seed SLA domains with realistic data
// Scenario: CSP is "At Risk" because Domain 2 (Service Resolution) is breaching
const slaDomains: SLADomain[] = [
  // DOMAIN 1 — Installation Integrity
  {
    id: 'installation',
    name: 'Installation Integrity',
    purpose: 'Protect connection creation and early trust',
    state: 'Compliant',
    control_level: 'High',
    consequence_type: 'Economic + Enablement',
    sub_metrics: [
      {
        id: 'install_ontime',
        name: '% On-Time Install',
        value: 88,
        unit: '%',
        threshold: 80,
        severe_threshold: 65,
        threshold_direction: 'above',
        trend: 'stable',
        window_days: 30,
        sample_count: 17,
        min_sample: 5,
      },
      {
        id: 'early_failure',
        name: '% Early Failure Rate',
        value: 6,
        unit: '%',
        threshold: 15,
        severe_threshold: 25,
        threshold_direction: 'below',
        trend: 'improving',
        window_days: 30,
        sample_count: 17,
        min_sample: 5,
      },
    ],
  },
  // DOMAIN 2 — Service Resolution (BREACHING)
  {
    id: 'resolution',
    name: 'Service Resolution',
    purpose: 'Protect recovery trust when issues occur',
    state: 'At Risk',
    control_level: 'Moderate-High',
    consequence_type: 'Economic + Enablement',
    sub_metrics: [
      {
        id: 'resolved_in_sla',
        name: '% Not Resolved Within SLA Window (4h)',
        value: 22,
        unit: '%',
        threshold: 15,
        severe_threshold: 30,
        threshold_direction: 'below',
        trend: 'declining',
        window_days: 30,
        sample_count: 41,
        min_sample: 10,
      },
      {
        id: 'long_unresolved',
        name: '% Long-Unresolved Complaints (24h)',
        value: 8,
        unit: '%',
        threshold: 10,
        severe_threshold: 20,
        threshold_direction: 'below',
        trend: 'stable',
        window_days: 30,
        sample_count: 41,
        min_sample: 10,
      },
    ],
  },
  // DOMAIN 3 — Service Stability
  {
    id: 'stability',
    name: 'Service Stability',
    purpose: 'Protect ongoing service continuity',
    state: 'Compliant',
    control_level: 'Mixed',
    consequence_type: 'Routing + Enablement',
    sub_metrics: [
      {
        id: 'uptime',
        name: '% Uptime (Rolling Window)',
        value: 98.7,
        unit: '%',
        threshold: 98,
        severe_threshold: 95,
        threshold_direction: 'above',
        trend: 'stable',
        window_days: 30,
        sample_count: 45,
        min_sample: 20,
      },
      {
        id: 'speed_latency',
        name: 'Speed / Latency Compliance Band',
        value: 92,
        unit: '%',
        threshold: 85,
        severe_threshold: 70,
        threshold_direction: 'above',
        trend: 'improving',
        window_days: 30,
        sample_count: 45,
        min_sample: 20,
      },
    ],
  },
  // DOMAIN 4 — Complaint & Experience Signals
  {
    id: 'experience',
    name: 'Complaint & Experience Signals',
    purpose: 'Detect dissatisfaction trends beyond raw uptime',
    state: 'Compliant',
    control_level: 'Mixed',
    consequence_type: 'Routing + Enablement',
    sub_metrics: [
      {
        id: 'complaint_ratio',
        name: 'Complaint Ratio (per 100 connections)',
        value: 4.2,
        unit: 'ratio',
        threshold: 8,
        severe_threshold: 15,
        threshold_direction: 'below',
        trend: 'stable',
        window_days: 30,
        sample_count: 45,
        min_sample: 20,
      },
      {
        id: 'repeat_complaint',
        name: '% Repeat Complaint Ratio',
        value: 2.1,
        unit: '%',
        threshold: 5,
        severe_threshold: 10,
        threshold_direction: 'below',
        trend: 'improving',
        window_days: 30,
        sample_count: 45,
        min_sample: 20,
      },
    ],
  },
];

// Compute domain states
slaDomains.forEach((d) => {
  d.state = computeDomainState(d);
});

const slaStateHistory: SLAStateTransition[] = [
  { from: 'Compliant', to: 'Compliant', date: iso(-90 * DAY), reason: 'All domains compliant — quarterly review' },
  { from: 'Compliant', to: 'Compliant', date: iso(-60 * DAY), reason: 'All domains compliant — monthly evaluation' },
  { from: 'Compliant', to: 'At Risk', date: iso(-12 * DAY), reason: 'Domain 2 (Service Resolution): % Not Resolved Within SLA Window breached minimum threshold (22% > 15%)' },
];

const overallStanding = computeOverallStanding(slaDomains);
const consequence = getConsequence(overallStanding);

function getHysteresis(standing: 'Compliant' | 'At Risk' | 'Non-Compliant') {
  switch (standing) {
    case 'Compliant':
      return { upgrade_requirement: 'Already at highest state', current_clean_windows: 2, required_clean_windows: 0 };
    case 'At Risk':
      return { upgrade_requirement: '1 full clean evaluation window with no breaches to return to Compliant', current_clean_windows: 0, required_clean_windows: 1 };
    case 'Non-Compliant':
      return { upgrade_requirement: '2 consecutive clean windows to return to Compliant (1 clean window for At Risk)', current_clean_windows: 0, required_clean_windows: 2 };
  }
}

const slaOverallState: SLAOverallState = {
  overall_standing: overallStanding,
  domains: slaDomains,
  consequence,
  state_since: iso(-12 * DAY),
  windows_in_current_state: 1,
  evaluation_window_days: 30,
  next_evaluation: iso(18 * DAY),
  state_history: slaStateHistory,
  hysteresis: getHysteresis(overallStanding),
};

export function getSLAState(): SLAOverallState {
  // Recompute domain states dynamically
  slaDomains.forEach((d) => {
    d.state = computeDomainState(d);
  });
  const standing = computeOverallStanding(slaDomains);
  slaOverallState.overall_standing = standing;
  slaOverallState.consequence = getConsequence(standing);
  slaOverallState.hysteresis = getHysteresis(standing);
  return slaOverallState;
}

export function updateSLAMetric(domainId: string, metricId: string, value: number): void {
  const domain = slaDomains.find((d) => d.id === domainId);
  if (!domain) return;
  const metric = domain.sub_metrics.find((m) => m.id === metricId);
  if (!metric) return;
  metric.value = value;
}
