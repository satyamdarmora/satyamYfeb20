'use client';

import React from 'react';
import type { Task, TimelineEvent } from '@/lib/types';
import { formatTimestamp, getStateColor, getTypeColor } from './AdminTypes';

interface TaskTableProps {
  tasks: Task[];
  expandedTaskId: string | null;
  setExpandedTaskId: (id: string | null) => void;
  getBucket: (task: Task) => number;
}

export function TaskTable({ tasks, expandedTaskId, setExpandedTaskId, getBucket }: TaskTableProps) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: 0,
            color: 'var(--text-primary)',
          }}
        >
          All Tasks
        </h2>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {['ID', 'Type', 'State', 'Priority', 'Area', 'Created', 'Bucket'].map(
                (header) => (
                  <th
                    key={header}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const isExpanded = expandedTaskId === task.task_id;
              return (
                <tr key={task.task_id} style={{ verticalAlign: 'top' }}>
                  <td colSpan={7} style={{ padding: 0 }}>
                    {/* Main row */}
                    <div
                      onClick={() =>
                        setExpandedTaskId(isExpanded ? null : task.task_id)
                      }
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'minmax(90px,1fr) 80px 120px 70px minmax(100px,1.5fr) 100px 60px',
                        cursor: 'pointer',
                        padding: '0',
                        borderBottom: isExpanded
                          ? 'none'
                          : '1px solid var(--bg-card)',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background =
                          'var(--bg-card-hover)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background =
                          'transparent';
                      }}
                    >
                      <div
                        style={{
                          padding: '10px 14px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {task.task_id}
                      </div>
                      <div
                        style={{
                          padding: '10px 14px',
                          color: getTypeColor(task.task_type),
                          fontWeight: 600,
                        }}
                      >
                        {task.task_type}
                      </div>
                      <div
                        style={{
                          padding: '10px 14px',
                          color: getStateColor(task.state),
                          fontWeight: 500,
                        }}
                      >
                        {task.state}
                      </div>
                      <div
                        style={{
                          padding: '10px 14px',
                          color:
                            task.priority === 'HIGH'
                              ? 'var(--negative)'
                              : 'var(--text-secondary)',
                          fontWeight: task.priority === 'HIGH' ? 700 : 400,
                        }}
                      >
                        {task.priority}
                      </div>
                      <div
                        style={{
                          padding: '10px 14px',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {task.customer_area || '--'}
                      </div>
                      <div
                        style={{
                          padding: '10px 14px',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatTimestamp(task.created_at)}
                      </div>
                      <div
                        style={{
                          padding: '10px 14px',
                          color: 'var(--text-muted)',
                          textAlign: 'center',
                        }}
                      >
                        {getBucket(task)}
                      </div>
                    </div>

                    {/* Expanded timeline */}
                    {isExpanded && (
                      <div
                        style={{
                          padding: '12px 20px 16px',
                          background: 'var(--bg-primary)',
                          borderBottom: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            marginBottom: 12,
                          }}
                        >
                          Event Timeline
                        </div>

                        {/* Info grid */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '8px 24px',
                            marginBottom: 16,
                            fontSize: 12,
                          }}
                        >
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>ID: </span>
                            <span style={{ color: 'var(--text-primary)' }}>
                              {task.connection_id || task.netbox_id || '--'}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Assigned: </span>
                            <span style={{ color: 'var(--text-primary)' }}>
                              {task.assigned_to || 'Unassigned'}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Delegation: </span>
                            <span style={{ color: 'var(--text-primary)' }}>
                              {task.delegation_state}
                            </span>
                          </div>
                          {task.queue_escalation_flag && (
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Flag: </span>
                              <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                                {task.queue_escalation_flag}
                              </span>
                            </div>
                          )}
                          {task.retry_count > 0 && (
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Retries: </span>
                              <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                                {task.retry_count}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Timeline */}
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
                            .sort(
                              (a, b) =>
                                new Date(a.timestamp).getTime() -
                                new Date(b.timestamp).getTime()
                            )
                            .map((event: TimelineEvent, i: number) => (
                              <div
                                key={i}
                                style={{
                                  position: 'relative',
                                  paddingBottom:
                                    i < task.event_log.length - 1 ? 14 : 0,
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
                                      event.actor_type === 'SYSTEM'
                                        ? 'var(--text-muted)'
                                        : event.actor_type === 'CSP'
                                          ? 'var(--brand-primary)'
                                          : event.actor_type === 'ADMIN'
                                            ? 'var(--warning)'
                                            : 'var(--positive)',
                                    border: '2px solid var(--bg-primary)',
                                  }}
                                />
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'baseline',
                                    marginBottom: 2,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: 'var(--text-muted)',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {formatTimestamp(event.timestamp)}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      color:
                                        event.actor_type === 'SYSTEM'
                                          ? 'var(--text-muted)'
                                          : 'var(--text-secondary)',
                                    }}
                                  >
                                    {event.actor}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: 'var(--text-primary)',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {event.detail}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {tasks.length === 0 && (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            fontSize: 14,
            color: 'var(--text-muted)',
          }}
        >
          No tasks found
        </div>
      )}
    </div>
  );
}
