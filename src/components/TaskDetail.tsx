'use client';

import { useMemo, useState } from 'react';
import type { Task, TimelineEvent } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

interface TaskDetailProps {
  task: Task;
  onBack: () => void;
  onAction: (taskId: string, action: string, extra?: Record<string, string>) => void;
}

function getLeftBorderColor(taskType: string): string {
  switch (taskType) {
    case 'INSTALL':
      return '#D9008D';
    case 'RESTORE':
      return '#E01E00';
    case 'NETBOX':
      return '#FF8000';
    default:
      return '#665E75';
  }
}

function getBadgeBackground(taskType: string): string {
  switch (taskType) {
    case 'INSTALL':
      return 'rgba(217, 0, 141, 0.15)';
    case 'RESTORE':
      return 'rgba(224, 30, 0, 0.15)';
    case 'NETBOX':
      return 'rgba(255, 128, 0, 0.15)';
    default:
      return 'rgba(92, 111, 130, 0.15)';
  }
}

function getBadgeColor(taskType: string): string {
  switch (taskType) {
    case 'INSTALL':
      return '#D9008D';
    case 'RESTORE':
      return '#E01E00';
    case 'NETBOX':
      return '#FF8000';
    default:
      return '#665E75';
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
      return '#665E75';
    case 'CSP':
      return '#D9008D';
    case 'ADMIN':
      return '#FF8000';
    case 'TECHNICIAN':
      return '#008043';
    default:
      return '#A7A1B2';
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

function getCTA(task: Task): { label: string; action: string; urgent: boolean } | null {
  const state = task.state;
  const flag = task.queue_escalation_flag;

  // Terminal states: no CTA
  if (['ACTIVATION_VERIFIED', 'VERIFIED', 'RETURN_CONFIRMED', 'LOST_DECLARED', 'FAILED', 'RESOLVED', 'UNRESOLVED'].includes(state)) {
    return null;
  }

  // OFFERED tasks handled separately in detail view
  if (state === 'OFFERED') return null;

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

  if (activeStates.includes(state)) return '#D9008D';
  if (alertStates.includes(state)) return '#FF8000';
  if (doneStates.includes(state)) return '#008043';
  if (failStates.includes(state)) return '#E01E00';
  return '#A7A1B2';
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

type OfferStep = 'details' | 'slot_pick';

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
    borderBottom: '1px solid #352D42',
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
          background: '#161021',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid #352D42', flexShrink: 0 }}>
          <button
            onClick={() => setOfferStep('details')}
            style={{
              background: 'none',
              border: 'none',
              color: '#A7A1B2',
              fontSize: 14,
              cursor: 'pointer',
              padding: '4px 0',
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            &larr; Back
          </button>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>
            Choose Preferred Slot
          </div>
          <div style={{ fontSize: 13, color: '#A7A1B2', marginTop: 4 }}>
            {contextId} -- {area}
          </div>
        </div>

        <div style={{ flex: 1, padding: '24px 16px' }}>
          <div style={{ fontSize: 13, color: '#A7A1B2', marginBottom: 16 }}>
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
                background: '#443152',
                border: '1px solid #352D42',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#FAF9FC' }}>
                  {slot.label}
                </div>
                <div style={{ fontSize: 12, color: '#A7A1B2', marginTop: 2 }}>
                  {slot.sublabel}
                </div>
              </div>
              <div style={{ color: '#665E75', fontSize: 18 }}>{'\u203A'}</div>
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
        background: '#161021',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #352D42',
          flexShrink: 0,
        }}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#A7A1B2',
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
              color: '#FAF9FC',
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
        <div style={{ fontSize: 14, color: '#FAF9FC', marginBottom: 2 }}>
          {contextId}
        </div>
        <div style={{ fontSize: 12, color: '#A7A1B2' }}>{area}</div>
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
              background: 'linear-gradient(135deg, #443152, #352D42)',
              borderRadius: 12,
              padding: '20px',
              marginBottom: 20,
              border: '1px solid #665E75',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#A7A1B2', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              Customer Details
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#A7A1B2' }}>Connection ID</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#FAF9FC' }}>{contextId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#A7A1B2' }}>Area</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#FAF9FC' }}>{area}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#A7A1B2' }}>Task Type</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: getBadgeColor(task.task_type) }}>{task.task_type}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#A7A1B2' }}>Priority</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: task.priority === 'HIGH' ? '#E01E00' : '#FAF9FC' }}>{task.priority}</span>
            </div>
            {task.offer_expires_at && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#A7A1B2' }}>Offer Expires</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#FF8000' }}>
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
              <span style={{ color: '#A7A1B2' }}>Priority</span>
              <span
                style={{
                  color: task.priority === 'HIGH' ? '#E01E00' : '#FAF9FC',
                  fontWeight: 600,
                }}
              >
                {task.priority}
              </span>
            </div>
            <div style={infoRowStyle}>
              <span style={{ color: '#A7A1B2' }}>Created By</span>
              <span style={{ color: '#FAF9FC' }}>{task.created_by}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={{ color: '#A7A1B2' }}>Created At</span>
              <span style={{ color: '#FAF9FC' }}>
                {formatFullTimestamp(task.created_at)}
              </span>
            </div>
            {task.assigned_to && (
              <div style={infoRowStyle}>
                <span style={{ color: '#A7A1B2' }}>Assigned To</span>
                <span style={{ color: '#FAF9FC' }}>{task.assigned_to}</span>
              </div>
            )}
            {task.delegation_state !== 'UNASSIGNED' && (
              <div style={infoRowStyle}>
                <span style={{ color: '#A7A1B2' }}>Delegation</span>
                <span style={{ color: '#FAF9FC' }}>{task.delegation_state}</span>
              </div>
            )}
            {task.sla_deadline_at && (
              <div style={infoRowStyle}>
                <span style={{ color: '#A7A1B2' }}>SLA Deadline</span>
                <span style={{ color: '#FAF9FC' }}>
                  {formatFullTimestamp(task.sla_deadline_at)}
                </span>
              </div>
            )}
            {task.retry_count > 0 && (
              <div style={infoRowStyle}>
                <span style={{ color: '#A7A1B2' }}>Retry Count</span>
                <span style={{ color: '#FF8000', fontWeight: 600 }}>
                  {task.retry_count}
                </span>
              </div>
            )}
            {task.queue_escalation_flag && (
              <div style={infoRowStyle}>
                <span style={{ color: '#A7A1B2' }}>Escalation Flag</span>
                <span style={{ color: '#FF8000', fontWeight: 600 }}>
                  {task.queue_escalation_flag}
                </span>
              </div>
            )}
            {task.blocked_reason && (
              <div style={infoRowStyle}>
                <span style={{ color: '#A7A1B2' }}>Blocked Reason</span>
                <span style={{ color: '#E01E00' }}>{task.blocked_reason}</span>
              </div>
            )}
          </div>
        )}

        {/* Assigned technician status (if tech is working) */}
        {isInTechnicianHands(task) && (
          <div
            style={{
              background: 'rgba(255, 128, 0, 0.08)',
              border: '1px solid rgba(255, 128, 0, 0.25)',
              borderRadius: 10,
              padding: '14px 16px',
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 12, color: '#A7A1B2', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Technician Working
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF8000' }} />
              <span style={{ fontSize: 15, fontWeight: 600, color: '#FAF9FC' }}>
                {task.assigned_to}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#FF8000', fontWeight: 500 }}>
              Status: {task.delegation_state}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#A7A1B2',
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
              background: '#352D42',
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
                  border: '2px solid #161021',
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
                      color: '#665E75',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#665E75',
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
                    color: '#FAF9FC',
                    lineHeight: 1.5,
                  }}
                >
                  {event.detail}
                </div>
                {event.proof && (
                  <div
                    style={{
                      fontSize: 11,
                      color: '#D9008D',
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
            borderTop: '1px solid #352D42',
            flexShrink: 0,
            background: '#161021',
          }}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => onAction(task.task_id, 'DECLINE')}
              style={{
                flex: 1,
                padding: '14px',
                fontSize: 15,
                borderRadius: 10,
                background: 'transparent',
                color: '#E01E00',
                border: '1px solid #E01E00',
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
            borderTop: '1px solid #352D42',
            flexShrink: 0,
            background: '#161021',
          }}
        >
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
        </div>
      ) : null}
    </div>
  );
}
