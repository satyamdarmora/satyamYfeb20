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

/** Left border = urgency-based */
function getLeftBorderColor(bucket: number, task: Task): string {
  const deadlines = [task.sla_deadline_at, task.offer_expires_at, task.accept_expires_at, task.return_due_at, task.pickup_due_at, task.due_at];
  const isOverdue = deadlines.some((d) => d && new Date(d).getTime() < Date.now());
  if (isOverdue) return 'var(--negative)';
  if (task.priority === 'HIGH') return 'var(--negative)';
  if (bucket <= 1) return 'var(--negative)';
  if (bucket <= 3) return 'var(--warning)';
  return 'var(--positive)';
}

function getBadgeColor(taskType: string): string {
  switch (taskType) {
    case 'INSTALL': return 'var(--brand-primary)';
    case 'RESTORE': return 'var(--accent-restore)';
    case 'NETBOX': return 'var(--accent-gold)';
    default: return 'var(--text-muted)';
  }
}

function getTimeRemaining(dateStr: string | undefined): string {
  if (!dateStr) return '--';
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Overdue';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  if (hrs < 24) return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
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

function getCTA(task: Task): { label: string; action: string; urgent: boolean; ctaKey: string } | null {
  const state = task.state;

  if (isSelfAssigned(task)) {
    if (task.task_type === 'INSTALL') {
      if (state === 'SCHEDULED' || state === 'ASSIGNED') return { label: 'Start Work', action: 'START_WORK', urgent: false, ctaKey: 'cta.startWork' };
      if (state === 'IN_PROGRESS') return { label: 'Mark Installed', action: 'INSTALL', urgent: false, ctaKey: 'cta.install' };
    } else if (task.task_type === 'RESTORE') {
      if (state === 'ASSIGNED') return { label: 'Start Work', action: 'START_WORK', urgent: false, ctaKey: 'cta.startWork' };
      if (state === 'IN_PROGRESS') return { label: 'Resolve', action: 'RESOLVE', urgent: false, ctaKey: 'cta.resolve' };
    } else if (task.task_type === 'NETBOX') {
      if (state === 'ASSIGNED') return { label: 'Mark Collected', action: 'COLLECTED', urgent: false, ctaKey: 'cta.collected' };
    }
  }

  // Technician assigned (not self) — CSP can only reassign, not resolve directly
  if (isInTechnicianHands(task)) {
    return { label: 'Reassign', action: 'ASSIGN', urgent: false, ctaKey: 'cta.reassign' };
  }

  const flag = task.queue_escalation_flag;

  if (state === 'OFFERED') return { label: 'View', action: 'VIEW', urgent: false, ctaKey: 'cta.view' };
  if (state === 'CLAIMED') return { label: 'Accept', action: 'ACCEPT', urgent: false, ctaKey: 'cta.accept' };
  if (state === 'ACCEPTED' || state === 'PICKUP_REQUIRED') return { label: 'Assign', action: 'SCHEDULE', urgent: false, ctaKey: 'cta.scheduleAssign' };
  if (state === 'ALERTED') return { label: 'Assign', action: 'ASSIGN', urgent: task.priority === 'HIGH', ctaKey: 'cta.assign' };
  if (flag === 'BLOCKED_STALE') return { label: 'Unblock', action: 'RESOLVE_BLOCKED', urgent: true, ctaKey: 'cta.resolveUrgent' };
  if (state === 'COLLECTED') return { label: 'Confirm Return', action: 'CONFIRM_RETURN', urgent: false, ctaKey: 'cta.confirmReturn' };
  if (state === 'INSTALLED' && flag === 'VERIFICATION_PENDING') return { label: 'Verify', action: 'VERIFY', urgent: false, ctaKey: 'cta.verifyManually' };

  return null;
}

function getDeadlineInfo(task: Task): { text: string; overdue: boolean } | null {
  const candidates: (string | undefined)[] = [
    task.sla_deadline_at, task.offer_expires_at, task.accept_expires_at,
    task.return_due_at, task.pickup_due_at, task.due_at,
  ];
  const valid = candidates.filter((d): d is string => d !== undefined);
  if (valid.length === 0) return null;
  const nearest = valid.reduce((min, d) => new Date(d).getTime() < new Date(min).getTime() ? d : min);
  const remaining = getTimeRemaining(nearest);
  return { text: remaining, overdue: remaining === 'Overdue' };
}

export default function TaskCard({ task, bucket, onAction, onCardClick }: TaskCardProps) {
  const { t } = useI18n();
  const borderColor = getLeftBorderColor(bucket, task);
  const cta = useMemo(() => getCTA(task), [task]);
  const deadline = useMemo(() => getDeadlineInfo(task), [task]);
  const contextId = task.connection_id || task.netbox_id || task.task_id;
  const area = task.customer_area || '--';
  const techWorking = isInTechnicianHands(task);

  return (
    <div
      onClick={() => onCardClick(task.task_id)}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 14,
        borderLeft: `3px solid ${borderColor}`,
        padding: '18px 20px 20px',
        cursor: 'pointer',
        marginBottom: 14,
        transition: 'transform 0.1s ease, box-shadow 0.15s ease',
      }}
    >
      {/* Line 1: Type + ID + Deadline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: getBadgeColor(task.task_type), letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {task.task_type}
        </span>
        {task.priority === 'HIGH' && (
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--negative)', background: 'var(--negative-subtle)', padding: '2px 6px', borderRadius: 4 }}>
            {t('card.high')}
          </span>
        )}
        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
          {contextId}
        </span>
        {deadline && (
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: deadline.overdue ? 'var(--negative)' : 'var(--text-muted)',
            flexShrink: 0,
          }}>
            {deadline.text}
          </span>
        )}
      </div>

      {/* Line 2: Area + Tech/State + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {area}
          </span>
          {techWorking && (
            <>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>·</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--warning)', whiteSpace: 'nowrap' }}>
                {task.assigned_to}
              </span>
            </>
          )}
        </div>
        {cta ? (
          <button
            onClick={(e) => { e.stopPropagation(); onAction(task.task_id, cta.action); }}
            className={cta.urgent ? 'cta-urgent cta-sm' : cta.ctaKey === 'cta.reassign' ? 'cta-secondary cta-sm' : 'cta-primary cta-sm'}
          >
            {t(cta.ctaKey)}
          </button>
        ) : (
          <span style={{ fontSize: 14, color: 'var(--text-muted)', flexShrink: 0 }}>{'\u203A'}</span>
        )}
      </div>
    </div>
  );
}
