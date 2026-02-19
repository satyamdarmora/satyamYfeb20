// ---------------------------------------------------------------------------
// Wiom CSP App -- Core Type Definitions
// ---------------------------------------------------------------------------

// ---- Enumerations (expressed as union types) --------------------------------

export type TaskType = 'INSTALL' | 'RESTORE' | 'NETBOX';

export type TaskPriority = 'HIGH' | 'NORMAL';

export type CreatedBy = 'SYSTEM' | 'MANUAL_EXCEPTION';

// Per-workflow state machines
export type InstallState =
  | 'OFFERED'
  | 'CLAIMED'
  | 'ACCEPTED'
  | 'SCHEDULED'
  | 'INSTALLED'
  | 'ACTIVATION_VERIFIED'
  | 'FAILED';

export type RestoreState =
  | 'ALERTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'VERIFIED'
  | 'UNRESOLVED';

export type NetboxState =
  | 'PICKUP_REQUIRED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COLLECTED'
  | 'RETURN_CONFIRMED'
  | 'LOST_DECLARED';

// Delegation lifecycle
export type DelegationState =
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'DONE';

// Escalation flags surfaced in the queue
export type EscalationFlag =
  | 'BLOCKED_STALE'
  | 'RETURN_OVERDUE'
  | 'VERIFICATION_PENDING'
  | 'CHAIN_ESCALATION_PENDING'
  | 'CLAIM_TTL_EXPIRING'
  | 'OFFER_TTL_EXPIRING'
  | 'RESTORE_RETRY'
  | 'INSTALL_OVERDUE'
  | 'PICKUP_OVERDUE'
  | 'MANUAL_EXCEPTION'
  | 'ASSIGNMENT_UNACCEPTED';

// ---- Core Entities ----------------------------------------------------------

export interface TimelineEvent {
  timestamp: string;        // ISO-8601
  event_type: string;
  actor: string;
  actor_type: 'SYSTEM' | 'CSP' | 'ADMIN' | 'TECHNICIAN';
  detail: string;
  proof?: string;
}

export interface Task {
  task_id: string;
  task_type: TaskType;
  state: string;            // One of Install / Restore / Netbox states
  priority: TaskPriority;
  created_by: CreatedBy;
  created_at: string;       // ISO-8601
  due_at?: string;
  sla_deadline_at?: string;
  offer_expires_at?: string;
  accept_expires_at?: string;
  return_due_at?: string;
  pickup_due_at?: string;
  blocked_due_at?: string;
  delegation_state: DelegationState;
  delegation_accept_deadline_at?: string;
  assigned_to?: string;     // Technician name
  owner_entity: string;     // CSP id
  queue_escalation_flag?: EscalationFlag;
  retry_count: number;
  chain_id?: string;
  connection_id?: string;
  netbox_id?: string;
  customer_area?: string;
  blocked_reason?: string;
  proof_bundle: Record<string, string>;
  event_log: TimelineEvent[];
}

// ---- Assurance / Settlement -------------------------------------------------

export interface BaseEvent {
  date: string;
  change: number;
  connection_id: string;
  reason: string;
}

export interface EarningsEvent {
  date: string;
  amount: number;
  type: string;
  reference: string;
}

export interface AssuranceState {
  active_base: number;
  cycle_earned: number;
  next_settlement_amount: number;
  next_settlement_date: string;
  sla_standing: 'Compliant' | 'At Risk' | 'Non-Compliant';
  exposure_state: 'ELIGIBLE' | 'LIMITED' | 'INELIGIBLE';
  exposure_reason: string;
  exposure_since: string;
  active_base_events: BaseEvent[];
  earnings_events: EarningsEvent[];
  active_restores: number;
  unresolved_count: number;
  capability_reset_active: boolean;
  capability_reset_reason?: string;
}

// ---- Technicians ------------------------------------------------------------

export interface Technician {
  id: string;
  name: string;
  band: 'A' | 'B' | 'C';
  available: boolean;
  csp_id: string;
  phone: string;
  join_date: string;
  completed_count: number;
}

export interface TechnicianAuth {
  tech_id: string;
  logged_in: boolean;
}

// ---- Queue Bucket -----------------------------------------------------------

export type QueueBucket = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// ---- Wallet ---------------------------------------------------------------
export interface WalletTransaction {
  id: string;
  date: string;
  type: 'SETTLEMENT' | 'BONUS' | 'WITHDRAWAL' | 'TOP_UP' | 'DEDUCTION';
  amount: number;
  description: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export interface WalletState {
  balance: number;
  pending_settlement: number;
  transactions: WalletTransaction[];
  frozen: boolean;
  frozen_reason?: string;
}

// ---- Support Cases --------------------------------------------------------
export interface SupportCase {
  case_id: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  updated_at: string;
  linked_task_id?: string;
  messages: { sender: string; text: string; timestamp: string }[];
}

// ---- Notifications / Event Modals ----------------------------------------
export type NotificationType = 'PAYMENT_RECEIVED' | 'SETTLEMENT_CREDIT' | 'NEW_OFFER' | 'HIGH_RESTORE_ALERT' | 'SLA_WARNING' | 'GENERAL' | 'CAPABILITY_RESET' | 'WALLET_FROZEN' | 'NETBOX_RECOVERY_DEDUCTION';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  amount?: number;
  task_id?: string;
  timestamp: string;
  dismissed: boolean;
}
