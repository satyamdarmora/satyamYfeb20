'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  Task,
  TaskType,
  TaskPriority,
  CreatedBy,
  Technician,
} from '@/lib/types';
import { getBucket, sortTasksByQueue } from '@/lib/task-queue';
import { useTheme } from '@/lib/theme';
import type { ThemeName } from '@/lib/theme';
import { BACKEND_URL, AREAS, MANUAL_REASONS } from './AdminTypes';
import type { BackendRegistration } from './AdminTypes';

// ---------------------------------------------------------------------------
// Return type for the hook
// ---------------------------------------------------------------------------
export interface AdminActions {
  // Data
  tasks: Task[];
  techList: Technician[];
  registrations: BackendRegistration[];
  notification: string | null;

  // Stats
  totalTasks: number;
  activeTasks: number;
  pendingTasks: number;

  // Theme
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;

  // Registration expansion
  expandedRegId: number | null;
  setExpandedRegId: (id: number | null) => void;

  // Review modal
  reviewModal: { id: number; regId: string; action: 'APPROVE' | 'REJECT' | 'INFO_REQUIRED' } | null;
  setReviewModal: (m: { id: number; regId: string; action: 'APPROVE' | 'REJECT' | 'INFO_REQUIRED' } | null) => void;
  reviewReason: string;
  setReviewReason: (r: string) => void;
  reviewLoading: boolean;
  handleReviewSubmit: () => Promise<void>;

  // Training
  handleTrainingAction: (regId: number, registrationId: string, action: 'COMPLETE' | 'FAIL') => Promise<void>;

  // Task form state
  formType: TaskType;
  setFormType: (t: TaskType) => void;
  formPriority: TaskPriority;
  setFormPriority: (p: TaskPriority) => void;
  formConnectionId: string;
  setFormConnectionId: (c: string) => void;
  formArea: string;
  setFormArea: (a: string) => void;
  formCreatedBy: CreatedBy;
  setFormCreatedBy: (c: CreatedBy) => void;
  formReason: string;
  setFormReason: (r: string) => void;
  handleCreateTask: (e: React.FormEvent) => void;

  // Task table expansion
  expandedTaskId: string | null;
  setExpandedTaskId: (id: string | null) => void;

  // System event handlers
  handleSimulateRecharge: () => void;
  handleSimulateSettlement: () => void;
  handleGenerateHighRestore: () => void;
  handleSendPaymentNotification: () => Promise<void>;
  handleSendNewOfferNotification: () => Promise<void>;
  handleRevokeTimedOutOffer: () => Promise<void>;
  handleClaimedByAnother: () => Promise<void>;
  handleTriggerCapabilityReset: () => Promise<void>;
  handleClearCapabilityReset: () => Promise<void>;
  handleTriggerQualityBonus: () => Promise<void>;
  handleFreezeWallet: () => Promise<void>;
  handleUnfreezeWallet: () => Promise<void>;
  handleNetboxRecoveryDeduction: () => Promise<void>;
  handleSendSlaWarning: () => Promise<void>;

