'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  Task,
  TaskType,
  TaskPriority,
  CreatedBy,
  TimelineEvent,
} from '@/lib/types';
import {
  getAllTasks,
  getAssuranceState,
  addTask,
  updateTask,
  getBucket,
  sortTasksByQueue,
  getTechnicians,
  getTasksForTechnician,
  getDepositLedger,
  getNetBoxUnits,
  getRateCard,
  updateNetBoxUnit,
  addDepositTransaction,
} from '@/lib/data';
import type { Technician, DepositLedger, NetBoxUnit, RateCard } from '@/lib/types';
import { useTheme } from '@/lib/theme';

const AREAS = [
  'Andheri West',
  'Bandra East',
  'Powai',
  'Malad West',
  'Goregaon East',
  'Borivali West',
];

const MANUAL_REASONS = [
  'Customer escalation',
  'Repeated outage in area',
  'VIP customer request',
  'Regulatory compliance',
  'Preventive maintenance',
  'Hardware replacement',
  'Network upgrade',
];

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStateColor(state: string): string {
  const active = ['IN_PROGRESS', 'ASSIGNED', 'SCHEDULED', 'ACCEPTED', 'CLAIMED'];
  const alert = ['ALERTED', 'OFFERED', 'PICKUP_REQUIRED'];
  const done = ['RESOLVED', 'VERIFIED', 'ACTIVATION_VERIFIED', 'RETURN_CONFIRMED', 'INSTALLED'];
  const fail = ['FAILED', 'UNRESOLVED', 'LOST_DECLARED'];

  if (active.includes(state)) return 'var(--brand-primary)';
  if (alert.includes(state)) return 'var(--warning)';
  if (done.includes(state)) return 'var(--positive)';
  if (fail.includes(state)) return 'var(--negative)';
  return 'var(--text-secondary)';
}

function getTypeColor(taskType: string): string {
  switch (taskType) {
    case 'INSTALL': return 'var(--brand-primary)';
    case 'RESTORE': return 'var(--accent-restore)';
    case 'NETBOX': return 'var(--accent-gold)';
    default: return 'var(--text-secondary)';
  }
}

