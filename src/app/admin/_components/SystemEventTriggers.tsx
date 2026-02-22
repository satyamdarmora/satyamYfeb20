'use client';

import React from 'react';
import type { ThemeName } from '@/lib/theme';

interface SystemEventTriggersProps {
  handleSimulateRecharge: () => void;
  handleSimulateSettlement: () => void;
  handleGenerateHighRestore: () => void;
  handleSendPaymentNotification: () => void;
  handleSendNewOfferNotification: () => void;
  handleSendSlaWarning: () => void;
  handleRevokeTimedOutOffer: () => void;
  handleClaimedByAnother: () => void;
  handleTriggerCapabilityReset: () => void;
  handleClearCapabilityReset: () => void;
  handleTriggerQualityBonus: () => void;
  handleFreezeWallet: () => void;
  handleUnfreezeWallet: () => void;
  handleNetboxRecoveryDeduction: () => void;
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

const eventBtnBase: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'border-color 0.15s',
};

export function SystemEventTriggers({
  handleSimulateRecharge,
  handleSimulateSettlement,
  handleGenerateHighRestore,
  handleSendPaymentNotification,
  handleSendNewOfferNotification,
  handleSendSlaWarning,
  handleRevokeTimedOutOffer,
  handleClaimedByAnother,
  handleTriggerCapabilityReset,
  handleClearCapabilityReset,
  handleTriggerQualityBonus,
  handleFreezeWallet,
  handleUnfreezeWallet,
  handleNetboxRecoveryDeduction,
  theme,
  setTheme,
}: SystemEventTriggersProps) {
  return (
    <>
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
              ...eventBtnBase,
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
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
              ...eventBtnBase,
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
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
              ...eventBtnBase,
              background: 'rgba(224, 30, 0, 0.08)',
              border: '1px solid rgba(224, 30, 0, 0.25)',
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
              ...eventBtnBase,
              background: 'rgba(0, 128, 67, 0.08)',
              border: '1px solid rgba(0, 128, 67, 0.25)',
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
              ...eventBtnBase,
              background: 'rgba(217, 0, 141, 0.08)',
              border: '1px solid rgba(217, 0, 141, 0.25)',
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
              ...eventBtnBase,
              background: 'rgba(255, 128, 0, 0.08)',
              border: '1px solid rgba(255, 128, 0, 0.25)',
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
              ...eventBtnBase,
              background: 'rgba(224, 30, 0, 0.08)',
              border: '1px solid rgba(224, 30, 0, 0.25)',
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
              ...eventBtnBase,
              background: 'rgba(255, 128, 0, 0.08)',
              border: '1px solid rgba(255, 128, 0, 0.25)',
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
              ...eventBtnBase,
              background: 'rgba(255, 128, 0, 0.08)',
              border: '1px solid rgba(255, 128, 0, 0.25)',
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
              ...eventBtnBase,
              background: 'rgba(0, 128, 67, 0.08)',
              border: '1px solid rgba(0, 128, 67, 0.25)',
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
              ...eventBtnBase,
              background: 'rgba(0, 128, 67, 0.08)',
              border: '1px solid rgba(0, 128, 67, 0.25)',
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
              ...eventBtnBase,
              background: 'rgba(224, 30, 0, 0.08)',
              border: '1px solid rgba(224, 30, 0, 0.25)',
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
              ...eventBtnBase,
              background: 'rgba(0, 128, 67, 0.08)',
              border: '1px solid rgba(0, 128, 67, 0.25)',
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
              ...eventBtnBase,
              background: 'rgba(224, 30, 0, 0.08)',
              border: '1px solid rgba(224, 30, 0, 0.25)',
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
    </>
  );
}
