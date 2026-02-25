'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Task, AssuranceState, TimelineEvent, AppNotification, Technician, WalletState } from '@/lib/types';
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
import AuthGuard from '@/components/AuthGuard';
import { getAuth } from '@/lib/auth';

type ActiveSection = null | 'wallet' | 'team' | 'netbox' | 'sla' | 'support' | 'policies' | 'profile';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('wiom_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

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

// API-only task update: POST to /api/tasks with state transition
async function updateTaskViaApi(taskId: string, updates: Partial<Task> & { detail?: string }) {
  await fetch('/api/tasks', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ task_id: taskId, updates }),
  });
}

export default function HomePage() {
  return (
    <AuthGuard>
      <HomePageContent />
    </AuthGuard>
  );
}

function HomePageContent() {
  const { t } = useI18n();
  const auth = getAuth();
  const userName = auth?.user?.name || 'CSP Partner';
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
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks', { headers: authHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) setTasks(data);
    } catch {
      // API not available, skip
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadInitial = async () => {
      await Promise.all([
        fetchTasks(),
        (async () => {
          try {
            const res = await fetch('/api/assurance', { headers: authHeaders() });
            const data = await res.json();
            if (data) setAssurance(data);
          } catch {}
        })(),
        (async () => {
          try {
            const res = await fetch('/api/technician/register', { headers: authHeaders() });
            const data = await res.json();
            if (Array.isArray(data)) setTechnicians(data);
          } catch {}
        })(),
      ]);
    };
    loadInitial();
  }, [fetchTasks]);

  // Poll tasks every 3 seconds
  const taskPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    taskPollRef.current = setInterval(fetchTasks, 3000);
    return () => {
      if (taskPollRef.current) clearInterval(taskPollRef.current);
    };
  }, [fetchTasks]);

  // Poll server for assurance state changes
  const assurancePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    assurancePollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/assurance', { headers: authHeaders() });
        const data = await res.json();
        if (data) setAssurance(data);
      } catch {}
    }, 2000);
    return () => {
      if (assurancePollRef.current) clearInterval(assurancePollRef.current);
    };
  }, []);

  // Poll wallet state for lifetime earnings
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch('/api/wallet', { headers: authHeaders() });
        const data: WalletState = await res.json();
        if (data) setWalletData(data);
      } catch {}
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
        fetchTasks();
      } else if (activeSection) {
        setActiveSection(null);
        fetchTasks();
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
  }, [selectedTaskId, activeSection, menuOpen, assignPickerOpen, fetchTasks]);

  // Poll server API for notifications every 2 seconds
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/notifications', { headers: authHeaders() });
        const notifications: AppNotification[] = await res.json();
        const undismissed = notifications.find((n: AppNotification) => {
          if (n.dismissed) return false;
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
      } catch {}
    }, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeNotification, offersEnabled]);

  const refreshTasks = useCallback(() => {
    fetchTasks();
  }, [fetchTasks]);

  const showConfirmation = useCallback((msg: string) => {
    setConfirmMsg(msg);
    setTimeout(() => setConfirmMsg(null), 3000);
  }, []);

  const handleDismissNotification = useCallback(async () => {
    if (activeNotification) {
      try {
        await fetch('/api/notifications/dismiss', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ id: activeNotification.id }),
        });
      } catch {}
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
    async (taskId: string, tech: Technician) => {
      const task = tasks.find(t => t.task_id === taskId);
      if (!task) return;

      // Advance state based on task type
      let nextState = task.state;
      if (task.task_type === 'RESTORE') {
        nextState = task.state === 'ALERTED' ? 'ASSIGNED' : 'IN_PROGRESS';
      } else if (task.task_type === 'NETBOX') {
        nextState = task.state === 'PICKUP_REQUIRED' ? 'ASSIGNED' : 'IN_PROGRESS';
      } else if (task.task_type === 'INSTALL') {
        nextState = task.state === 'ACCEPTED' ? 'SCHEDULED' : task.state;
      }

      await updateTaskViaApi(taskId, {
        state: nextState,
        delegation_state: 'ASSIGNED',
        assigned_to: tech.name,
        detail: `Task assigned to ${tech.name} (${tech.id}). Delegation state: ASSIGNED.`,
      });

      showConfirmation(`${taskId} assigned to ${tech.name}.`);
      setSelectedTaskId(null);
      refreshTasks();
    },
    [tasks, refreshTasks, showConfirmation]
  );

  const handleAction = useCallback(
    async (taskId: string, action: string, extra?: Record<string, string>) => {
      const task = tasks.find(t => t.task_id === taskId);
      if (!task) return;

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
          await updateTaskViaApi(taskId, {
            state: 'CLAIMED',
            detail: 'CSP claimed this task. Accept deadline: 15 min.',
          });
          notifyNewConnection();
          showConfirmation(`Claimed ${taskId}. Accept within 15 min.`);
          break;
        }

        case 'CLAIM_AND_ASSIGN': {
          const slot = extra?.preferred_slot || 'Today';
          await updateTaskViaApi(taskId, {
            state: 'ACCEPTED',
            detail: `CSP claimed and accepted. Preferred slot: ${slot}.`,
          });
          notifyNewConnection();
          showConfirmation(`Claimed ${taskId}. Slot: ${slot}. Now assign a technician.`);
          setSelectedTaskId(null);
          await refreshTasks();
          setAssignTaskId(taskId);
          setAssignPickerOpen(true);
          return;
        }

        case 'DECLINE': {
          const reason = extra?.reason || 'No reason provided';
          await updateTaskViaApi(taskId, {
            state: 'FAILED',
            detail: `CSP declined this offer. Reason: ${reason}`,
          });
          showConfirmation(`${taskId} declined.`);
          setSelectedTaskId(null);
          break;
        }

        case 'ACCEPT': {
          await updateTaskViaApi(taskId, {
            state: 'ACCEPTED',
            detail: 'CSP accepted this task. Ready to schedule.',
          });
          showConfirmation(`Accepted ${taskId}. Schedule or assign a technician.`);
          break;
        }

        case 'SCHEDULE':
        case 'ASSIGN': {
          setAssignTaskId(taskId);
          setAssignPickerOpen(true);
          return;
        }

        case 'START_WORK': {
          await updateTaskViaApi(taskId, {
            state: 'IN_PROGRESS',
            delegation_state: 'IN_PROGRESS',
            detail: 'CSP started work on this task (self-assigned).',
          });
          showConfirmation(`${taskId} -- Work started.`);
          break;
        }

        case 'RESOLVE': {
          await updateTaskViaApi(taskId, {
            state: 'RESOLVED',
            delegation_state: 'DONE',
            detail: 'Task marked as resolved by CSP.',
          });
          showConfirmation(`${taskId} marked as resolved.`);
          break;
        }

        case 'RESOLVE_BLOCKED': {
          await updateTaskViaApi(taskId, {
            state: 'IN_PROGRESS',
            detail: 'Block resolved. Task resumed.',
          });
          showConfirmation(`${taskId} unblocked and resumed.`);
          break;
        }

        case 'COLLECTED': {
          await updateTaskViaApi(taskId, {
            state: 'COLLECTED',
            detail: 'NetBox collected from customer premises.',
          });
          showConfirmation(`${taskId} -- NetBox marked as collected.`);
          break;
        }

        case 'CONFIRM_RETURN': {
          await updateTaskViaApi(taskId, {
            state: 'RETURN_CONFIRMED',
            delegation_state: 'DONE',
            detail: 'NetBox return confirmed and recorded.',
          });
          showConfirmation(`${taskId} -- Return confirmed.`);
          break;
        }

        case 'VERIFY': {
          await updateTaskViaApi(taskId, {
            state: 'ACTIVATION_VERIFIED',
            detail: 'Activation manually verified by CSP.',
          });
          showConfirmation(`${taskId} -- Activation verified. \u20B9300 earned.`);

          // Credit earning
          fetch('/api/assurance', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ increment_cycle_earned: 300 }),
          }).catch(() => {});
          fetch('/api/notifications', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
              id: 'NOTIF-' + Date.now(),
              type: 'SETTLEMENT_CREDIT',
              title: 'Install Earning Credited',
              amount: 300,
              message: `\u20B9300 earned \u2014 Install activation for ${task.connection_id || taskId}`,
              timestamp: new Date().toISOString(),
              dismissed: false,
            }),
          }).catch(() => {});
          break;
        }

        case 'INSTALL': {
          await updateTaskViaApi(taskId, {
            state: 'INSTALLED',
            detail: 'Hardware installation completed. Pending activation verification.',
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

      // After action: refresh and check terminal
      await refreshTasks();
      // Check from the action we just performed if it's terminal
      if (terminalStates.includes(
        action === 'CLAIM' ? 'CLAIMED' :
        action === 'DECLINE' ? 'FAILED' :
        action === 'RESOLVE' ? 'RESOLVED' :
        action === 'VERIFY' ? 'ACTIVATION_VERIFIED' :
        action === 'CONFIRM_RETURN' ? 'RETURN_CONFIRMED' :
        ''
      )) {
        setSelectedTaskId(null);
      }
    },
    [tasks, refreshTasks, showConfirmation]
  );

  const handleCardClick = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedTaskId(null);
    refreshTasks();
  }, [refreshTasks]);

  const selectedTask = selectedTaskId ? tasks.find(t => t.task_id === selectedTaskId) || null : null;

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
              {userName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              {userName}
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
          onAction={async (taskId, action, extra) => {
            await handleAction(taskId, action, extra);
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