export default function AdminPage() {
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
  const [depositLedger, setDepositLedger] = useState<DepositLedger | null>(null);
  const [selectedNetboxForLoss, setSelectedNetboxForLoss] = useState('');
  const [selectedNetboxForRefund, setSelectedNetboxForRefund] = useState('');

  useEffect(() => {
    setTasks(sortTasksByQueue(getAllTasks()));
    setTechList(getTechnicians());
    setDepositLedger(getDepositLedger());
  }, []);

  const refresh = useCallback(() => {
    setTasks(sortTasksByQueue(getAllTasks()));
    setTechList(getTechnicians());
    setDepositLedger(getDepositLedger());
  }, []);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const handleCreateTask = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const connId = formConnectionId.trim() || `WM-CON-${Date.now().toString().slice(-6)}`;
      const netboxId = formType === 'NETBOX' ? `NB-MH-${Date.now().toString().slice(-4)}` : undefined;
      const now = new Date().toISOString();

      const initialState =
        formType === 'INSTALL'
          ? 'OFFERED'
          : formType === 'RESTORE'
            ? 'ALERTED'
            : 'PICKUP_REQUIRED';

      const MIN = 60 * 1000;
      const HOUR = 60 * MIN;

      const newTask: Task = {
        task_id: `TSK-${Date.now().toString().slice(-4)}`,
        task_type: formType,
        state: initialState,
        priority: formPriority,
        created_by: formCreatedBy,
        created_at: now,
        offer_expires_at:
          formType === 'INSTALL'
            ? new Date(Date.now() + 45 * MIN).toISOString()
            : undefined,
        sla_deadline_at:
          formType === 'RESTORE'
            ? new Date(
                Date.now() + (formPriority === 'HIGH' ? 75 * MIN : 4 * HOUR)
              ).toISOString()
            : undefined,
        pickup_due_at:
          formType === 'NETBOX'
            ? new Date(Date.now() + 24 * HOUR).toISOString()
            : undefined,
        delegation_state: 'UNASSIGNED',
        owner_entity: 'CSP-MH-1001',
        retry_count: 0,
        connection_id: formType !== 'NETBOX' ? connId : undefined,
        netbox_id: netboxId,
        customer_area: formArea,
        proof_bundle: {},
        event_log: [
          {
            timestamp: now,
            event_type: 'TASK_CREATED',
            actor: formCreatedBy === 'SYSTEM' ? 'wiom-scheduler' : 'Admin Portal',
            actor_type: formCreatedBy === 'SYSTEM' ? 'SYSTEM' : 'ADMIN',
            detail: `${formType} task created (${formPriority} priority) for ${formType === 'NETBOX' ? netboxId : connId} in ${formArea}.${formCreatedBy === 'MANUAL_EXCEPTION' ? ` Reason: ${formReason}` : ''}`,
          },
        ],
      };

      addTask(newTask);
      refresh();
      setFormConnectionId('');
      showNotification(`Task ${newTask.task_id} created successfully.`);
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

  const handleSimulateRecharge = useCallback(() => {
    const assurance = getAssuranceState();
    const newAmount = assurance.cycle_earned + 1500;
    // Direct mutation for demo since getAssuranceState returns a reference in the existing data.ts
    // We rely on the fact that the in-memory store is mutable
    showNotification(
      `Recharge event simulated. Cycle earnings would increase by Rs.1,500. (Current: Rs.${assurance.cycle_earned.toLocaleString('en-IN')})`
    );
  }, [showNotification]);

  const handleSimulateSettlement = useCallback(() => {
    const assurance = getAssuranceState();
    showNotification(
      `Settlement credit simulated. Rs.${assurance.next_settlement_amount.toLocaleString('en-IN')} would be credited on ${assurance.next_settlement_date}.`
    );
  }, [showNotification]);

  const handleGenerateHighRestore = useCallback(() => {
    const now = new Date().toISOString();
    const MIN = 60 * 1000;

    const newTask: Task = {
      task_id: `TSK-${Date.now().toString().slice(-4)}`,
      task_type: 'RESTORE',
      state: 'ALERTED',
      priority: 'HIGH',
      created_by: 'SYSTEM',
      created_at: now,
      sla_deadline_at: new Date(Date.now() + 75 * MIN).toISOString(),
      delegation_state: 'UNASSIGNED',
      owner_entity: 'CSP-MH-1001',
      retry_count: 0,
      connection_id: `WM-CON-${Date.now().toString().slice(-6)}`,
      customer_area: AREAS[Math.floor(Math.random() * AREAS.length)],
      proof_bundle: {},
      event_log: [
        {
          timestamp: now,
          event_type: 'CONNECTIVITY_LOSS_DETECTED',
          actor: 'wiom-monitor',
          actor_type: 'SYSTEM',
          detail: 'Packet loss exceeded threshold. HIGH priority restore generated.',
        },
        {
          timestamp: now,
          event_type: 'TASK_CREATED',
          actor: 'wiom-monitor',
          actor_type: 'SYSTEM',
          detail: 'Restore task created with HIGH priority. SLA 75 min.',
        },
      ],
    };

    addTask(newTask);
    refresh();
    showNotification(
      `HIGH RESTORE ${newTask.task_id} generated for ${newTask.customer_area}. SLA: 75 min.`
    );
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
    const now = new Date().toISOString();
    const MIN = 60 * 1000;
    const connId = `WM-CON-${Date.now().toString().slice(-6)}`;
    const taskId = `TSK-${Date.now().toString().slice(-4)}`;

    const newTask: Task = {
      task_id: taskId,
      task_type: 'INSTALL',
      state: 'OFFERED',
      priority: 'NORMAL',
      created_by: 'SYSTEM',
      created_at: now,
      due_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      offer_expires_at: new Date(Date.now() + 45 * MIN).toISOString(),
      delegation_state: 'UNASSIGNED',
      owner_entity: 'CSP-MH-1001',
      retry_count: 0,
      connection_id: connId,
      customer_area: AREAS[Math.floor(Math.random() * AREAS.length)],
      proof_bundle: {},
      event_log: [
        {
          timestamp: now,
          event_type: 'TASK_CREATED',
          actor: 'wiom-scheduler',
          actor_type: 'SYSTEM',
          detail: `Install order created for ${connId}. Offer TTL 45 min.`,
        },
      ],
    };

    addTask(newTask);
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'NOTIF-' + Date.now(),
        type: 'NEW_OFFER',
        title: 'New Install Offer',
        message: `New install offer available for ${connId} in ${newTask.customer_area}. Claim within 45 min.`,
        task_id: taskId,
        timestamp: now,
        dismissed: false,
      }),
    });
    refresh();
    showNotification(`New offer ${taskId} created and notification sent.`);
  }, [refresh, showNotification]);

  const handleRevokeTimedOutOffer = useCallback(async () => {
    // Find first OFFERED task
    const offeredTask = tasks.find((t) => t.state === 'OFFERED');
    if (!offeredTask) {
      showNotification('No OFFERED tasks to revoke. Create a new offer first.');
      return;
    }

    const now = new Date().toISOString();
    updateTask(offeredTask.task_id, {
      state: 'FAILED',
      event_log: [
        ...offeredTask.event_log,
        {
          timestamp: now,
          event_type: 'OFFER_REVOKED',
          actor: 'wiom-scheduler',
          actor_type: 'SYSTEM',
          detail: `Offer timed out and has been revoked. Connection ${offeredTask.connection_id} will be reassigned to another CSP.`,
        },
      ],
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
    // Find first OFFERED task
    const offeredTask = tasks.find((t) => t.state === 'OFFERED');
    if (!offeredTask) {
      showNotification('No OFFERED tasks available. Create a new offer first.');
      return;
    }

    const now = new Date().toISOString();
    updateTask(offeredTask.task_id, {
      state: 'FAILED',
      event_log: [
        ...offeredTask.event_log,
        {
          timestamp: now,
          event_type: 'CLAIMED_BY_ANOTHER',
          actor: 'wiom-scheduler',
          actor_type: 'SYSTEM',
          detail: `Connection ${offeredTask.connection_id} has been claimed by another CSP (CSP-MH-2045). Offer is no longer available.`,
        },
      ],
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
    // Add BONUS transaction to wallet
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
          description: 'Monthly SLA quality bonus — 100% restore compliance',
          status: 'COMPLETED',
        },
      }),
    });
    // Increment cycle_earned
    await fetch('/api/assurance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ increment_cycle_earned: bonusAmount }),
    });
    // Send notification
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
    // First fetch current balance, then deduct
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

  // Stats
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter((t) =>
    ['ALERTED', 'ASSIGNED', 'IN_PROGRESS', 'CLAIMED', 'ACCEPTED', 'SCHEDULED'].includes(t.state)
  ).length;
  const pendingTasks = tasks.filter((t) =>
    ['OFFERED', 'PICKUP_REQUIRED', 'INSTALLED', 'COLLECTED'].includes(t.state)
  ).length;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 6,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  };

  const fieldGroup: React.CSSProperties = {
    marginBottom: 16,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '0 24px 40px',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      {/* Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: '14px 24px',
            fontSize: 14,
            color: 'var(--text-primary)',
            fontWeight: 500,
            maxWidth: 600,
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          {notification}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          padding: '24px 0 20px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: 0,
            color: 'var(--text-primary)',
          }}
        >
          Wiom Operations Portal
        </h1>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            margin: '6px 0 0',
          }}
        >
          Task management and system event simulation
        </p>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 10,
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Total Tasks
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
            {totalTasks}
          </div>
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 10,
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Active Tasks
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--brand-primary)' }}>
            {activeTasks}
          </div>
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 10,
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Pending Tasks
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)' }}>
            {pendingTasks}
          </div>
        </div>
      </div>

      {/* Technician Activity */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 12,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: '0 0 16px',
            color: 'var(--text-primary)',
          }}
        >
          Technician Activity
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {techList.map((t) => {
            const techTasks = getTasksForTechnician(t.id);
            const terminal = ['RESOLVED', 'VERIFIED', 'ACTIVATION_VERIFIED', 'RETURN_CONFIRMED', 'FAILED', 'UNRESOLVED', 'LOST_DECLARED'];
            const activeTaskCount = techTasks.filter((tk) => !terminal.includes(tk.state)).length;
            const currentTask = techTasks.find((tk) => !terminal.includes(tk.state));
            return (
              <div
                key={t.id}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 10,
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: t.available ? 'var(--positive)' : 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {t.id} &middot; Band {t.band}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600, color: activeTaskCount > 0 ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
                    {activeTaskCount} active
                  </span>
                  {' \u00B7 '}
                  <span>{t.completed_count} completed</span>
                </div>
                {currentTask && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      background: 'var(--bg-primary)',
                      borderRadius: 6,
                      padding: '6px 10px',
                    }}
                  >
                    Current: {currentTask.task_type} {currentTask.task_id} ({currentTask.state})
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two column layout on desktop */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 400px) 1fr',
          gap: 32,
          alignItems: 'start',
        }}
      >
        {/* Left: Create Task + System Events */}
        <div>
          {/* Create New Task */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: '0 0 20px',
                color: 'var(--text-primary)',
              }}
            >
              Create New Task
            </h2>

            <form onSubmit={handleCreateTask}>
              <div style={fieldGroup}>
                <label style={labelStyle}>Task Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as TaskType)}
                  style={inputStyle}
                >
                  <option value="INSTALL">INSTALL</option>
                  <option value="RESTORE">RESTORE</option>
                  <option value="NETBOX">NETBOX</option>
                </select>
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Priority</label>
                <select
                  value={formPriority}
                  onChange={(e) =>
                    setFormPriority(e.target.value as TaskPriority)
                  }
                  style={inputStyle}
                >
                  <option value="HIGH">HIGH</option>
                  <option value="NORMAL">NORMAL</option>
                </select>
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>
                  {formType === 'NETBOX'
                    ? 'NetBox ID (auto-generate if empty)'
                    : 'Connection ID (auto-generate if empty)'}
                </label>
                <input
                  type="text"
                  value={formConnectionId}
                  onChange={(e) => setFormConnectionId(e.target.value)}
                  placeholder={
                    formType === 'NETBOX' ? 'NB-MH-XXXX' : 'WM-CON-XXXX'
                  }
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Customer Area</label>
                <select
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value)}
                  style={inputStyle}
                >
                  {AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Created By</label>
                <select
                  value={formCreatedBy}
                  onChange={(e) => setFormCreatedBy(e.target.value as CreatedBy)}
                  style={inputStyle}
                >
                  <option value="SYSTEM">SYSTEM</option>
                  <option value="MANUAL_EXCEPTION">MANUAL_EXCEPTION</option>
                </select>
              </div>

              {formCreatedBy === 'MANUAL_EXCEPTION' && (
                <div style={fieldGroup}>
                  <label style={labelStyle}>Reason</label>
                  <select
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    style={inputStyle}
                  >
                    {MANUAL_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--brand-primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: 4,
                }}
              >
                Create Task
              </button>
            </form>
          </div>

          {/* Trigger System Events */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 12,
              padding: 24,
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: '0 0 20px',
                color: 'var(--text-primary)',
              }}
            >
              Trigger System Events
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={handleSimulateRecharge}
                style={{
                  padding: '12px 16px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Simulate Recharge Event
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Triggers a customer recharge event, updating cycle earnings.
                </div>
              </button>

              <button
                onClick={handleSimulateSettlement}
                style={{
                  padding: '12px 16px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Simulate Settlement Credit
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Shows a settlement notification with pending amount.
                </div>
              </button>

              <button
                onClick={handleGenerateHighRestore}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(224, 30, 0, 0.08)',
                  border: '1px solid rgba(224, 30, 0, 0.25)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--negative)' }}>
                  Generate HIGH RESTORE
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Creates a new high-priority restore task with 75-min SLA.
                </div>
              </button>

              <button
                onClick={handleSendPaymentNotification}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(0, 128, 67, 0.08)',
                  border: '1px solid rgba(0, 128, 67, 0.25)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--positive)' }}>
                  Send Payment Notification
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Sends a payment received notification (Rs.499) to the CSP app.
                </div>
              </button>

              <button
                onClick={handleSendNewOfferNotification}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(217, 0, 141, 0.08)',
                  border: '1px solid rgba(217, 0, 141, 0.25)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--brand-primary)' }}>
                  Send New Offer Notification
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Creates a new INSTALL OFFERED task and sends a NEW_OFFER notification.
                </div>
              </button>

              <button
                onClick={handleSendSlaWarning}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255, 128, 0, 0.08)',
                  border: '1px solid rgba(255, 128, 0, 0.25)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--warning)' }}>
                  Send SLA Warning
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Sends an SLA compliance warning notification to the CSP app.
                </div>
              </button>

              <button
                onClick={handleRevokeTimedOutOffer}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(224, 30, 0, 0.08)',
                  border: '1px solid rgba(224, 30, 0, 0.25)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--negative)' }}>
                  Revoke Timed-Out Offer
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Revokes the oldest OFFERED task (simulates timeout). CSP gets a clear notification that the connection is being reassigned.
                </div>
              </button>

              <button
                onClick={handleClaimedByAnother}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255, 128, 0, 0.08)',
                  border: '1px solid rgba(255, 128, 0, 0.25)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--warning)' }}>
                  Claimed by Another CSP
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Simulates another CSP claiming an offered connection first. CSP gets a notification that the offer is no longer available.
                </div>
              </button>

              {/* Partner Alert & Wallet Action Triggers */}
              <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                  Partner Alerts & Wallet Actions
                </div>
              </div>

              <button
                onClick={handleTriggerCapabilityReset}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255, 128, 0, 0.08)',
                  border: '1px solid rgba(255, 128, 0, 0.25)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--warning)' }}>
                  Trigger Capability Reset
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Activates a capability reset program. CSP sees a persistent warning banner and SLA drops to At Risk.
                </div>
              </button>

              <button
                onClick={handleClearCapabilityReset}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(0, 128, 67, 0.08)',
                  border: '1px solid rgba(0, 128, 67, 0.25)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--positive)' }}>
                  Clear Capability Reset
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Clears the capability reset. Warning banner disappears from CSP app.
                </div>
              </button>

              <button
                onClick={handleTriggerQualityBonus}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(0, 128, 67, 0.08)',
                  border: '1px solid rgba(0, 128, 67, 0.25)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--positive)' }}>
                  Trigger Monthly Quality Bonus {'\u20B9'}750
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Credits {'\u20B9'}750 quality bonus to wallet, increments cycle earnings, and sends notification to CSP.
                </div>
              </button>

              <button
                onClick={handleFreezeWallet}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(224, 30, 0, 0.08)',
                  border: '1px solid rgba(224, 30, 0, 0.25)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--negative)' }}>
                  Freeze Wallet
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Freezes the CSP wallet. Withdrawals disabled, settlements accumulate. Investigation notification sent.
                </div>
              </button>

              <button
                onClick={handleUnfreezeWallet}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(0, 128, 67, 0.08)',
                  border: '1px solid rgba(0, 128, 67, 0.25)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--positive)' }}>
                  Unfreeze Wallet
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Unfreezes the wallet. Withdrawals re-enabled for the CSP.
                </div>
              </button>

              <button
                onClick={handleNetboxRecoveryDeduction}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(224, 30, 0, 0.08)',
                  border: '1px solid rgba(224, 30, 0, 0.25)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--negative)' }}>
                  NetBox Recovery Deduction {'\u20B9'}3,500
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Deducts {'\u20B9'}3,500 for lost NetBox NB-MH-0455. Shows as DEDUCTION transaction in wallet. CSP notified with dispute window.
                </div>
              </button>
            </div>
          </div>

          {/* SLA & Exposure Triggers */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            padding: 24,
            marginTop: 24,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px', color: 'var(--text-primary)' }}>
              SLA & Exposure Controls
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Change the CSP&apos;s SLA standing and exposure state. Updates reflect on the assurance strip in real-time.
            </p>

            {/* SLA Standing */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>SLA Standing</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['Compliant', 'At Risk', 'Non-Compliant'] as const).map((val) => {
                  const colors: Record<string, string> = { 'Compliant': 'var(--positive)', 'At Risk': 'var(--warning)', 'Non-Compliant': 'var(--negative)' };
                  return (
                    <button
                      key={val}
                      onClick={async () => {
                        await fetch('/api/assurance', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ sla_standing: val }),
                        });
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 8px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'var(--bg-card)',
                        color: colors[val],
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exposure State */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Exposure State</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['ELIGIBLE', 'LIMITED', 'INELIGIBLE'] as const).map((val) => {
                  const colors: Record<string, string> = { 'ELIGIBLE': 'var(--positive)', 'LIMITED': 'var(--warning)', 'INELIGIBLE': 'var(--negative)' };
                  const reasons: Record<string, string> = {
                    'ELIGIBLE': 'All SLA metrics within threshold for the current cycle.',
                    'LIMITED': 'Restore SLA breached. New offers limited to INSTALL only.',
                    'INELIGIBLE': 'Multiple SLA breaches. No new offers until compliance restored.',
                  };
                  return (
                    <button
                      key={val}
                      onClick={async () => {
                        await fetch('/api/assurance', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ exposure_state: val, exposure_reason: reasons[val] }),
                        });
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 8px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'var(--bg-card)',
                        color: colors[val],
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Base quick set */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Active Base</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[10, 25, 42, 60, 100].map((val) => (
                  <button
                    key={val}
                    onClick={async () => {
                      await fetch('/api/assurance', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ active_base: val }),
                      });
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* State - Color Check Toggle */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            padding: 24,
            marginTop: 24,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px', color: 'var(--text-primary)' }}>
              State - Color Check
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Toggle warm off-white theme with muted state colors, calibrated text hierarchy, and Hindi typography contrast boost.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {theme === 'state-color-check' ? 'Active' : 'Off'}
              </span>
              <button
                onClick={() => setTheme(theme === 'state-color-check' ? 'dark' : 'state-color-check')}
                style={{
                  width: 52,
                  height: 30,
                  borderRadius: 15,
                  border: 'none',
                  background: theme === 'state-color-check' ? 'var(--positive)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  position: 'absolute',
                  top: 3,
                  left: theme === 'state-color-check' ? 25 : 3,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          </div>

          {/* NetBox & Deposit Controls */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            padding: 24,
            marginTop: 24,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px', color: 'var(--text-primary)' }}>
              NetBox &amp; Deposit Controls
            </h2>

            {/* Deposit Ledger Summary */}
            {depositLedger && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Deposit Ledger Overview
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}>
                  <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>Total Issued</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{depositLedger.total_issued}</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>Active</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-primary)' }}>{depositLedger.total_active}</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>Returned</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--positive)' }}>{depositLedger.total_returned}</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>Lost</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--negative)' }}>{depositLedger.total_lost}</div>
                  </div>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  marginTop: 8,
                }}>
                  <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>Deposit Balance</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{'\u20B9'}{depositLedger.deposit_balance.toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>Exit Refund Est.</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--positive)' }}>{'\u20B9'}{depositLedger.exit_refund_estimate.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Declare NetBox Lost */}
              <div style={{
                padding: '12px 16px',
                background: 'rgba(224, 30, 0, 0.08)',
                border: '1px solid rgba(224, 30, 0, 0.25)',
                borderRadius: 8,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--negative)', fontSize: 13 }}>
                  Declare NetBox Lost
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Mark an active NetBox unit as lost. Deducts {'\u20B9'}1,500 from deposit ledger.
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Select Active Unit</label>
                  <select
                    style={inputStyle}
                    value={selectedNetboxForLoss}
                    onChange={(e) => setSelectedNetboxForLoss(e.target.value)}
                  >
                    <option value="">-- Select NetBox --</option>
                    {depositLedger?.units
                      .filter((u) => ['WITH_CUSTOMER', 'EXPIRED_WITH_CUSTOMER', 'COLLECTED_IN_TRANSIT'].includes(u.status))
                      .map((u) => (
                        <option key={u.netbox_id} value={u.netbox_id}>
                          {u.netbox_id} — {u.status.replace(/_/g, ' ')} {u.customer_area ? `(${u.customer_area})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
                <button
                  disabled={!selectedNetboxForLoss}
                  onClick={() => {
                    if (!selectedNetboxForLoss) return;
                    const now = new Date().toISOString();
                    updateNetBoxUnit(selectedNetboxForLoss, {
                      status: 'LOST',
                      lost_declared_at: now,
                    });
                    addDepositTransaction({
                      id: 'DEP-TXN-' + Date.now(),
                      date: now,
                      type: 'LOSS_DEDUCTION',
                      amount: -1500,
                      netbox_id: selectedNetboxForLoss,
                      description: `Loss deduction for ${selectedNetboxForLoss} — declared lost by admin`,
                    });
                    setSelectedNetboxForLoss('');
                    refresh();
                    showNotification(`NetBox ${selectedNetboxForLoss} declared LOST. \u20B91,500 deposit deduction applied.`);
                  }}
                  style={{
                    padding: '10px 16px',
                    background: selectedNetboxForLoss ? 'var(--negative)' : 'var(--bg-card)',
                    border: 'none',
                    borderRadius: 8,
                    color: selectedNetboxForLoss ? '#FFFFFF' : 'var(--text-muted)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: selectedNetboxForLoss ? 'pointer' : 'not-allowed',
                    width: '100%',
                    transition: 'background 0.15s',
                  }}
                >
                  Declare Lost &amp; Deduct {'\u20B9'}1,500
                </button>
              </div>

              {/* Trigger Carry Fee Deduction */}
              <button
                onClick={async () => {
                  try {
                    const eligibleUnits = depositLedger?.units.filter((u) => u.carry_fee_eligible) || [];
                    if (eligibleUnits.length === 0) {
                      showNotification('No units eligible for carry fee deduction.');
                      return;
                    }
                    const totalFee = eligibleUnits.reduce((sum, u) => sum + u.carry_fee_accrued, 0);
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
                        balance: Math.max(0, currentBalance - totalFee),
                        new_transaction: {
                          id: 'TXN-CARRY-' + Date.now(),
                          date: new Date().toISOString(),
                          type: 'CARRY_FEE',
                          amount: -totalFee,
                          description: `Carry fee deduction for ${eligibleUnits.length} overdue unit(s)`,
                          status: 'COMPLETED',
                        },
                      }),
                    });
                    refresh();
                    showNotification(`Carry fee of \u20B9${totalFee.toLocaleString('en-IN')} deducted for ${eligibleUnits.length} unit(s).`);
                  } catch {
                    showNotification('Failed to process carry fee deduction.');
                  }
                }}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(217, 150, 0, 0.08)',
                  border: '1px solid rgba(217, 150, 0, 0.25)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--warning)' }}>
                  Trigger Carry Fee Deduction
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Deducts accrued carry fees from wallet for all overdue NetBox units past grace period.
                </div>
              </button>

              {/* Refund Deposit */}
              <div style={{
                padding: '12px 16px',
                background: 'rgba(0, 128, 67, 0.08)',
                border: '1px solid rgba(0, 128, 67, 0.25)',
                borderRadius: 8,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--positive)', fontSize: 13 }}>
                  Refund Deposit
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Refund security deposit for a returned NetBox unit currently in warehouse.
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Select In-Warehouse Unit</label>
                  <select
                    style={inputStyle}
                    value={selectedNetboxForRefund}
                    onChange={(e) => setSelectedNetboxForRefund(e.target.value)}
                  >
                    <option value="">-- Select NetBox --</option>
                    {depositLedger?.units
                      .filter((u) => u.status === 'IN_WAREHOUSE')
                      .map((u) => (
                        <option key={u.netbox_id} value={u.netbox_id}>
                          {u.netbox_id} — IN WAREHOUSE {u.customer_area ? `(${u.customer_area})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
                <button
                  disabled={!selectedNetboxForRefund}
                  onClick={() => {
                    if (!selectedNetboxForRefund) return;
                    const now = new Date().toISOString();
                    const refundAmount = depositLedger?.security_deposit_per_unit ?? 1500;
                    addDepositTransaction({
                      id: 'DEP-TXN-' + Date.now(),
                      date: now,
                      type: 'DEPOSIT_REFUND',
                      amount: refundAmount,
                      netbox_id: selectedNetboxForRefund,
                      description: `Deposit refund for ${selectedNetboxForRefund} — unit returned to warehouse`,
                    });
                    setSelectedNetboxForRefund('');
                    refresh();
                    showNotification(`Deposit of \u20B9${refundAmount.toLocaleString('en-IN')} refunded for ${selectedNetboxForRefund}.`);
                  }}
                  style={{
                    padding: '10px 16px',
                    background: selectedNetboxForRefund ? 'var(--positive)' : 'var(--bg-card)',
                    border: 'none',
                    borderRadius: 8,
                    color: selectedNetboxForRefund ? '#FFFFFF' : 'var(--text-muted)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: selectedNetboxForRefund ? 'pointer' : 'not-allowed',
                    width: '100%',
                    transition: 'background 0.15s',
                  }}
                >
                  Refund Deposit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Task Table */}
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
      </div>

      {/* Responsive: stack on mobile */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: minmax(0, 400px) 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
