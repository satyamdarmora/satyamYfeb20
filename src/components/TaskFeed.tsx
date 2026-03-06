'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import type { Task, TaskType } from '@/lib/types';
import { getBucket, sortTasksByQueue } from '@/lib/data';
import { useI18n } from '@/lib/i18n';
import TaskCard from './TaskCard';

interface TaskFeedProps {
  tasks: Task[];
  onAction: (taskId: string, action: string) => void;
  onCardClick: (taskId: string) => void;
}

type FilterType = 'ALL' | TaskType;

/** Terminal states -- tasks in these states are completed / closed and should
 *  not appear in the active feed (Zone A or Zone B). */
const TERMINAL_STATES: Set<string> = new Set([
  'ACTIVATION_VERIFIED',
  'VERIFIED',
  'RETURN_CONFIRMED',
  'LOST_DECLARED',
  'FAILED',
  'RESOLVED',
  'UNRESOLVED',
]);

export default function TaskFeed({ tasks, onAction, onCardClick }: TaskFeedProps) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<FilterType>('ALL');

  // --- Resolved task animation tracking ---
  // Track task IDs that just entered terminal state so we can show a brief "resolved" card
  const prevTaskMapRef = useRef<Map<string, string>>(new Map());
  // Remember the sorted order index of each task so fading cards stay in-place
  const prevOrderRef = useRef<Map<string, number>>(new Map());
  const [fadingTasks, setFadingTasks] = useState<Map<string, Task>>(new Map());

  useEffect(() => {
    const prevMap = prevTaskMapRef.current;
    const newFading = new Map<string, Task>();

    for (const task of tasks) {
      const prevState = prevMap.get(task.task_id);
      // Task just moved INTO a terminal state
      if (prevState && !TERMINAL_STATES.has(prevState) && TERMINAL_STATES.has(task.state)) {
        newFading.set(task.task_id, task);
      }
    }

    // Update prev map
    const nextMap = new Map<string, string>();
    for (const task of tasks) {
      nextMap.set(task.task_id, task.state);
    }
    prevTaskMapRef.current = nextMap;

    if (newFading.size > 0) {
      setFadingTasks((prev) => {
        const merged = new Map(prev);
        newFading.forEach((v, k) => merged.set(k, v));
        return merged;
      });

      // Remove after animation completes (2s)
      const ids = [...newFading.keys()];
      setTimeout(() => {
        setFadingTasks((prev) => {
          const next = new Map(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      }, 2000);
    }
  }, [tasks]);

  // Sort ALL tasks first (including those about to become terminal) to capture positions
  const allSorted = useMemo(() => sortTasksByQueue(tasks), [tasks]);

  // Update order map BEFORE filtering out terminal tasks — this captures each task's
  // position while it's still active, so fading cards appear in-place
  const prevZoneAOrder = useMemo(() => {
    const nonOffered = allSorted.filter((t) => t.state !== 'OFFERED');
    const orderMap = new Map<string, number>();
    nonOffered.forEach((t, i) => orderMap.set(t.task_id, i));
    // Only update ref if there are non-terminal tasks (avoid overwriting with empty on resolve)
    const hasActive = nonOffered.some((t) => !TERMINAL_STATES.has(t.state));
    if (hasActive || prevOrderRef.current.size === 0) {
      prevOrderRef.current = orderMap;
    }
    return prevOrderRef.current;
  }, [allSorted]);

  // Filter out terminal-state tasks before anything else
  const activeTasks = useMemo(
    () => tasks.filter((t) => !TERMINAL_STATES.has(t.state)),
    [tasks]
  );

  const sortedTasks = useMemo(() => sortTasksByQueue(activeTasks), [activeTasks]);

  const filteredTasks = useMemo(() => {
    if (filter === 'ALL') return sortedTasks;
    return sortedTasks.filter((t) => t.task_type === filter);
  }, [sortedTasks, filter]);

  // Zone A: non-OFFERED tasks (Your Tasks)
  const zoneATasks = useMemo(
    () => filteredTasks.filter((t) => t.state !== 'OFFERED'),
    [filteredTasks]
  );

  // Zone B: OFFERED tasks (Available)
  const zoneBTasks = useMemo(
    () =>
      filteredTasks
        .filter((t) => t.state === 'OFFERED')
        .sort((a, b) => {
          const aExp = a.offer_expires_at
            ? new Date(a.offer_expires_at).getTime()
            : Infinity;
          const bExp = b.offer_expires_at
            ? new Date(b.offer_expires_at).getTime()
            : Infinity;
          return aExp - bExp;
        }),
    [filteredTasks]
  );

  // Safety check: if filter hides bucket 0/1 tasks, show warning
  const hiddenCriticalCount = useMemo(() => {
    if (filter === 'ALL') return 0;
    return sortedTasks.filter((t) => {
      const bucket = getBucket(t);
      return (bucket === 0 || bucket === 1) && t.task_type !== filter;
    }).length;
  }, [sortedTasks, filter]);

  const filterChips: { label: string; value: FilterType }[] = [
    { label: t('feed.all'), value: 'ALL' },
    { label: t('feed.install'), value: 'INSTALL' },
    { label: t('feed.restore'), value: 'RESTORE' },
    { label: t('feed.netbox'), value: 'NETBOX' },
  ];

  const chipBaseStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.15s ease',
    userSelect: 'none',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    padding: '16px 0 8px',
  };

  // Fading resolved cards for Zone A
  const fadingZoneA = [...fadingTasks.values()].filter((t) => t.state !== 'OFFERED');

  return (
    <div style={{ padding: '0 20px' }}>
      {/* Filter chips */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 10,
          padding: '12px 0',
          overflowX: 'auto',
        }}
      >
        {filterChips.map((chip) => (
          <button
            key={chip.value}
            onClick={() => setFilter(chip.value)}
            style={{
              ...chipBaseStyle,
              background:
                filter === chip.value ? 'var(--brand-primary)' : 'var(--bg-secondary)',
              color: filter === chip.value ? '#FFFFFF' : 'var(--text-secondary)',
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Safety banner for hidden critical tasks */}
      {hiddenCriticalCount > 0 && (
        <div
          style={{
            background: 'var(--negative-subtle)',
            border: '1px solid rgba(224, 30, 0, 0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: 'var(--negative)',
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          {hiddenCriticalCount} {t('feed.hiddenCritical')}
        </div>
      )}

      {/* Zone A: Your Tasks */}
      <div style={sectionHeaderStyle}>
        {t('feed.yourTasks')}
        <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
          ({zoneATasks.length})
        </span>
      </div>

      {zoneATasks.length === 0 && fadingZoneA.length === 0 && (
        <div
          style={{
            padding: '20px 0',
            fontSize: 13,
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          {t('feed.noActive')}
        </div>
      )}

      {/* Merge active cards with fading resolved cards in their original position */}
      {(() => {
        const fadingIds = new Set(fadingZoneA.map((t) => t.task_id));
        const combined: { task: Task; isFading: boolean }[] = [];
        for (const task of zoneATasks) {
          if (!fadingIds.has(task.task_id)) {
            combined.push({ task, isFading: false });
          }
        }
        // Insert fading tasks at their remembered position (or at end)
        for (const task of fadingZoneA) {
          const prevIdx = prevZoneAOrder.get(task.task_id) ?? combined.length;
          const insertAt = Math.min(prevIdx, combined.length);
          combined.splice(insertAt, 0, { task, isFading: true });
        }
        return combined.map(({ task, isFading }) =>
          isFading ? (
            <div
              key={`fading-${task.task_id}`}
              style={{
                position: 'relative',
                marginBottom: 10,
                animation: 'resolvedPop 1.8s ease forwards',
              }}
            >
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 10,
                  borderLeft: '4px solid var(--positive)',
                  padding: '14px 16px',
                  opacity: 0.7,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--positive)' }}>
                    {task.task_type}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {task.connection_id || task.netbox_id || task.task_id}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {task.customer_area || '--'}
                </div>
              </div>
              {/* Resolved overlay with scale-in effect */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(0, 128, 67, 0.15)',
                  animation: 'overlayFadeIn 0.3s ease forwards',
                }}
              >
                <div
                  style={{
                    background: 'var(--positive)',
                    color: '#FFFFFF',
                    padding: '8px 24px',
                    borderRadius: 24,
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    animation: 'badgePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                    boxShadow: '0 4px 16px rgba(0, 128, 67, 0.4)',
                  }}
                >
                  {'\u2713'} {t('feed.resolved')}
                </div>
              </div>
            </div>
          ) : (
            <TaskCard
              key={task.task_id}
              task={task}
              bucket={getBucket(task)}
              onAction={onAction}
              onCardClick={onCardClick}
            />
          )
        );
      })()}

      {/* Zone B: Available */}
      <div
        style={{
          ...sectionHeaderStyle,
          marginTop: 8,
          paddingTop: 20,
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {t('feed.available')}
        <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
          ({zoneBTasks.length})
        </span>
      </div>

      {zoneBTasks.length === 0 && (
        <div
          style={{
            padding: '20px 0',
            fontSize: 13,
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          {t('feed.noAvailable')}
        </div>
      )}

      {zoneBTasks.map((task) => (
        <TaskCard
          key={task.task_id}
          task={task}
          bucket={getBucket(task)}
          onAction={onAction}
          onCardClick={onCardClick}
        />
      ))}

      {/* Bottom spacing */}
      <div style={{ height: 100 }} />
    </div>
  );
}
