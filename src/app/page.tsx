'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Task, AssuranceState, TimelineEvent, AppNotification, Technician } from '@/lib/types';
import {
  getAllTasks,
  getAssuranceState,
  updateTask,
  getTaskById,
  getTechnicians,
} from '@/lib/data';
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
import ProfilePage from '@/components/ProfilePage';
import PoliciesPage from '@/components/PoliciesPage';
import { notifyNewConnection, notifyUrgentAlert } from '@/lib/feedback';

type ActiveSection = null | 'wallet' | 'team' | 'netbox' | 'support' | 'policies' | 'profile';

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

  // Technician picker state
  const [assignPickerOpen, setAssignPickerOpen] = useState(false);
  const [assignTaskId, setAssignTaskId] = useState<string | null>(null);

  useEffect(() => {
    setTasks(getAllTasks());
    setAssurance(getAssuranceState());
  }, []);

  // Poll server API for notifications every 2 seconds (works cross-device)
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/notifications');
        const notifications: AppNotification[] = await res.json();
        const undismissed = notifications.find((n: AppNotification) => !n.dismissed);
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
  }, [activeNotification]);

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
          updateTask(taskId, {
            state: 'FAILED',
            queue_escalation_flag: undefined,
            event_log: [
              ...task.event_log,
              newEvent('DECLINED', 'CSP declined this offer.'),
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
          showConfirmation(`${taskId} -- Activation verified.`);
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
        maxWidth: 480,
        margin: '0 auto',
        position: 'relative',
        background: '#161021',
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
            background: '#D9008D',
            border: '1px solid #FFB2E4',
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

      {/* Fixed Assurance Strip + More button */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#161021',
        }}
      >
        <div style={{ position: 'relative' }}>
          <AssuranceStrip assuranceState={assurance} />
          {/* More button */}
          <button
            onClick={() => setMenuOpen(true)}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#443152',
              border: '1px solid #352D42',
              color: '#A7A1B2',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              lineHeight: 1,
              zIndex: 101,
            }}
          >
            &#9776;
          </button>
        </div>
      </div>

      {/* Task Feed */}
      <TaskFeed
        tasks={tasks}
        onAction={handleAction}
        onCardClick={handleCardClick}
      />

      {/* Offer toggle */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          padding: '12px 16px',
          background: 'linear-gradient(transparent, #161021 30%)',
          zIndex: 50,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 12, color: '#665E75' }}>
            {t('home.offerNotifications')}
          </span>
          <button
            onClick={() => setOffersEnabled(!offersEnabled)}
            style={{
              background: offersEnabled ? '#D9008D' : '#352D42',
              color: offersEnabled ? '#FFFFFF' : '#665E75',
              border: 'none',
              borderRadius: 16,
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {offersEnabled ? t('home.on') : t('home.off')}
          </button>
        </div>
      </div>

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
              background: 'rgba(0, 0, 0, 0.6)',
            }}
          />
          {/* Bottom sheet */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 480,
              background: '#352D42',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: '16px 0',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#665E75' }} />
            </div>

            <div style={{ padding: '0 20px 8px', borderBottom: '1px solid #443152' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#FAF9FC', marginBottom: 4 }}>
                Assign to Technician
              </div>
              <div style={{ fontSize: 12, color: '#A7A1B2' }}>
                Task: {assignTaskId}
              </div>
            </div>

            <div style={{ padding: '8px 0', maxHeight: '50vh', overflowY: 'auto' }}>
              {/* Self-assign option */}
              <button
                onClick={() => {
                  doAssign(assignTaskId, { id: 'CSP-MH-1001', name: 'Self (CSP-MH-1001)', band: 'A', available: true });
                  setAssignPickerOpen(false);
                  setAssignTaskId(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  width: '100%',
                  padding: '14px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #443152',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#D9008D',
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
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#FAF9FC' }}>
                    Myself (CSP)
                  </div>
                  <div style={{ fontSize: 12, color: '#A7A1B2', marginTop: 2 }}>
                    I will handle this task
                  </div>
                </div>
                <div style={{ color: '#D9008D', fontSize: 12, fontWeight: 600 }}>
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
                    padding: '14px 20px',
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
                      background: tech.available ? '#443152' : '#352D42',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 700,
                      color: tech.available ? '#D9008D' : '#665E75',
                      flexShrink: 0,
                    }}
                  >
                    {tech.name.charAt(0)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#FAF9FC' }}>
                      {tech.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#A7A1B2', marginTop: 2 }}>
                      Band {tech.band} {!tech.available && '-- Unavailable'}
                    </div>
                  </div>

                  {tech.available && (
                    <div style={{ color: '#008043', fontSize: 12, fontWeight: 600 }}>
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
                  color: '#A7A1B2',
                  border: '1px solid #443152',
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
      />

      {/* Section overlays */}
      {activeSection === 'wallet' && <WalletHub onBack={handleBackToHome} />}
      {activeSection === 'team' && <TeamHub onBack={handleBackToHome} />}
      {activeSection === 'support' && <SupportHub onBack={handleBackToHome} />}
      {activeSection === 'netbox' && <NetBoxHub onBack={handleBackToHome} />}
      {activeSection === 'profile' && <ProfilePage onBack={handleBackToHome} />}
      {activeSection === 'policies' && <PoliciesPage onBack={handleBackToHome} />}
    </div>
  );
}
