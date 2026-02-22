'use client';

import React from 'react';
import { useAdminActions } from './useAdminActions';
import { PartnerRegistrations } from './PartnerRegistrations';
import { ReviewModal } from './ReviewModal';
import { CreateTaskForm } from './CreateTaskForm';
import { SystemEventTriggers } from './SystemEventTriggers';
import { TaskTable } from './TaskTable';

export function AdminDashboard() {
  const actions = useAdminActions();

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
      {actions.notification && (
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
          {actions.notification}
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
            {actions.totalTasks}
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
            {actions.activeTasks}
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
            {actions.pendingTasks}
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
          {actions.techList.map((t) => {
            const techTasks = actions.getTasksForTechnician(t.id);
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

      {/* Review Modal */}
      {actions.reviewModal && (
        <ReviewModal
          reviewModal={actions.reviewModal}
          reviewReason={actions.reviewReason}
          setReviewReason={actions.setReviewReason}
          reviewLoading={actions.reviewLoading}
          onSubmit={actions.handleReviewSubmit}
          onClose={() => { actions.setReviewModal(null); actions.setReviewReason(''); }}
        />
      )}

      {/* Partner Registrations */}
      <PartnerRegistrations
        registrations={actions.registrations}
        expandedRegId={actions.expandedRegId}
        setExpandedRegId={actions.setExpandedRegId}
        onReview={actions.setReviewModal}
        onTraining={actions.handleTrainingAction}
      />

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
          <CreateTaskForm
            formType={actions.formType}
            setFormType={actions.setFormType}
            formPriority={actions.formPriority}
            setFormPriority={actions.setFormPriority}
            formConnectionId={actions.formConnectionId}
            setFormConnectionId={actions.setFormConnectionId}
            formArea={actions.formArea}
            setFormArea={actions.setFormArea}
            formCreatedBy={actions.formCreatedBy}
            setFormCreatedBy={actions.setFormCreatedBy}
            formReason={actions.formReason}
            setFormReason={actions.setFormReason}
            onSubmit={actions.handleCreateTask}
          />
          <SystemEventTriggers
            handleSimulateRecharge={actions.handleSimulateRecharge}
            handleSimulateSettlement={actions.handleSimulateSettlement}
            handleGenerateHighRestore={actions.handleGenerateHighRestore}
            handleSendPaymentNotification={actions.handleSendPaymentNotification}
            handleSendNewOfferNotification={actions.handleSendNewOfferNotification}
            handleSendSlaWarning={actions.handleSendSlaWarning}
            handleRevokeTimedOutOffer={actions.handleRevokeTimedOutOffer}
            handleClaimedByAnother={actions.handleClaimedByAnother}
            handleTriggerCapabilityReset={actions.handleTriggerCapabilityReset}
            handleClearCapabilityReset={actions.handleClearCapabilityReset}
            handleTriggerQualityBonus={actions.handleTriggerQualityBonus}
            handleFreezeWallet={actions.handleFreezeWallet}
            handleUnfreezeWallet={actions.handleUnfreezeWallet}
            handleNetboxRecoveryDeduction={actions.handleNetboxRecoveryDeduction}
            theme={actions.theme}
            setTheme={actions.setTheme}
          />
        </div>

        {/* Right: Task Table */}
        <TaskTable
          tasks={actions.tasks}
          expandedTaskId={actions.expandedTaskId}
          setExpandedTaskId={actions.setExpandedTaskId}
          getBucket={actions.getBucket}
        />
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
