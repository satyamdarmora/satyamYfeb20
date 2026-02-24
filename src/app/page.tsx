'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Task, AssuranceState, TimelineEvent, AppNotification, Technician, WalletState } from '@/lib/types';
import {
  getAllTasks,
  getAssuranceState,
  updateTask as _updateTask,
  getTaskById,
  getTechnicians,
} from '@/lib/data';

// Wrapper: update client-side AND sync to server so API routes see the change
function updateTask(id: string, updates: Partial<Task>) {
  _updateTask(id, updates);
  fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: id, updates }),
  }).catch(() => {});
}
import { useI18n } from '@/lib/i18n';
import AssuranceStrip from '@/components/AssuranceStrip';
import TaskFeed from '@/components/TaskFeed';
import TaskDetail from '@/components/TaskDetail';
import SecondaryMenu from '@/components/SecondaryMenu';
import EventModal from '@/components/EventModal';
import WalletHub from '@/components/WalletHub';
import TeamHub from '@/components/TeamHub';
import SupportHub from '@/components/SupportHub';
import NetBoxHub from '@/components/NetBoxHub';
import SLAHub from '@/components/SLAHub';
import ProfilePage from '@/components/ProfilePage';
import PoliciesPage from '@/components/PoliciesPage';
import { notifyNewConnection, notifyUrgentAlert } from '@/lib/feedback';

type ActiveSection = null | 'wallet' | 'team' | 'netbox' | 'sla' | 'support' | 'policies' | 'profile';

function makeTimelineEvent(
  eventType: string,
  actor: string,
  actorType: 'SYSTEM' | 'CSP' | 'ADMIN' | 'TECHNICIAN',
  detail: string
): TimelineEvent {
  return {
    timestamp: new Date().toISOString(),
    event_type: eventType,
    actor,
    actor_type: actorType,
    detail,
  };
}

