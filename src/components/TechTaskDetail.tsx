'use client';

import type { Task } from '@/lib/types';

interface TechTaskDetailProps {
  task: Task;
  techId: string;
  onAction: (taskId: string, action: string) => void;
  onClose: () => void;
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'INSTALL': return 'var(--brand-primary)';
    case 'RESTORE': return 'var(--accent-restore)';
    case 'NETBOX': return 'var(--accent-gold)';
    default: return 'var(--text-secondary)';
  }
}

function getNextAction(task: Task): { label: string; action: string } | null {
  if (task.task_type === 'INSTALL') {
    switch (task.state) {
      case 'CLAIMED':
      case 'ASSIGNED': return { label: 'Accept Assignment', action: 'ACCEPT_ASSIGNMENT' };
      case 'ACCEPTED': return { label: 'Start Work', action: 'START_WORK' };
      case 'SCHEDULED': return { label: 'Mark Installed', action: 'MARK_INSTALLED' };
      default: return null;
    }
  }
  if (task.task_type === 'RESTORE') {
    switch (task.state) {
      case 'ALERTED':
      case 'ASSIGNED': return { label: 'Accept Assignment', action: 'ACCEPT_ASSIGNMENT' };
      case 'ACCEPTED': return { label: 'Start Work', action: 'START_WORK' };
      case 'IN_PROGRESS': return { label: 'Resolve', action: 'RESOLVE' };
      default: return null;
    }
  }
  if (task.task_type === 'NETBOX') {
    switch (task.state) {
      case 'ASSIGNED': return { label: 'Accept Assignment', action: 'ACCEPT_ASSIGNMENT' };
      case 'ACCEPTED':
      case 'IN_PROGRESS': return { label: 'Mark Collected', action: 'MARK_COLLECTED' };
      case 'COLLECTED': return { label: 'Confirm Return', action: 'CONFIRM_RETURN' };
      default: return null;
    }
  }
  return null;
}

export default function TechTaskDetail({ task, techId, onAction, onClose }: TechTaskDetailProps) {
  const nextAction = getNextAction(task);

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
        animation: 'slideUpIn 0.25s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 14,
            cursor: 'pointer',
            padding: '4px 0',
            marginBottom: 10,
            fontWeight: 500,
          }}
        >
          &larr; Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: getTypeColor(task.task_type),
              background: `${getTypeColor(task.task_type)}18`,
              padding: '3px 8px',
              borderRadius: 6,
              textTransform: 'uppercase',
            }}
          >
            {task.task_type}
          </span>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
            {task.task_id}
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {/* Task info card */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            padding: '18px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase' }}>
                Connection
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {task.connection_id || task.netbox_id || '--'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase' }}>
                Area
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {task.customer_area || '--'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase' }}>
                State
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {task.state}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase' }}>
                Priority
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: task.priority === 'HIGH' ? 'var(--negative)' : 'var(--text-primary)',
                }}
              >
                {task.priority}
              </div>
            </div>
            {task.sla_deadline_at && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase' }}>
                  SLA Deadline
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--warning)' }}>
                  {formatTimestamp(task.sla_deadline_at)}
                </div>
              </div>
            )}
            {task.due_at && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase' }}>
                  Due
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatTimestamp(task.due_at)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 14,
            }}
          >
            Timeline
          </div>
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            <div
              style={{
                position: 'absolute',
                left: 5,
                top: 4,
                bottom: 4,
                width: 2,
                background: 'var(--border-subtle)',
              }}
            />
            {[...task.event_log]
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
              .map((event, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    paddingBottom: i < task.event_log.length - 1 ? 16 : 0,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: -17,
                      top: 3,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background:
                        event.actor_type === 'TECHNICIAN'
                          ? 'var(--positive)'
                          : event.actor_type === 'CSP'
                            ? 'var(--brand-primary)'
                            : 'var(--text-muted)',
                      border: '2px solid var(--bg-primary)',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatTimestamp(event.timestamp)}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: event.actor_type === 'TECHNICIAN' ? 'var(--positive)' : 'var(--text-secondary)',
                      }}
                    >
                      {event.actor}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {event.detail}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* CTA button */}
      {nextAction && (
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => onAction(task.task_id, nextAction.action)}
            style={{
              width: '100%',
              padding: '15px',
              background: 'var(--brand-primary)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {nextAction.label}
          </button>
        </div>
      )}
    </div>
  );
}
