'use client';

import { useState } from 'react';
import type { Task, Technician } from '@/lib/types';

interface TechDashboardProps {
  tech: Technician;
  tasks: Task[];
  onSelectTask: (taskId: string) => void;
  onOpenProfile: () => void;
  onToggleAvailability: () => void;
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'INSTALL': return 'var(--brand-primary)';
    case 'RESTORE': return 'var(--accent-restore)';
    case 'NETBOX': return 'var(--accent-gold)';
    default: return 'var(--text-secondary)';
  }
}

const TERMINAL_STATES = ['RESOLVED', 'VERIFIED', 'ACTIVATION_VERIFIED', 'RETURN_CONFIRMED', 'FAILED', 'UNRESOLVED', 'LOST_DECLARED'];

function formatTimeLeft(deadline: string | undefined): string | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return 'Overdue';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m left`;
}

function getNextActionLabel(task: Task): string | null {
  if (task.task_type === 'INSTALL') {
    switch (task.state) {
      case 'CLAIMED':
      case 'ASSIGNED': return 'Accept';
      case 'ACCEPTED': return 'Start Work';
      case 'SCHEDULED': return 'Mark Installed';
      default: return null;
    }
  }
  if (task.task_type === 'RESTORE') {
    switch (task.state) {
      case 'ALERTED':
      case 'ASSIGNED': return 'Accept';
      case 'ACCEPTED': return 'Start Work';
      case 'IN_PROGRESS': return 'Resolve';
      default: return null;
    }
  }
  if (task.task_type === 'NETBOX') {
    switch (task.state) {
      case 'ASSIGNED': return 'Accept';
      case 'ACCEPTED':
      case 'IN_PROGRESS': return 'Collect';
      case 'COLLECTED': return 'Return';
      default: return null;
    }
  }
  return null;
}

export default function TechDashboard({ tech, tasks, onSelectTask, onOpenProfile, onToggleAvailability }: TechDashboardProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const activeTasks = tasks.filter((t) => !TERMINAL_STATES.includes(t.state));
  const completedTasks = tasks.filter((t) => TERMINAL_STATES.includes(t.state));

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={onOpenProfile}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 700,
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {tech.name.charAt(0)}
            </button>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {tech.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--brand-primary)',
                    background: 'rgba(217,0,141,0.12)',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  Band {tech.band}
                </span>
              </div>
            </div>
          </div>

          {/* Availability toggle */}
          <button
            onClick={onToggleAvailability}
            style={{
              padding: '8px 14px',
              borderRadius: 20,
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              background: tech.available ? 'rgba(0,128,67,0.15)' : 'rgba(102,94,117,0.2)',
              color: tech.available ? 'var(--positive)' : 'var(--text-muted)',
            }}
          >
            {tech.available ? 'Available' : 'Unavailable'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* Active tasks */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.3,
            }}
          >
            Active Tasks ({activeTasks.length})
          </div>

          {activeTasks.length === 0 ? (
            <div
              style={{
                padding: '32px 20px',
                textAlign: 'center',
                background: 'var(--bg-card)',
                borderRadius: 12,
                color: 'var(--text-muted)',
                fontSize: 14,
              }}
            >
              No active tasks right now
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeTasks.map((task) => {
                const deadline = task.sla_deadline_at || task.due_at || task.pickup_due_at || task.return_due_at;
                const timeLeft = formatTimeLeft(deadline);
                const actionLabel = getNextActionLabel(task);

                return (
                  <button
                    key={task.task_id}
                    onClick={() => onSelectTask(task.task_id)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: getTypeColor(task.task_type),
                            background: `${getTypeColor(task.task_type)}18`,
                            padding: '2px 7px',
                            borderRadius: 4,
                            textTransform: 'uppercase',
                          }}
                        >
                          {task.task_type}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {task.connection_id || task.netbox_id}
                        </span>
                      </div>
                      {task.priority === 'HIGH' && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'var(--negative)',
                            background: 'rgba(224,30,0,0.12)',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          HIGH
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {task.customer_area} &middot; {task.state}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {timeLeft && (
                          <span
                            style={{
                              fontSize: 11,
                              color: timeLeft === 'Overdue' ? 'var(--negative)' : 'var(--warning)',
                              fontWeight: 600,
                            }}
                          >
                            {timeLeft}
                          </span>
                        )}
                        {actionLabel && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: 'var(--brand-primary)',
                            }}
                          >
                            {actionLabel} &rsaquo;
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <div>
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 0 12px',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                }}
              >
                Completed ({completedTasks.length})
              </span>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {historyOpen ? '\u25B2' : '\u25BC'}
              </span>
            </button>

            {historyOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {completedTasks.map((task) => (
                  <button
                    key={task.task_id}
                    onClick={() => onSelectTask(task.task_id)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      opacity: 0.7,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: getTypeColor(task.task_type),
                          background: `${getTypeColor(task.task_type)}18`,
                          padding: '2px 7px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                        }}
                      >
                        {task.task_type}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {task.connection_id || task.netbox_id}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {task.customer_area} &middot; {task.state}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
