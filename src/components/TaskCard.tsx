'use client';

import { useMemo } from 'react';
import type { Task } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

interface TaskCardProps {
  task: Task;
  bucket: number;
  onAction: (taskId: string, action: string) => void;
  onCardClick: (taskId: string) => void;
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

function getTimeRemaining(dateStr: string | undefined): string {
  if (!dateStr) return '--';
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Overdue';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  if (hrs < 24) return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getReasonLabel(task: Task): string | null {
  const flag = task.queue_escalation_flag;
  const state = task.state;

  if (state === 'OFFERED') {
    const remaining = getTimeRemaining(task.offer_expires_at);
    return `Offer expires -- ${remaining}`;
  }

  if (flag === 'CLAIM_TTL_EXPIRING') {
    const remaining = getTimeRemaining(task.accept_expires_at);
    return `Claim expiring -- ${remaining}`;
  }

  if (task.task_type === 'RESTORE' && task.priority === 'HIGH' && ['ALERTED', 'ASSIGNED', 'IN_PROGRESS'].includes(state)) {
    const remaining = getTimeRemaining(task.sla_deadline_at);
    return `High restore -- ${remaining} left`;
  }

  if (flag === 'RESTORE_RETRY') {
    return `Restore retry -- ${getOrdinal(task.retry_count + 1)} attempt`;
  }

  if (flag === 'BLOCKED_STALE') return 'Blocked -- action needed';
  if (flag === 'RETURN_OVERDUE') return 'Return overdue';
  if (flag === 'VERIFICATION_PENDING') return 'Verification pending -- confirm';
  if (flag === 'INSTALL_OVERDUE') return 'Install overdue';
  if (flag === 'PICKUP_OVERDUE') return 'Pickup overdue';

  if (flag === 'OFFER_TTL_EXPIRING') {
    const remaining = getTimeRemaining(task.offer_expires_at);
    return `Offer expires -- ${remaining}`;
  }

  if (flag === 'ASSIGNMENT_UNACCEPTED') return 'Assignment unaccepted';
  if (flag === 'CHAIN_ESCALATION_PENDING') return 'Chain escalation pending';
  if (flag === 'MANUAL_EXCEPTION') return 'Manual exception';

  return null;
}

/**
 * Determine if this task is "in technician hands" - CSP has visibility but
 * should not see an action CTA (the technician is working on it).
 */
function isInTechnicianHands(task: Task): boolean {
  // If delegation_state is ASSIGNED, ACCEPTED, or IN_PROGRESS and a technician
  // is assigned, the task is being worked on by the tech.
  if (
    task.assigned_to &&
    ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(task.delegation_state) &&
    // These task states mean the tech is actively working
    ['ASSIGNED', 'IN_PROGRESS', 'SCHEDULED'].includes(task.state)
  ) {
    return true;
  }
  return false;
}

function getCTA(task: Task): { label: string; action: string; urgent: boolean; ctaKey: string } | null {
  // If technician is assigned, show Reassign option
  if (isInTechnicianHands(task)) {
    return { label: 'Reassign', action: 'ASSIGN', urgent: false, ctaKey: 'cta.reassign' };
  }

  const state = task.state;
  const flag = task.queue_escalation_flag;

  if (state === 'OFFERED') {
    // Open detail view (customer details + claim/decline), not auto-claim
    return { label: 'View', action: 'VIEW', urgent: false, ctaKey: 'cta.view' };
  }

  if (state === 'CLAIMED') {
    return { label: 'Accept', action: 'ACCEPT', urgent: false, ctaKey: 'cta.accept' };
  }

  if (state === 'ACCEPTED' || state === 'PICKUP_REQUIRED') {
    return { label: 'Schedule / Assign', action: 'SCHEDULE', urgent: false, ctaKey: 'cta.scheduleAssign' };
  }

  if (state === 'ALERTED') {
    return { label: 'Assign', action: 'ASSIGN', urgent: task.priority === 'HIGH', ctaKey: 'cta.assign' };
  }

  if (flag === 'BLOCKED_STALE') {
    return { label: 'Resolve (Urgent)', action: 'RESOLVE_BLOCKED', urgent: true, ctaKey: 'cta.resolveUrgent' };
  }

  if (state === 'COLLECTED') {
    return { label: 'Confirm Return', action: 'CONFIRM_RETURN', urgent: false, ctaKey: 'cta.confirmReturn' };
  }

  if (state === 'INSTALLED' && flag === 'VERIFICATION_PENDING') {
    return { label: 'Verify Manually', action: 'VERIFY', urgent: false, ctaKey: 'cta.verifyManually' };
  }

  return { label: 'View', action: 'VIEW', urgent: false, ctaKey: 'cta.view' };
}

function getCountdownDisplay(task: Task): { text: string; overdue: boolean } | null {
  const candidates: (string | undefined)[] = [
    task.sla_deadline_at,
    task.offer_expires_at,
    task.accept_expires_at,
    task.return_due_at,
    task.pickup_due_at,
    task.due_at,
  ];

  const valid = candidates.filter((d): d is string => d !== undefined);
  if (valid.length === 0) return null;

  const nearest = valid.reduce((min, d) => {
    const t = new Date(d).getTime();
    return t < new Date(min).getTime() ? d : min;
  });

  const diff = new Date(nearest).getTime() - Date.now();
  if (diff <= 0) return { text: 'Overdue', overdue: true };

  const mins = Math.floor(diff / 60000);
  if (mins < 60) return { text: `${mins}m remaining`, overdue: false };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    const rm = mins % 60;
    return { text: rm > 0 ? `${hrs}h ${rm}m remaining` : `${hrs}h remaining`, overdue: false };
  }
  const days = Math.floor(hrs / 24);
  return { text: `${days}d ${hrs % 24}h remaining`, overdue: false };
}