  // Helpers exposed for components
  getTasksForTechnician: (techId: string) => Task[];
  getBucket: (task: Task) => number;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------
export function useAdminActions(): AdminActions {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  // Form state
  const [formType, setFormType] = useState<TaskType>('INSTALL');
  const [formPriority, setFormPriority] = useState<TaskPriority>('NORMAL');
  const [formConnectionId, setFormConnectionId] = useState('');
  const [formArea, setFormArea] = useState(AREAS[0]);
  const [formCreatedBy, setFormCreatedBy] = useState<CreatedBy>('SYSTEM');
  const [formReason, setFormReason] = useState(MANUAL_REASONS[0]);

  const [techList, setTechList] = useState<Technician[]>([]);
  const [registrations, setRegistrations] = useState<BackendRegistration[]>([]);
  const [expandedRegId, setExpandedRegId] = useState<number | null>(null);
  const [reviewModal, setReviewModal] = useState<{ id: number; regId: string; action: 'APPROVE' | 'REJECT' | 'INFO_REQUIRED' } | null>(null);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (Array.isArray(data)) setTasks(sortTasksByQueue(data));
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  }, []);

  const fetchTechnicians = useCallback(async () => {
    try {
      const res = await fetch('/api/technician/register');
      const data = await res.json();
      if (Array.isArray(data)) setTechList(data);
    } catch (err) {
      console.error('Failed to fetch technicians:', err);
    }
  }, []);

  const fetchRegistrations = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/v1/partner/registrations`);
      const json = await res.json();
      if (json.status === 0 && json.data?.registrations) {
        setRegistrations(json.data.registrations);
      }
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchTechnicians();
    fetchRegistrations();
  }, [fetchTasks, fetchTechnicians, fetchRegistrations]);

  const refresh = useCallback(() => {
    fetchTasks();
    fetchTechnicians();
    fetchRegistrations();
  }, [fetchTasks, fetchTechnicians, fetchRegistrations]);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const handleReviewSubmit = useCallback(async () => {
    if (!reviewModal || !reviewReason.trim()) return;
    setReviewLoading(true);
    try {
      await fetch(`${BACKEND_URL}/v1/partner/registrations/${reviewModal.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: reviewModal.action, reviewReason: reviewReason.trim() }),
      });
      refresh();
      const actionLabel = reviewModal.action === 'APPROVE' ? 'approved' : reviewModal.action === 'REJECT' ? 'rejected' : 'info requested';
      showNotification(`Registration ${reviewModal.regId} ${actionLabel}.`);
    } catch (err) {
      showNotification('Action failed. Please try again.');
    } finally {
      setReviewLoading(false);
      setReviewModal(null);
      setReviewReason('');
    }
  }, [reviewModal, reviewReason, refresh, showNotification]);

  const handleTrainingAction = useCallback(async (regId: number, registrationId: string, action: 'COMPLETE' | 'FAIL') => {
    try {
      await fetch(`${BACKEND_URL}/v1/partner/registrations/${regId}/training`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      refresh();
      showNotification(`${registrationId}: Training ${action === 'COMPLETE' ? 'completed' : 'failed'}.`);
    } catch {
      showNotification('Action failed. Please try again.');
    }
  }, [refresh, showNotification]);

  const handleCreateTask = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const connId = formConnectionId.trim() || `WM-CON-${Date.now().toString().slice(-6)}`;
      const netboxId = formType === 'NETBOX' ? `NB-MH-${Date.now().toString().slice(-4)}` : undefined;

      try {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: {
              task_type: formType,
              priority: formPriority,
              created_by: formCreatedBy,
              connection_id: formType !== 'NETBOX' ? connId : undefined,
              netbox_id: netboxId,
              customer_area: formArea,
            },
          }),
        });
        refresh();
        setFormConnectionId('');
        showNotification(`Task created successfully.`);
      } catch {
        showNotification('Failed to create task.');
      }
    },
    [
      formType,
      formPriority,
      formConnectionId,
      formArea,
      formCreatedBy,
      formReason,
      refresh,
      showNotification,
    ]
  );

  const handleSimulateRecharge = useCallback(async () => {
    try {
      const res = await fetch('/api/assurance');
      const assurance = await res.json();
      showNotification(
        `Recharge event simulated. Cycle earnings would increase by Rs.1,500. (Current: Rs.${(assurance.cycle_earned || 0).toLocaleString('en-IN')})`
      );
    } catch {
      showNotification('Recharge event simulated.');
    }
  }, [showNotification]);

  const handleSimulateSettlement = useCallback(async () => {
    try {
      const res = await fetch('/api/assurance');
      const assurance = await res.json();
      showNotification(
        `Settlement credit simulated. Rs.${(assurance.next_settlement_amount || 0).toLocaleString('en-IN')} would be credited on ${assurance.next_settlement_date || 'next cycle'}.`
      );
    } catch {
      showNotification('Settlement credit simulated.');
    }
  }, [showNotification]);

  const handleGenerateHighRestore = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: {
            task_type: 'RESTORE',
            priority: 'HIGH',
            created_by: 'SYSTEM',
            connection_id: `WM-CON-${Date.now().toString().slice(-6)}`,
            customer_area: AREAS[Math.floor(Math.random() * AREAS.length)],
          },
        }),
      });
      const data = await res.json();
      refresh();
      showNotification(
        `HIGH RESTORE generated. SLA: 75 min.`
      );
    } catch {
      showNotification('Failed to generate restore task.');
    }
  }, [refresh, showNotification]);

  const handleSendPaymentNotification = useCallback(async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'NOTIF-' + Date.now(),
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        message: 'Customer recharge payment received for WM-CON-2845',
        amount: 499,
        timestamp: new Date().toISOString(),
        dismissed: false,
      }),
    });
    showNotification('Payment notification sent to CSP app.');
  }, [showNotification]);

  const handleSendNewOfferNotification = useCallback(async () => {
    const connId = `WM-CON-${Date.now().toString().slice(-6)}`;
    const area = AREAS[Math.floor(Math.random() * AREAS.length)];

    try {
      // Create task via API
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: {
            task_type: 'INSTALL',
            priority: 'NORMAL',
            created_by: 'SYSTEM',
            connection_id: connId,
            customer_area: area,
          },
        }),
      });
      const data = await res.json();
      const taskId = data.task?.task_id || `TSK-${Date.now().toString().slice(-4)}`;

      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'NOTIF-' + Date.now(),
          type: 'NEW_OFFER',
          title: 'New Install Offer',
          message: `New install offer available for ${connId} in ${area}. Claim within 45 min.`,
          task_id: taskId,
          timestamp: new Date().toISOString(),
          dismissed: false,
        }),
      });
      refresh();
      showNotification(`New offer ${taskId} created and notification sent.`);
    } catch {
      showNotification('Failed to create offer.');
    }
  }, [refresh, showNotification]);

  const handleRevokeTimedOutOffer = useCallback(async () => {
    const offeredTask = tasks.find((t) => t.state === 'OFFERED');
    if (!offeredTask) {
      showNotification('No OFFERED tasks to revoke. Create a new offer first.');
      return;
    }

    const now = new Date().toISOString();
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: offeredTask.task_id,
        updates: {
          state: 'FAILED',
          detail: `Offer timed out and has been revoked. Connection ${offeredTask.connection_id} will be reassigned to another CSP.`,
        },
      }),
    });

    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'NOTIF-' + Date.now(),
        type: 'OFFER_REVOKED',
        title: 'Offer Timed Out',
        message: `Your offer for ${offeredTask.connection_id} (${offeredTask.customer_area}) has been revoked due to timeout. The connection will be reassigned.`,
        task_id: offeredTask.task_id,
        timestamp: now,
        dismissed: false,
      }),
    });

    refresh();
    showNotification(`Offer ${offeredTask.task_id} revoked. Notification sent to CSP.`);
  }, [tasks, refresh, showNotification]);

  const handleClaimedByAnother = useCallback(async () => {
    const offeredTask = tasks.find((t) => t.state === 'OFFERED');
    if (!offeredTask) {
      showNotification('No OFFERED tasks available. Create a new offer first.');
      return;
    }

    const now = new Date().toISOString();
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: offeredTask.task_id,
        updates: {
          state: 'FAILED',
          detail: `Connection ${offeredTask.connection_id} has been claimed by another CSP (CSP-MH-2045). Offer is no longer available.`,
        },
      }),
    });

    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'NOTIF-' + Date.now(),
        type: 'CLAIMED_BY_ANOTHER',
        title: 'Offer Claimed by Another CSP',
        message: `The install offer for ${offeredTask.connection_id} (${offeredTask.customer_area}) was claimed by another CSP. This offer is no longer available to you.`,
        task_id: offeredTask.task_id,
        timestamp: now,
        dismissed: false,
      }),
    });

    refresh();
    showNotification(`Offer ${offeredTask.task_id} claimed by another CSP. Notification sent.`);
  }, [tasks, refresh, showNotification]);

  const handleTriggerCapabilityReset = useCallback(async () => {
    await fetch('/api/assurance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capability_reset_active: true,
        capability_reset_reason: 'Task assignments may be paused. Complete retraining to restore full partner status. Contact your zone manager.',
        sla_standing: 'At Risk',
      }),
    });
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'NOTIF-' + Date.now(),
        type: 'CAPABILITY_RESET',
        title: 'Capability Reset Program',
        message: 'Task assignments may be paused. Complete retraining to restore full partner status. Contact your zone manager.',
        timestamp: new Date().toISOString(),
        dismissed: false,
      }),
    });
    showNotification('Capability reset triggered. CSP will see persistent banner and notification.');
  }, [showNotification]);

  const handleClearCapabilityReset = useCallback(async () => {
    await fetch('/api/assurance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capability_reset_active: false, capability_reset_reason: undefined }),
    });
    showNotification('Capability reset cleared. Banner removed from CSP app.');
  }, [showNotification]);

  const handleTriggerQualityBonus = useCallback(async () => {
    const bonusAmount = 750;
    let currentBalance = 14200;
    try {
      const walletRes = await fetch('/api/wallet');
      const walletData = await walletRes.json();
      currentBalance = walletData.balance ?? 14200;
    } catch { /* use default */ }
    await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        balance: currentBalance + bonusAmount,
        new_transaction: {
          id: 'TXN-BON-' + Date.now(),
          date: new Date().toISOString(),
          type: 'BONUS',
          amount: bonusAmount,
          description: 'Monthly SLA quality bonus \u2014 100% restore compliance',
          status: 'COMPLETED',
        },
      }),
    });
    await fetch('/api/assurance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ increment_cycle_earned: bonusAmount }),
    });
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'NOTIF-' + Date.now(),
        type: 'SETTLEMENT_CREDIT',
        title: 'Monthly Quality Bonus',
        amount: bonusAmount,
        message: 'Monthly SLA quality bonus \u2014 100% restore compliance',
        timestamp: new Date().toISOString(),
        dismissed: false,
      }),
    });
    showNotification('\u20B9750 quality bonus triggered.');
  }, [showNotification]);

  const handleFreezeWallet = useCallback(async () => {
    await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frozen: true,
        frozen_reason: 'Wallet frozen due to pending complaint investigation.',
      }),
    });
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'NOTIF-' + Date.now(),
        type: 'WALLET_FROZEN',
        title: 'Wallet Frozen',
        message: 'Withdrawals are disabled. Settlements will accumulate but cannot be withdrawn until the investigation is resolved.',
        timestamp: new Date().toISOString(),
        dismissed: false,
      }),
    });
    showNotification('Wallet frozen. CSP will see freeze banner and notification.');
  }, [showNotification]);

  const handleUnfreezeWallet = useCallback(async () => {
    await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frozen: false, frozen_reason: undefined }),
    });
    showNotification('Wallet unfrozen. Withdrawals re-enabled for CSP.');
  }, [showNotification]);

  const handleNetboxRecoveryDeduction = useCallback(async () => {
    const deductionAmount = 3500;
    let currentBalance = 14200;
    try {
      const walletRes = await fetch('/api/wallet');
      const walletData = await walletRes.json();
      currentBalance = walletData.balance ?? 14200;
    } catch { /* use default */ }
    await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        balance: Math.max(0, currentBalance - deductionAmount),
        new_transaction: {
          id: 'TXN-DED-' + Date.now(),
          date: new Date().toISOString(),
          type: 'DEDUCTION',
          amount: -deductionAmount,
          description: 'NetBox recovery deduction -- lost NB-MH-0455',
          status: 'COMPLETED',
        },
      }),
    });
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'NOTIF-' + Date.now(),
        type: 'NETBOX_RECOVERY_DEDUCTION',
        title: 'NetBox Recovery Deduction',
        amount: deductionAmount,
        message: `\u20B93,500 deducted from your available balance for lost NetBox NB-MH-0455. Raise a support ticket within 7 days to dispute.`,
        timestamp: new Date().toISOString(),
        dismissed: false,
      }),
    });
    showNotification('NetBox recovery deduction of \u20B93,500 applied. Notification sent to CSP.');
  }, [showNotification]);

  const handleSendSlaWarning = useCallback(async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'NOTIF-' + Date.now(),
        type: 'SLA_WARNING',
        title: 'SLA Warning',
        message: 'SLA compliance at risk. 2 restore tasks approaching deadline. Take action to avoid penalties.',
        timestamp: new Date().toISOString(),
        dismissed: false,
      }),
    });
    showNotification('SLA warning notification sent to CSP app.');
  }, [showNotification]);

  // Helper: get tasks assigned to a technician
  const getTasksForTechnicianFn = useCallback((techId: string): Task[] => {
    const terminal = ['RESOLVED', 'VERIFIED', 'ACTIVATION_VERIFIED', 'RETURN_CONFIRMED', 'FAILED', 'UNRESOLVED', 'LOST_DECLARED'];
    // techId is like TECH-001, find the tech name
    const tech = techList.find(t => t.id === techId);
    if (!tech) return [];
    return tasks.filter(t => t.assigned_to === tech.name && !terminal.includes(t.state));
  }, [tasks, techList]);

  // Stats
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter((t) =>
    ['ALERTED', 'ASSIGNED', 'IN_PROGRESS', 'CLAIMED', 'ACCEPTED', 'SCHEDULED'].includes(t.state)
  ).length;
  const pendingTasks = tasks.filter((t) =>
    ['OFFERED', 'PICKUP_REQUIRED', 'INSTALLED', 'COLLECTED'].includes(t.state)
  ).length;

  return {
    tasks,
    techList,
    registrations,
    notification,
    totalTasks,
    activeTasks,
    pendingTasks,
    theme,
    setTheme,
    expandedRegId,
    setExpandedRegId,
    reviewModal,
    setReviewModal,
    reviewReason,
    setReviewReason,
    reviewLoading,
    handleReviewSubmit,
    handleTrainingAction,
    formType,
    setFormType,
    formPriority,
    setFormPriority,
    formConnectionId,
    setFormConnectionId,
    formArea,
    setFormArea,
    formCreatedBy,
    setFormCreatedBy,
    formReason,
    setFormReason,
    handleCreateTask,
    expandedTaskId,
    setExpandedTaskId,
    handleSimulateRecharge,
    handleSimulateSettlement,
    handleGenerateHighRestore,
    handleSendPaymentNotification,
    handleSendNewOfferNotification,
    handleRevokeTimedOutOffer,
    handleClaimedByAnother,
    handleTriggerCapabilityReset,
    handleClearCapabilityReset,
    handleTriggerQualityBonus,
    handleFreezeWallet,
    handleUnfreezeWallet,
    handleNetboxRecoveryDeduction,
    handleSendSlaWarning,
    getTasksForTechnician: getTasksForTechnicianFn,
    getBucket,
  };
}
