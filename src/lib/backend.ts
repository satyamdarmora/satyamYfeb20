/**
 * Backend API client for NestJS backend.
 * Handles auth forwarding and response unwrapping.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

interface BackendResponse<T = any> {
  status: number; // 0 = success, 1 = error
  msg: string;
  data: T;
}

export async function backendGet<T = any>(
  path: string,
  authHeader?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authHeader) headers['Authorization'] = authHeader;

  const res = await fetch(`${BACKEND_URL}${path}`, { headers, cache: 'no-store' });
  const body: BackendResponse<T> = await res.json();

  if (body.status !== 0) {
    throw new Error(body.msg || 'Backend error');
  }
  return body.data;
}

export async function backendPost<T = any>(
  path: string,
  data: any,
  authHeader?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authHeader) headers['Authorization'] = authHeader;

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const body: BackendResponse<T> = await res.json();

  if (body.status !== 0) {
    throw new Error(body.msg || 'Backend error');
  }
  return body.data;
}

export async function backendPut<T = any>(
  path: string,
  data: any,
  authHeader?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authHeader) headers['Authorization'] = authHeader;

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const body: BackendResponse<T> = await res.json();

  if (body.status !== 0) {
    throw new Error(body.msg || 'Backend error');
  }
  return body.data;
}

// ── Data Shape Transformers (camelCase DB → snake_case frontend) ──

function toIso(d: string | Date | null | undefined): string | undefined {
  if (!d) return undefined;
  return typeof d === 'string' ? d : new Date(d).toISOString();
}

const SLA_STANDING_MAP: Record<string, string> = {
  COMPLIANT: 'Compliant',
  AT_RISK: 'At Risk',
  NON_COMPLIANT: 'Non-Compliant',
};

export function transformTask(t: any): any {
  return {
    task_id: `TSK-${String(t.id).padStart(4, '0')}`,
    task_type: t.taskType,
    state: t.state,
    priority: t.priority,
    created_by: t.createdBy,
    created_at: toIso(t.createdAt),
    due_at: toIso(t.dueAt),
    sla_deadline_at: toIso(t.slaDeadlineAt),
    offer_expires_at: toIso(t.offerExpiresAt),
    accept_expires_at: toIso(t.acceptExpiresAt),
    return_due_at: toIso(t.returnDueAt),
    pickup_due_at: toIso(t.pickupDueAt),
    blocked_due_at: toIso(t.blockedDueAt),
    delegation_state: t.delegationState,
    delegation_accept_deadline_at: toIso(t.delegationAcceptDeadlineAt),
    assigned_to: t.assignedTo?.name || undefined,
    owner_entity: `CSP-${String(t.partnerId).padStart(4, '0')}`,
    queue_escalation_flag: t.queueEscalationFlag || undefined,
    retry_count: t.retryCount || 0,
    chain_id: t.chainId || undefined,
    connection_id: t.connectionId || undefined,
    netbox_id: t.netboxId || undefined,
    customer_area: t.customerArea || undefined,
    blocked_reason: t.blockedReason || undefined,
    proof_bundle: t.proofBundle || {},
    event_log: (t.timelineEvents || []).map((e: any) => ({
      timestamp: toIso(e.timestamp),
      event_type: e.eventType,
      actor: e.actor,
      actor_type: e.actorType,
      detail: e.detail || '',
      proof: e.proof || undefined,
    })),
  };
}

export function transformTechnician(t: any): any {
  return {
    id: `TECH-${String(t.id).padStart(3, '0')}`,
    name: t.name,
    band: t.band,
    available: t.available,
    csp_id: `CSP-${String(t.partnerId).padStart(4, '0')}`,
    phone: t.phone,
    join_date: toIso(t.joinDate),
    completed_count: t.completedCount,
  };
}

export function transformAssurance(a: any): any {
  const events = a.events || [];
  const baseEvents = events
    .filter((e: any) => e.eventType === 'BASE_CHANGE')
    .map((e: any) => ({
      date: toIso(e.eventDate),
      change: e.change,
      connection_id: e.connectionId || '',
      reason: e.reason || '',
    }));
  const earningsEvents = events
    .filter((e: any) => e.eventType === 'EARNING')
    .map((e: any) => ({
      date: toIso(e.eventDate),
      amount: e.amount,
      type: e.earningType,
      reference: e.reference || '',
    }));

  return {
    active_base: a.activeBase,
    cycle_earned: a.cycleEarned,
    next_settlement_amount: a.nextSettlementAmount,
    next_settlement_date: toIso(a.nextSettlementDate),
    sla_standing: SLA_STANDING_MAP[a.slaStanding] || a.slaStanding,
    exposure_state: a.exposureState,
    exposure_reason: a.exposureReason || '',
    exposure_since: toIso(a.exposureSince) || '',
    active_base_events: baseEvents,
    earnings_events: earningsEvents,
    active_restores: a.activeRestores,
    unresolved_count: a.unresolvedCount,
    capability_reset_active: a.capabilityResetActive,
    capability_reset_reason: a.capabilityResetReason || undefined,
  };
}

export function transformWallet(w: any): any {
  return {
    balance: w.balance,
    pending_settlement: w.pendingSettlement,
    frozen: w.frozen,
    frozen_reason: w.frozenReason || undefined,
    transactions: (w.transactions || []).map((t: any) => ({
      id: `TXN-${String(t.id).padStart(4, '0')}`,
      date: toIso(t.transactionDate),
      type: t.type,
      amount: t.amount,
      description: t.description,
      status: t.status,
    })),
  };
}

export function transformSupportCase(c: any): any {
  return {
    case_id: `SUP-${String(c.id).padStart(3, '0')}`,
    subject: c.subject,
    status: c.status,
    created_at: toIso(c.createdAt),
    updated_at: toIso(c.updatedAt),
    linked_task_id: c.linkedTaskId
      ? `TSK-${String(c.linkedTaskId).padStart(4, '0')}`
      : undefined,
    messages: (c.messages || []).map((m: any) => ({
      sender: m.sender,
      text: m.text,
      timestamp: toIso(m.timestamp),
    })),
  };
}

export function transformNotification(n: any): any {
  return {
    id: `NOTIF-${String(n.id).padStart(4, '0')}`,
    type: n.type,
    title: n.title,
    message: n.message,
    amount: n.amount || undefined,
    task_id: n.taskId
      ? `TSK-${String(n.taskId).padStart(4, '0')}`
      : undefined,
    timestamp: toIso(n.timestamp),
    dismissed: n.dismissed,
  };
}