/** Delegation state display for when technician is working */
function getDelegationDisplay(task: Task): string {
  if (task.delegation_state === 'ASSIGNED') return 'Assigned';
  if (task.delegation_state === 'ACCEPTED') return 'Accepted';
  if (task.delegation_state === 'IN_PROGRESS') return 'In Progress';
  return task.state;
}

export default function TaskCard({ task, bucket, onAction, onCardClick }: TaskCardProps) {
  const { t } = useI18n();
  const borderColor = getLeftBorderColor(task.task_type);
  const reasonLabel = useMemo(() => getReasonLabel(task), [task]);
  const cta = useMemo(() => getCTA(task), [task]);
  const countdown = useMemo(() => getCountdownDisplay(task), [task]);
  const contextId = task.connection_id || task.netbox_id || '--';
  const area = task.customer_area || '--';
  const techWorking = isInTechnicianHands(task);

  return (
    <div
      onClick={() => onCardClick(task.task_id)}
      style={{
        background: '#443152',
        borderRadius: 10,
        borderLeft: `4px solid ${borderColor}`,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        marginBottom: 10,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = '#665E75';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = '#443152';
      }}
    >
      {/* Row 1: Type badge + reason label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.3,
            background: getBadgeBackground(task.task_type),
            color: getBadgeColor(task.task_type),
          }}
        >
          {task.task_type}
        </span>

        {task.priority === 'HIGH' && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.3,
              background: 'rgba(224, 30, 0, 0.12)',
              color: '#E01E00',
            }}
          >
            {t('card.high')}
          </span>
        )}

        {reasonLabel && (
          <span
            style={{
              fontSize: 11,
              color: bucket <= 1 ? '#E01E00' : '#FF8000',
              fontWeight: 500,
            }}
          >
            {reasonLabel}
          </span>
        )}
      </div>

      {/* Row 2: Context line */}
      <div
        style={{
          fontSize: 14,
          color: '#FAF9FC',
          fontWeight: 500,
          marginBottom: 4,
        }}
      >
        {contextId}
      </div>
      <div
        style={{
          fontSize: 12,
          color: '#A7A1B2',
          marginBottom: techWorking ? 6 : 10,
        }}
      >
        {area}
        {task.assigned_to && !techWorking && (
          <span style={{ color: '#665E75' }}> -- {task.assigned_to}</span>
        )}
      </div>

      {/* Technician working indicator - high visibility */}
      {techWorking && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
            padding: '6px 10px',
            background: 'rgba(255, 128, 0, 0.1)',
            borderRadius: 6,
            border: '1px solid rgba(255, 128, 0, 0.2)',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#FF8000',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#FF8000' }}>
            {task.assigned_to}
          </span>
          <span style={{ fontSize: 11, color: '#A7A1B2' }}>
            {getDelegationDisplay(task)}
          </span>
        </div>
      )}

      {/* Row 3: Status / Countdown + CTA or Delegation status */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          {countdown && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: countdown.overdue ? '#E01E00' : '#A7A1B2',
              }}
            >
              {countdown.text}
            </span>
          )}
          {!countdown && (
            <span style={{ fontSize: 12, color: '#665E75' }}>
              {task.state}
            </span>
          )}
        </div>

        {/* Show CTA if available, or delegation status badge if tech is working */}
        {cta ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction(task.task_id, cta.action);
            }}
            className={cta.urgent ? 'cta-urgent' : cta.ctaKey === 'cta.reassign' ? 'cta-secondary' : 'cta-primary'}
          >
            {t(cta.ctaKey)}
          </button>
        ) : null}
      </div>
    </div>
  );
}