export default function HomePage() {
  const { t } = useI18n();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assurance, setAssurance] = useState<AssuranceState | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [offersEnabled, setOffersEnabled] = useState(true);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  // Navigation state
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Notification / Event Modal state
  const [activeNotification, setActiveNotification] = useState<AppNotification | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Wallet state for lifetime earnings
  const [walletData, setWalletData] = useState<WalletState | null>(null);
  const walletPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Technician picker state
  const [assignPickerOpen, setAssignPickerOpen] = useState(false);
  const [assignTaskId, setAssignTaskId] = useState<string | null>(null);

  useEffect(() => {
    setTasks(getAllTasks());
    setAssurance(getAssuranceState());
  }, []);

  // Poll server for assurance state changes (admin SLA/exposure triggers)
  const assurancePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    assurancePollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/assurance');
        const data = await res.json();
        if (data) setAssurance(data);
      } catch {
        // API not available, skip
      }
    }, 2000);
    return () => {
      if (assurancePollRef.current) clearInterval(assurancePollRef.current);
    };
  }, []);

  // Poll wallet state for lifetime earnings
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch('/api/wallet');
        const data: WalletState = await res.json();
        if (data) setWalletData(data);
      } catch {
        // API not available, skip
      }
    };
    fetchWallet();
    walletPollRef.current = setInterval(fetchWallet, 5000);
    return () => {
      if (walletPollRef.current) clearInterval(walletPollRef.current);
    };
  }, []);

  // Compute lifetime earnings from wallet transactions
  const lifetimeEarnings = walletData
    ? walletData.transactions
        .filter((t) => (t.type === 'SETTLEMENT' || t.type === 'BONUS') && t.status === 'COMPLETED')
        .reduce((s, t) => s + t.amount, 0)
    : undefined;

  // Prevent browser back from leaving the app
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      if (selectedTaskId) {
        setSelectedTaskId(null);
        setTasks(getAllTasks());
      } else if (activeSection) {
        setActiveSection(null);
        setTasks(getAllTasks());
      } else if (menuOpen) {
        setMenuOpen(false);
      } else if (assignPickerOpen) {
        setAssignPickerOpen(false);
        setAssignTaskId(null);
      } else {
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedTaskId, activeSection, menuOpen, assignPickerOpen]);

  // Poll server API for notifications every 2 seconds (works cross-device)
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/notifications');
        const notifications: AppNotification[] = await res.json();
        const undismissed = notifications.find((n: AppNotification) => {
          if (n.dismissed) return false;
          // If offers are off, suppress offer notifications
          if (!offersEnabled && n.type === 'NEW_OFFER') return false;
          return true;
        });
        if (undismissed && !activeNotification) {
          setActiveNotification(undismissed);
          if (undismissed.type === 'HIGH_RESTORE_ALERT') {
            notifyUrgentAlert();
          } else {
            notifyNewConnection();
          }
        }
      } catch {
        // API not available, skip
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeNotification, offersEnabled]);

  const refreshTasks = useCallback(() => {
    setTasks(getAllTasks());
  }, []);

  const showConfirmation = useCallback((msg: string) => {
    setConfirmMsg(msg);
    setTimeout(() => setConfirmMsg(null), 3000);
  }, []);

  const handleDismissNotification = useCallback(async () => {
    if (activeNotification) {
      try {
        await fetch('/api/notifications/dismiss', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: activeNotification.id }),
        });
      } catch {
        // Fallback silently
      }
      setActiveNotification(null);
    }
  }, [activeNotification]);

  const handleNavigate = useCallback((section: string) => {
    setActiveSection(section as ActiveSection);
  }, []);

  const handleBackToHome = useCallback(() => {
    setActiveSection(null);
    refreshTasks();
  }, [refreshTasks]);

  // Perform the actual assign with a specific technician
  const doAssign = useCallback(
    (taskId: string, tech: Technician) => {
      const task = getTaskById(taskId);
      if (!task) return;

      const newEvent = (type: string, detail: string): TimelineEvent =>
        makeTimelineEvent(type, 'CSP-MH-1001', 'CSP', detail);

      // Advance state based on task type
      let nextState = task.state;
      if (task.task_type === 'RESTORE') {
        nextState = task.state === 'ALERTED' ? 'ASSIGNED' : 'IN_PROGRESS';
      } else if (task.task_type === 'NETBOX') {
        nextState = task.state === 'PICKUP_REQUIRED' ? 'ASSIGNED' : 'IN_PROGRESS';
      } else if (task.task_type === 'INSTALL') {
        nextState = task.state === 'ACCEPTED' ? 'SCHEDULED' : task.state;
      }

      updateTask(taskId, {
        state: nextState,
        delegation_state: 'ASSIGNED',
        assigned_to: tech.name,
        event_log: [
          ...task.event_log,
          newEvent(
            'ASSIGNED',
            `Task assigned to ${tech.name} (${tech.id}). Delegation state: ASSIGNED.`
          ),
        ],
      });

      showConfirmation(`${taskId} assigned to ${tech.name}.`);
      // Go back to home after assigning
      setSelectedTaskId(null);
      refreshTasks();
    },
    [refreshTasks, showConfirmation]
  );

  const handleAction = useCallback(
    (taskId: string, action: string, extra?: Record<string, string>) => {
      const task = getTaskById(taskId);
      if (!task) return;

      const newEvent = (type: string, detail: string): TimelineEvent =>
        makeTimelineEvent(type, 'CSP-MH-1001', 'CSP', detail);

      const terminalStates = [
        'ACTIVATION_VERIFIED',
        'VERIFIED',
        'RETURN_CONFIRMED',
        'LOST_DECLARED',
        'FAILED',
        'RESOLVED',
        'UNRESOLVED',
      ];

      switch (action) {
        case 'CLAIM': {
          updateTask(taskId, {
            state: 'CLAIMED',
            offer_expires_at: undefined,
            queue_escalation_flag: undefined,
            accept_expires_at: new Date(
              Date.now() + 15 * 60 * 1000
            ).toISOString(),
            event_log: [
              ...task.event_log,
              newEvent('CLAIMED', 'CSP claimed this task. Accept deadline: 15 min.'),
            ],
          });
          notifyNewConnection();
          showConfirmation(`Claimed ${taskId}. Accept within 15 min.`);
          break;
        }

        case 'CLAIM_AND_ASSIGN': {
          // Claim + accept + schedule in one flow, then open technician picker
          const slot = extra?.preferred_slot || 'Today';
          updateTask(taskId, {
            state: 'ACCEPTED',
            offer_expires_at: undefined,
            accept_expires_at: undefined,
            queue_escalation_flag: undefined,
            event_log: [
              ...task.event_log,
              newEvent('CLAIMED', `CSP claimed this task. Preferred slot: ${slot}.`),
              makeTimelineEvent('ACCEPTED', 'CSP-MH-1001', 'CSP', `CSP accepted. Scheduled for: ${slot}.`),
            ],
          });
          notifyNewConnection();
          showConfirmation(`Claimed ${taskId}. Slot: ${slot}. Now assign a technician.`);
          setSelectedTaskId(null);
          refreshTasks();
          // Open technician picker
          setAssignTaskId(taskId);
          setAssignPickerOpen(true);
          return;
        }

        case 'DECLINE': {
          const reason = extra?.reason || 'No reason provided';
          updateTask(taskId, {
            state: 'FAILED',
            queue_escalation_flag: undefined,
            event_log: [
              ...task.event_log,
              newEvent('DECLINED', `CSP declined this offer. Reason: ${reason}`),
            ],
          });
          showConfirmation(`${taskId} declined.`);
          setSelectedTaskId(null);
          break;
        }

        case 'ACCEPT': {
          updateTask(taskId, {
            state: 'ACCEPTED',
            accept_expires_at: undefined,
            queue_escalation_flag: undefined,
            event_log: [
              ...task.event_log,
              newEvent('ACCEPTED', 'CSP accepted this task. Ready to schedule.'),
            ],
          });
          showConfirmation(`Accepted ${taskId}. Schedule or assign a technician.`);
          break;
        }

        case 'SCHEDULE':
        case 'ASSIGN': {
          // Open technician picker instead of auto-assigning
          setAssignTaskId(taskId);
          setAssignPickerOpen(true);
          return; // Don't refresh yet; picker will handle it
        }

        case 'START_WORK': {
          updateTask(taskId, {
            state: 'IN_PROGRESS',
            delegation_state: 'IN_PROGRESS',
            event_log: [
              ...task.event_log,
              newEvent('IN_PROGRESS', `CSP started work on this task (self-assigned).`),
            ],
          });
          showConfirmation(`${taskId} -- Work started.`);
          break;
        }

        case 'RESOLVE': {
          updateTask(taskId, {
            state: 'RESOLVED',
            queue_escalation_flag: undefined,
            delegation_state: 'DONE',
            event_log: [
              ...task.event_log,
              newEvent('RESOLVED', 'Task marked as resolved by CSP.'),
            ],
          });
          showConfirmation(`${taskId} marked as resolved.`);
          break;
        }

        case 'RESOLVE_BLOCKED': {
          updateTask(taskId, {
            state: 'IN_PROGRESS',
            queue_escalation_flag: undefined,
            blocked_reason: undefined,
            event_log: [
              ...task.event_log,
              newEvent('UNBLOCKED', 'Block resolved. Task resumed.'),
            ],
          });
          showConfirmation(`${taskId} unblocked and resumed.`);
          break;
        }

        case 'COLLECTED': {
          updateTask(taskId, {
            state: 'COLLECTED',
            event_log: [
              ...task.event_log,
              newEvent('COLLECTED', 'NetBox collected from customer premises.'),
            ],
          });
          showConfirmation(`${taskId} -- NetBox marked as collected.`);
          break;
        }

        case 'CONFIRM_RETURN': {
          updateTask(taskId, {
            state: 'RETURN_CONFIRMED',
            queue_escalation_flag: undefined,
            delegation_state: 'DONE',
            event_log: [
              ...task.event_log,
              newEvent('RETURN_CONFIRMED', 'NetBox return confirmed and recorded.'),
            ],
          });
          showConfirmation(`${taskId} -- Return confirmed.`);
          break;
        }

        case 'VERIFY': {
          updateTask(taskId, {
            state: 'ACTIVATION_VERIFIED',
            queue_escalation_flag: undefined,
            event_log: [
              ...task.event_log,
              newEvent(
                'ACTIVATION_VERIFIED',
                'Activation manually verified by CSP.'
              ),
            ],
          });
          showConfirmation(`${taskId} -- Activation verified. \u20B9300 earned.`);

          // Credit ₹300 per-install earning
          const connId = task.connection_id || taskId;
          fetch('/api/assurance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              increment_cycle_earned: 300,
              increment_next_settlement: 300,
            }),
          }).catch(() => {});
          fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: 'NOTIF-' + Date.now(),
              type: 'SETTLEMENT_CREDIT',
              title: 'Install Earning Credited',
              amount: 300,
              message: `\u20B9300 earned \u2014 Install activation for ${connId}`,
              timestamp: new Date().toISOString(),
              dismissed: false,
            }),
          }).catch(() => {});
          break;
        }

        case 'INSTALL': {
          updateTask(taskId, {
            state: 'INSTALLED',
            queue_escalation_flag: 'VERIFICATION_PENDING',
            event_log: [
              ...task.event_log,
              newEvent(
                'INSTALLED',
                'Hardware installation completed. Pending activation verification.'
              ),
            ],
          });
          showConfirmation(`${taskId} -- Installation completed. Verification pending.`);
          break;
        }

        case 'VIEW':
        default:
          setSelectedTaskId(taskId);
          refreshTasks();
          return;
      }

      // After action: check if the task moved to a terminal state
      const updated = getTaskById(taskId);
      if (updated && terminalStates.includes(updated.state)) {
        setSelectedTaskId(null);
      }

      refreshTasks();
    },
    [refreshTasks, showConfirmation]
  );

  const handleCardClick = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedTaskId(null);
    refreshTasks();
  }, [refreshTasks]);

  const selectedTask = selectedTaskId ? getTaskById(selectedTaskId) : null;

  // Get technicians for picker
  const technicians = getTechnicians();

  if (!assurance) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        maxWidth: 500,
        margin: '0 auto',
        position: 'relative',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Confirmation toast */}
      {confirmMsg && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            background: 'var(--brand-primary)',
            border: '1px solid var(--brand-light)',
            borderRadius: 10,
            padding: '14px 24px',
            fontSize: 14,
            color: '#FFFFFF',
            fontWeight: 600,
            maxWidth: 400,
            textAlign: 'center',
            boxShadow: '0 6px 24px rgba(217, 0, 141, 0.4)',
          }}
        >
          {confirmMsg}
        </div>
      )}

      {/* Sticky header + Assurance Strip */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'var(--bg-primary)',
        }}
      >
        {/* Top header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div
            onClick={() => setActiveSection('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                color: '#FFFFFF',
              }}
            >
              C
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              CSP-MH-1001
            </span>
          </div>
          <button
            onClick={() => setMenuOpen(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            &#9776;
          </button>
        </div>

        <AssuranceStrip assuranceState={assurance} lifetimeEarnings={lifetimeEarnings} onOpenSLA={() => setActiveSection('sla')} />
      </div>

      {/* Capability Reset Banner */}
      {assurance.capability_reset_active && (
        <div
          style={{
            margin: '0 12px',
            padding: '14px 16px',
            background: 'rgba(255,128,0,0.10)',
            border: '1px solid rgba(255,128,0,0.35)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            marginTop: 8,
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>{'\u26A0'}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning)', marginBottom: 4 }}>
              {t('capabilityReset.title')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {assurance.capability_reset_reason || t('capabilityReset.desc')}
            </div>
          </div>
        </div>
      )}

      {/* Task Feed */}
      <TaskFeed
        tasks={tasks}
        onAction={handleAction}
        onCardClick={handleCardClick}
      />

      {/* Task Detail overlay */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onBack={handleBack}
          onAction={(taskId, action, extra) => {
            handleAction(taskId, action, extra);
            // Refresh the selected task after action
            const updated = getTaskById(taskId);
            if (updated) {
              // If it moved to a terminal state, go back
              const terminalStates = [
                'ACTIVATION_VERIFIED',
                'VERIFIED',
                'RETURN_CONFIRMED',
                'LOST_DECLARED',
                'FAILED',
                'RESOLVED',
                'UNRESOLVED',
              ];
              if (terminalStates.includes(updated.state)) {
                setSelectedTaskId(null);
              }
            }
            refreshTasks();
          }}
        />
      )}

      {/* Technician Picker Bottom Sheet */}
      {assignPickerOpen && assignTaskId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          {/* Overlay */}
          <div
            onClick={() => { setAssignPickerOpen(false); setAssignTaskId(null); }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--overlay-bg)',
            }}
          />
          {/* Bottom sheet */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 500,
              background: 'var(--bg-secondary)',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: '16px 0',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--text-muted)' }} />
            </div>

            <div style={{ padding: '0 20px 8px', borderBottom: '1px solid var(--bg-card)' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Assign to Technician
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Task: {assignTaskId}
              </div>
            </div>

            <div style={{ padding: '8px 0', maxHeight: '50vh', overflowY: 'auto' }}>
              {/* Self-assign option */}
              <button
                onClick={() => {
                  doAssign(assignTaskId, { id: 'CSP-MH-1001', name: 'Self (CSP-MH-1001)', band: 'A', available: true, csp_id: 'CSP-MH-1001', phone: '', join_date: '2025-01-01', completed_count: 0 });
                  setAssignPickerOpen(false);
                  setAssignTaskId(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  width: '100%',
                  padding: '16px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--bg-card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--brand-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    flexShrink: 0,
                  }}
                >
                  C
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Myself (CSP)
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    I will handle this task
                  </div>
                </div>
                <div style={{ color: 'var(--brand-primary)', fontSize: 12, fontWeight: 600 }}>
                  Self
                </div>
              </button>

              {technicians.map((tech) => (
                <button
                  key={tech.id}
                  onClick={() => {
                    doAssign(assignTaskId, tech);
                    setAssignPickerOpen(false);
                    setAssignTaskId(null);
                  }}
                  disabled={!tech.available}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    width: '100%',
                    padding: '16px 20px',
                    background: 'transparent',
                    border: 'none',
                    cursor: tech.available ? 'pointer' : 'default',
                    textAlign: 'left',
                    opacity: tech.available ? 1 : 0.4,
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: tech.available ? 'var(--bg-card)' : 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 700,
                      color: tech.available ? 'var(--brand-primary)' : 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  >
                    {tech.name.charAt(0)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {tech.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Band {tech.band} {!tech.available && '-- Unavailable'}
                    </div>
                  </div>

                  {tech.available && (
                    <div style={{ color: 'var(--positive)', fontSize: 12, fontWeight: 600 }}>
                      Available
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Cancel */}
            <div style={{ padding: '12px 20px' }}>
              <button
                onClick={() => { setAssignPickerOpen(false); setAssignTaskId(null); }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--bg-card)',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Menu (bottom sheet) */}
      <SecondaryMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Event Modal for notifications */}
      <EventModal
        notification={activeNotification}
        onDismiss={handleDismissNotification}
        onView={(taskId) => {
          refreshTasks();
          setSelectedTaskId(taskId);
        }}
      />

      {/* Section overlays */}
      {activeSection === 'wallet' && <WalletHub onBack={handleBackToHome} />}
      {activeSection === 'team' && <TeamHub onBack={handleBackToHome} />}
      {activeSection === 'support' && <SupportHub onBack={handleBackToHome} />}
      {activeSection === 'netbox' && <NetBoxHub onBack={handleBackToHome} />}
      {activeSection === 'sla' && <SLAHub onBack={handleBackToHome} />}
      {activeSection === 'profile' && <ProfilePage onBack={handleBackToHome} offersEnabled={offersEnabled} onOffersToggle={setOffersEnabled} />}
      {activeSection === 'policies' && <PoliciesPage onBack={handleBackToHome} />}
    </div>
  );
}
