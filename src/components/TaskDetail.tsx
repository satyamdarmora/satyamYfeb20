'use client';

import { useMemo, useState } from 'react';
import type { Task, TimelineEvent } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

interface TaskDetailProps {
  task: Task;
  onBack: () => void;
  onAction: (taskId: string, action: string, extra?: Record<string, string>) => void;
}

/** Task type badge colors from brand palette */
function getBadgeBackground(taskType: string): string {
  switch (taskType) {
    case 'INSTALL':
      return 'var(--brand-subtle)';
    case 'RESTORE':
      return 'var(--restore-subtle)';
    case 'NETBOX':
      return 'var(--gold-subtle)';
    default:
      return 'rgba(92, 111, 130, 0.15)';
  }
}

function getBadgeColor(taskType: string): string {
  switch (taskType) {
    case 'INSTALL':
      return 'var(--brand-primary)';
    case 'RESTORE':
      return 'var(--accent-restore)';
    case 'NETBOX':
      return 'var(--accent-gold)';
    default:
      return 'var(--text-muted)';
  }
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFullTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getActorColor(actorType: string): string {
  switch (actorType) {
    case 'SYSTEM':
      return 'var(--text-muted)';
    case 'CSP':
      return 'var(--brand-primary)';
    case 'ADMIN':
      return 'var(--warning)';
    case 'TECHNICIAN':
      return 'var(--positive)';
    default:
      return 'var(--text-secondary)';
  }
}

function isInTechnicianHands(task: Task): boolean {
  if (
    task.assigned_to &&
    ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(task.delegation_state) &&
    ['ASSIGNED', 'IN_PROGRESS', 'SCHEDULED'].includes(task.state)
  ) {
    return true;
  }
  return false;
}

function isSelfAssigned(task: Task): boolean {
  return isInTechnicianHands(task) && !!task.assigned_to && task.assigned_to.startsWith('Self');
}

function getCTA(task: Task): { label: string; action: string; urgent: boolean } | null {
  const state = task.state;
  const flag = task.queue_escalation_flag;

  // Terminal states: no CTA
  if (['ACTIVATION_VERIFIED', 'VERIFIED', 'RETURN_CONFIRMED', 'LOST_DECLARED', 'FAILED', 'RESOLVED', 'UNRESOLVED'].includes(state)) {
    return null;
  }

  // OFFERED tasks handled separately in detail view
  if (state === 'OFFERED') return null;

  // Self-assigned: step-by-step progression per task type
  if (isSelfAssigned(task)) {
    if (task.task_type === 'INSTALL') {
      if (state === 'SCHEDULED' || state === 'ASSIGNED') return { label: 'Start Work', action: 'START_WORK', urgent: false };
      if (state === 'IN_PROGRESS') return { label: 'Mark Installed', action: 'INSTALL', urgent: false };
      // INSTALLED handled below (Verify Manually)
    } else if (task.task_type === 'RESTORE') {
      if (state === 'ASSIGNED') return { label: 'Start Work', action: 'START_WORK', urgent: false };
      if (state === 'IN_PROGRESS') return { label: 'Resolve', action: 'RESOLVE', urgent: false };
    } else if (task.task_type === 'NETBOX') {
      if (state === 'ASSIGNED') return { label: 'Mark Collected', action: 'COLLECTED', urgent: false };
      // COLLECTED handled below (Confirm Return)
    }
  }

  // Technician is working - allow reassignment
  if (isInTechnicianHands(task)) {
    return { label: 'Reassign', action: 'ASSIGN', urgent: false };
  }

  if (state === 'CLAIMED') {
    return { label: 'Accept', action: 'ACCEPT', urgent: false };
  }

  if (state === 'ACCEPTED' || state === 'PICKUP_REQUIRED') {
    return { label: 'Schedule / Assign', action: 'SCHEDULE', urgent: false };
  }

  if (state === 'ALERTED') {
    return { label: 'Assign', action: 'ASSIGN', urgent: task.priority === 'HIGH' };
  }

  if (flag === 'BLOCKED_STALE') {
    return { label: 'Resolve (Urgent)', action: 'RESOLVE_BLOCKED', urgent: true };
  }

  if (state === 'COLLECTED') {
    return { label: 'Confirm Return', action: 'CONFIRM_RETURN', urgent: false };
  }

  if (state === 'INSTALLED' && flag === 'VERIFICATION_PENDING') {
    return { label: 'Verify Manually', action: 'VERIFY', urgent: false };
  }

  return null;
}

function getStateColor(state: string): string {
  const activeStates = ['IN_PROGRESS', 'ASSIGNED', 'SCHEDULED', 'ACCEPTED', 'CLAIMED'];
  const alertStates = ['ALERTED', 'OFFERED', 'PICKUP_REQUIRED'];
  const doneStates = ['RESOLVED', 'VERIFIED', 'ACTIVATION_VERIFIED', 'RETURN_CONFIRMED', 'INSTALLED'];
  const failStates = ['FAILED', 'UNRESOLVED', 'LOST_DECLARED'];

  if (activeStates.includes(state)) return 'var(--brand-primary)';
  if (alertStates.includes(state)) return 'var(--warning)';
  if (doneStates.includes(state)) return 'var(--positive)';
  if (failStates.includes(state)) return 'var(--negative)';
  return 'var(--text-secondary)';
}

function getTimeRemaining(dateStr: string | undefined): string {
  if (!dateStr) return '--';
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

// Slot date helpers
function getSlotDate(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

type OfferStep = 'details' | 'slot_pick' | 'decline_reason';

const DECLINE_REASONS = [
  'Too far from my area',
  'Insufficient bandwidth / too busy',
  'Customer area not serviceable',
  'Not enough technicians available',
  'SLA timeline too tight',
];

export default function TaskDetail({ task, onBack, onAction }: TaskDetailProps) {
  const { t } = useI18n();
  const cta = useMemo(() => getCTA(task), [task]);
  const [offerStep, setOfferStep] = useState<OfferStep>('details');

  const sortedEvents = useMemo(
    () =>
      [...task.event_log].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
    [task.event_log]
  );

  const contextId = task.connection_id || task.netbox_id || '--';
  const area = task.customer_area || '--';

  const infoRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid var(--border-subtle)',
    fontSize: 13,
  };

  const isOffer = task.state === 'OFFERED';

  // ---- OFFERED: Slot picker step ----
  if (isOffer && offerStep === 'slot_pick') {
    const slots = [
      { label: 'Today', sublabel: getSlotDate(0), offset: 0 },
      { label: 'Tomorrow', sublabel: getSlotDate(1), offset: 1 },
      { label: 'Day After', sublabel: getSlotDate(2), offset: 2 },
    ];

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 900,
          background: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <button
            onClick={() => setOfferStep('details')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 14,
              cursor: 'pointer',
              padding: '4px 0',
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            &larr; Back
          </button>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            Choose Preferred Slot
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {contextId} -- {area}
          </div>
        </div>

        <div style={{ flex: 1, padding: '24px 16px' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            When would you like to schedule the installation?
          </div>

          {slots.map((slot) => (
            <button
              key={slot.offset}
              onClick={() => {
                // Claim + schedule with preferred slot, then trigger technician picker
                onAction(task.task_id, 'CLAIM_AND_ASSIGN', { preferred_slot: slot.label });
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '18px 20px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {slot.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {slot.sublabel}
                </div>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 18 }}>{'\u203A'}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---- OFFERED: Decline reason step ----
  if (isOffer && offerStep === 'decline_reason') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 900,
          background: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <button
            onClick={() => setOfferStep('details')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 14,
              cursor: 'pointer',
              padding: '4px 0',
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            &larr; Back
          </button>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            Decline Offer
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {contextId} -- {area}
          </div>
        </div>

        <div style={{ flex: 1, padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Please select a reason for declining this offer:
          </div>

          {DECLINE_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => {
                onAction(task.task_id, 'DECLINE', { reason });
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '16px 20px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                {reason}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 18 }}>{'\u203A'}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 14,
            cursor: 'pointer',
            padding: '4px 0',
            marginBottom: 12,
            fontWeight: 500,
          }}
        >
          &larr; Back to tasks
        </button>

        {/* Task type + ID + state */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 8,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 10px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.3,
              background: getBadgeBackground(task.task_type),
              color: getBadgeColor(task.task_type),
            }}
          >
            {task.task_type}
          </span>

          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {task.task_id}
          </span>

          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: getStateColor(task.state),
              padding: '2px 8px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 4,
            }}
          >
            {task.state}
          </span>
        </div>

        {/* Context */}
        <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
          {contextId}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{area}</div>
      </div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}
      >
        {/* OFFERED: Customer Details Card */}
        {isOffer && (
          <div
            style={{
              background: 'linear-gradient(135deg, var(--bg-card), var(--bg-secondary))',
              borderRadius: 12,
              padding: '20px',
              marginBottom: 20,
              border: '1px solid var(--bg-card-hover)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              Customer Details
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Connection ID</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{contextId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Area</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{area}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Task Type</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: getBadgeColor(task.task_type) }}>{task.task_type}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Priority</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: task.priority === 'HIGH' ? 'var(--negative)' : 'var(--text-primary)' }}>{task.priority}</span>
            </div>
            {task.offer_expires_at && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Offer Expires</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--warning)' }}>
                  {getTimeRemaining(task.offer_expires_at)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        {!isOffer && (
          <div style={{ marginBottom: 24 }}>
            <div style={infoRowStyle}>
              <span style={{ color: 'var(--text-secondary)' }}>Priority</span>
              <span
                style={{
                  color: task.priority === 'HIGH' ? 'var(--negative)' : 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                {task.priority}
              </span>
            </div>
            <div style={infoRowStyle}>
              <span style={{ color: 'var(--text-secondary)' }}>Created By</span>
              <span style={{ color: 'var(--text-primary)' }}>{task.created_by}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={{ color: 'var(--text-secondary)' }}>Created At</span>
              <span style={{ color: 'var(--text-primary)' }}>
                {formatFullTimestamp(task.created_at)}
              </span>
            </div>
            {task.assigned_to && (
              <div style={infoRowStyle}>
                <span style={{ color: 'var(--text-secondary)' }}>Assigned To</span>
                <span style={{ color: 'var(--text-primary)' }}>{task.assigned_to}</span>
              </div>
            )}
            {task.delegation_state !== 'UNASSIGNED' && (
              <div style={infoRowStyle}>
                <span style={{ color: 'var(--text-secondary)' }}>Delegation</span>
                <span style={{ color: 'var(--text-primary)' }}>{task.delegation_state}</span>
              </div>
            )}
            {task.sla_deadline_at && (
              <div style={infoRowStyle}>
                <span style={{ color: 'var(--text-secondary)' }}>SLA Deadline</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {formatFullTimestamp(task.sla_deadline_at)}
                </span>
              </div>
            )}
            {task.retry_count > 0 && (
              <div style={infoRowStyle}>
                <span style={{ color: 'var(--text-secondary)' }}>Retry Count</span>
                <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                  {task.retry_count}
                </span>
              </div>
            )}
            {task.queue_escalation_flag && (
              <div style={infoRowStyle}>
                <span style={{ color: 'var(--text-secondary)' }}>Escalation Flag</span>
                <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                  {task.queue_escalation_flag}
                </span>
              </div>
            )}
            {task.blocked_reason && (
              <div style={infoRowStyle}>
                <span style={{ color: 'var(--text-secondary)' }}>Blocked Reason</span>
                <span style={{ color: 'var(--negative)' }}>{task.blocked_reason}</span>
              </div>
            )}
          </div>
        )}

        {/* Assigned technician status (if tech is working) */}
        {isInTechnicianHands(task) && (
          <div
            style={{
              background: 'var(--warning-subtle)',
              border: '1px solid rgba(255, 128, 0, 0.25)',
              borderRadius: 10,
              padding: '14px 16px',
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Technician Working
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }} />
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                {task.assigned_to}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--warning)', fontWeight: 500 }}>
              Status: {task.delegation_state}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 16,
          }}
        >
          Timeline
        </div>

        <div style={{ position: 'relative', paddingLeft: 24 }}>
          {/* Vertical line */}
          <div
            style={{
              position: 'absolute',
              left: 7,
              top: 4,
              bottom: 4,
              width: 2,
              background: 'var(--border-subtle)',
            }}
          />

          {sortedEvents.map((event: TimelineEvent, i: number) => (
            <div
              key={i}
              style={{
                position: 'relative',
                paddingBottom: i < sortedEvents.length - 1 ? 20 : 0,
              }}
            >
              {/* Dot */}
              <div
                style={{
                  position: 'absolute',
                  left: -20,
                  top: 4,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: getActorColor(event.actor_type),
                  border: '2px solid var(--bg-primary)',
                }}
              />

              {/* Event content */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 4,
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: getActorColor(event.actor_type),
                    }}
                  >
                    {event.actor}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                    marginBottom: 4,
                  }}
                >
                  {event.event_type}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    lineHeight: 1.5,
                  }}
                >
                  {event.detail}
                </div>
                {event.proof && (
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--brand-primary)',
                      marginTop: 4,
                    }}
                  >
                    Proof: {event.proof}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA area */}
      {isOffer ? (
        /* OFFERED task: Claim + Decline buttons */
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--border-subtle)',
            flexShrink: 0,
            background: 'var(--bg-primary)',
          }}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setOfferStep('decline_reason')}
              style={{
                flex: 1,
                padding: '14px',
                fontSize: 15,
                borderRadius: 10,
                background: 'transparent',
                color: 'var(--negative)',
                border: '1px solid var(--negative)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Decline
            </button>
            <button
              onClick={() => setOfferStep('slot_pick')}
              className="cta-primary"
              style={{
                flex: 2,
                padding: '14px',
                fontSize: 15,
                borderRadius: 10,
              }}
            >
              Claim
            </button>
          </div>
        </div>
      ) : cta ? (
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--border-subtle)',
            flexShrink: 0,
            background: 'var(--bg-primary)',
          }}
        >
          {isSelfAssigned(task) ? (
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => onAction(task.task_id, 'ASSIGN')}
                className="cta-secondary"
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: 15,
                  borderRadius: 10,
                }}
              >
                Reassign
              </button>
              <button
                onClick={() => onAction(task.task_id, cta.action)}
                className="cta-primary"
                style={{
                  flex: 2,
                  padding: '14px',
                  fontSize: 15,
                  borderRadius: 10,
                }}
              >
                {cta.label}
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAction(task.task_id, cta.action)}
              className={cta.urgent ? 'cta-urgent' : cta.label === 'Reassign' ? 'cta-secondary' : 'cta-primary'}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: 15,
                borderRadius: 10,
              }}
            >
              {cta.label}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
