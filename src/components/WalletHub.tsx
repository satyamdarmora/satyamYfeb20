'use client';

import { useState, useEffect, useRef } from 'react';
import type { WalletTransaction, WalletState, DepositLedger, RateCard } from '@/lib/types';
import { getWalletState, getAssuranceState, getDepositLedger, getRateCard } from '@/lib/data';

interface WalletHubProps {
  onBack: () => void;
}

type FlowStep =
  | 'hub'
  | 'withdraw_amount'
  | 'withdraw_confirm'
  | 'withdraw_receipt'
  | 'add_amount'
  | 'add_method'
  | 'add_confirm'
  | 'add_receipt';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getTypeBadge(type: WalletTransaction['type']): { label: string; color: string; bg: string } {
  switch (type) {
    case 'SETTLEMENT':
      return { label: 'Settlement', color: 'var(--positive)', bg: 'var(--positive-subtle)' };
    case 'BONUS':
      return { label: 'Bonus', color: 'var(--money)', bg: 'var(--money-subtle)' };
    case 'WITHDRAWAL':
      return { label: 'Withdrawal', color: 'var(--negative)', bg: 'var(--negative-subtle)' };
    case 'TOP_UP':
      return { label: 'Top Up', color: 'var(--brand-primary)', bg: 'var(--brand-subtle)' };
    case 'DEDUCTION':
      return { label: 'Deduction', color: 'var(--negative)', bg: 'var(--negative-subtle)' };
    case 'CARRY_FEE':
      return { label: 'Carry Fee', color: 'var(--warning)', bg: 'rgba(255,128,0,0.12)' };
    case 'LOSS_RECOVERY':
      return { label: 'Loss Recovery', color: 'var(--negative)', bg: 'var(--negative-subtle)' };
    case 'INSTALL_HANDLING':
      return { label: 'Install Fee', color: 'var(--positive)', bg: 'var(--positive-subtle)' };
    case 'COLLECTION_HANDLING':
      return { label: 'Collection Fee', color: 'var(--positive)', bg: 'var(--positive-subtle)' };
    default:
      return { label: type, color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' };
  }
}

function getStatusBadge(status: WalletTransaction['status']): { color: string; bg: string } {
  switch (status) {
    case 'COMPLETED':
      return { color: 'var(--positive)', bg: 'var(--positive-subtle)' };
    case 'PENDING':
      return { color: 'var(--warning)', bg: 'rgba(255,128,0,0.12)' };
    case 'FAILED':
      return { color: 'var(--negative)', bg: 'var(--negative-subtle)' };
  }
}

const PAYMENT_METHODS = ['UPI', 'Net Banking', 'Debit Card'];

export default function WalletHub({ onBack }: WalletHubProps) {
  const [walletData, setWalletData] = useState<WalletState>(getWalletState());
  const wallet = walletData;
  const assurance = getAssuranceState();
  const depositLedger = getDepositLedger();
  const rateCard = getRateCard();
  const [step, setStep] = useState<FlowStep>('hub');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [withdrawing, setWithdrawing] = useState(false);
  const walletPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Force-back to hub if wallet freezes mid-withdraw flow
  useEffect(() => {
    if (wallet.frozen && step.startsWith('withdraw_')) {
      setStep('hub');
      setAmount('');
    }
  }, [wallet.frozen, step]);

  // Poll wallet state for cross-device freeze sync
  useEffect(() => {
    walletPollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/wallet');
        const data: WalletState = await res.json();
        if (data) setWalletData(data);
      } catch {
        // API not available, use local
        setWalletData(getWalletState());
      }
    }, 2000);
    return () => {
      if (walletPollRef.current) clearInterval(walletPollRef.current);
    };
  }, []);

  // Derived financial data
  const settlements = wallet.transactions.filter((t) => t.type === 'SETTLEMENT' && t.status === 'COMPLETED');
  const bonuses = wallet.transactions.filter((t) => t.type === 'BONUS' && t.status === 'COMPLETED');
  const totalSettlements = settlements.reduce((s, t) => s + t.amount, 0);
  const totalBonuses = bonuses.reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = wallet.transactions
    .filter((t) => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const lifetimeEarnings = totalSettlements + totalBonuses;

  // Weekly withdrawal cycle check
  const lastWithdrawal = wallet.transactions.find((t) => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED');
  const lastWithdrawalDate = lastWithdrawal ? new Date(lastWithdrawal.date) : null;
  const daysSinceLastWithdrawal = lastWithdrawalDate ? Math.floor((Date.now() - lastWithdrawalDate.getTime()) / 86400000) : Infinity;
  const withdrawalCooldown = daysSinceLastWithdrawal < 7;

  // Carry fee & handling fee derived data
  const carryFees = wallet.transactions.filter((t) => t.type === 'CARRY_FEE' && t.status === 'COMPLETED');
  const totalCarryFees = carryFees.reduce((s, t) => s + Math.abs(t.amount), 0);
  const installHandlingFees = wallet.transactions.filter((t) => t.type === 'INSTALL_HANDLING' && t.status === 'COMPLETED');
  const collectionHandlingFees = wallet.transactions.filter((t) => t.type === 'COLLECTION_HANDLING' && t.status === 'COMPLETED');
  const totalHandlingFees = [...installHandlingFees, ...collectionHandlingFees].reduce((s, t) => s + t.amount, 0);
  const netFeeEffect = totalHandlingFees - totalCarryFees;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 900,
    background: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'slideUpIn 0.25s ease',
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px',
    borderBottom: '1px solid var(--border-subtle)',
    flexShrink: 0,
  };

  const scrollStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  };

  const btnPrimary: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    background: 'var(--brand-primary)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  };

  const btnOutline: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    background: 'transparent',
    color: 'var(--brand-primary)',
    border: '1px solid var(--brand-primary)',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 18,
    fontWeight: 600,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 24,
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    borderRadius: 10,
    padding: '14px 16px',
    marginBottom: 8,
  };

  const backBtn = (target: FlowStep = 'hub') => (
    <button
      onClick={() => { setStep(target); setAmount(''); }}
      style={{
        background: 'none',
        border: 'none',
        color: 'var(--text-secondary)',
        fontSize: 14,
        cursor: 'pointer',
        padding: '4px 0',
        marginBottom: 12,
        fontWeight: 500,
      }}
    >
      &larr; Back
    </button>
  );

  // Hub view -- full financial surface
  if (step === 'hub') {
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 14,
              cursor: 'pointer',
              padding: '4px 0',
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            &larr; Back
          </button>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            Wallet
          </div>
        </div>

        <div style={scrollStyle}>
          {/* Wallet Frozen Banner */}
          {wallet.frozen && (
            <div
              style={{
                background: 'var(--negative-subtle)',
                border: '1px solid var(--negative)',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>{'\u2744'}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--negative)', marginBottom: 4 }}>
                  Wallet Frozen
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {wallet.frozen_reason || 'Withdrawals are disabled. Settlements will accumulate but cannot be withdrawn until the investigation is resolved.'}
                </div>
              </div>
            </div>
          )}

          {/* Balance Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--card-gradient-start), var(--card-gradient-end))',
              borderRadius: 14,
              padding: '24px 20px',
              marginBottom: 4,
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Available Balance
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--money)', marginBottom: 8 }}>
              &#8377;{wallet.balance.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--warning)' }}>
              Pending settlement: &#8377;{wallet.pending_settlement.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Withdrawal rules note */}
          {withdrawalCooldown && lastWithdrawalDate ? (
            <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 12, marginBottom: 4 }}>
              Last withdrawal on {lastWithdrawalDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}. Next available in {7 - daysSinceLastWithdrawal} day{7 - daysSinceLastWithdrawal !== 1 ? 's' : ''}.
            </div>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, marginBottom: 4 }}>
              Withdrawals: {rateCard.withdrawal_cycle} cycle &middot; Min {'\u20B9'}{rateCard.min_withdrawal.toLocaleString('en-IN')}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 4, marginTop: 8 }}>
            <button
              onClick={() => { if (!wallet.frozen && !withdrawalCooldown) setStep('withdraw_amount'); }}
              style={{
                ...btnOutline,
                flex: 1,
                ...((wallet.frozen || withdrawalCooldown) ? { opacity: 0.4, cursor: 'not-allowed', color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' } : {}),
              }}
            >
              Withdraw
            </button>
            <button
              onClick={() => setStep('add_amount')}
              style={{ ...btnPrimary, flex: 1 }}
            >
              Add Money
            </button>
          </div>

          {/* ---- Current Cycle Breakdown ---- */}
          <div style={sectionTitle}>Current Cycle Breakdown</div>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Cycle Earned</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                &#8377;{assurance.cycle_earned.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Active Base</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {assurance.active_base} connections
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Per-connection rate</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                ~&#8377;{assurance.active_base > 0 ? Math.round(assurance.cycle_earned / assurance.active_base).toLocaleString('en-IN') : '0'}/conn
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Next Settlement</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--positive)' }}>
                &#8377;{assurance.next_settlement_amount.toLocaleString('en-IN')} on {assurance.next_settlement_date}
              </span>
            </div>
          </div>

          {/* ---- Carry Fee & Handling Summary ---- */}
          <div style={sectionTitle}>Carry Fee &amp; Handling Summary</div>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Carry Fees Deducted</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--negative)' }}>
                -&#8377;{totalCarryFees.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Handling Fees Earned</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--positive)' }}>
                +&#8377;{totalHandlingFees.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Net Effect on Wallet</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: netFeeEffect >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                {netFeeEffect >= 0 ? '+' : ''}&#8377;{netFeeEffect.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* ---- Deposit Pool Card ---- */}
          <div style={sectionTitle}>Deposit Pool (Separate Ledger)</div>
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 12,
              padding: '16px',
              marginBottom: 8,
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Deposit Balance</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-gold)' }}>
                &#8377;{depositLedger.deposit_balance.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Active Units</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {depositLedger.total_active} units &times; &#8377;{depositLedger.security_deposit_per_unit.toLocaleString('en-IN')}/unit
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Exit Refund Estimate</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--positive)' }}>
                &#8377;{depositLedger.exit_refund_estimate.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Loss Deductions</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--negative)' }}>
                -&#8377;{depositLedger.total_loss_deductions.toLocaleString('en-IN')}
              </span>
            </div>
            <div
              style={{
                background: 'rgba(255,128,0,0.08)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              Deposit pool is separate from wallet balance. It secures NetBox hardware.
            </div>
          </div>

          {/* ---- Rate Card Section ---- */}
          <div style={sectionTitle}>Active Rate Card (v{rateCard.version})</div>
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 12,
              padding: '16px',
              marginBottom: 8,
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Base Payout / Recharge</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                &#8377;{rateCard.base_payout_per_recharge.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Short Duration Payout</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                &#8377;{rateCard.short_duration_payout.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Install Handling Fee</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--positive)' }}>
                &#8377;{rateCard.install_handling_fee.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Collection Handling Fee</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--positive)' }}>
                &#8377;{rateCard.collection_handling_fee.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Bonus Tiers Table */}
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Bonus Tiers
              </div>
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                {/* Table header */}
                <div style={{ display: 'flex', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tier</span>
                  <span style={{ flex: 2, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quality Band</span>
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Bonus</span>
                </div>
                {/* Table rows */}
                {rateCard.bonus_tiers.map((tier) => (
                  <div key={tier.tier} style={{ display: 'flex', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{tier.tier}</span>
                    <span style={{ flex: 2, fontSize: 12, color: 'var(--text-secondary)' }}>{tier.quality_band}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--money)', textAlign: 'right' }}>+{tier.multiplier_percent}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Carry Fee / Day</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--warning)' }}>
                &#8377;{rateCard.carry_fee_per_day.toLocaleString('en-IN')}/day
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Carry Fee Grace Period</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {rateCard.carry_fee_grace_days} days
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Effective From</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {formatDate(rateCard.effective_from)}
              </span>
            </div>
          </div>

          {/* ---- Bonus Breakdown ---- */}
          <div style={sectionTitle}>Bonus Breakdown</div>
          {bonuses.length === 0 ? (
            <div style={{ ...cardStyle, color: 'var(--text-muted)', fontSize: 13 }}>No bonuses this period</div>
          ) : (
            bonuses.map((txn) => (
              <div key={txn.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{txn.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{formatDate(txn.date)}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--money)', whiteSpace: 'nowrap', marginLeft: 12 }}>
                  +&#8377;{txn.amount.toLocaleString('en-IN')}
                </div>
              </div>
            ))
          )}
          <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', background: 'var(--money-subtle)', border: '1px solid rgba(33,150,243,0.2)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Total Bonuses</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--money)' }}>
              &#8377;{totalBonuses.toLocaleString('en-IN')}
            </span>
          </div>

          {/* ---- Settlement History ---- */}
          <div style={sectionTitle}>Settlement History</div>
          {settlements.map((txn) => (
            <div key={txn.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{txn.description}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{formatDate(txn.date)}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--positive)', whiteSpace: 'nowrap', marginLeft: 12 }}>
                +&#8377;{txn.amount.toLocaleString('en-IN')}
              </div>
            </div>
          ))}

          {/* ---- Total Lifetime Earnings ---- */}
          <div style={sectionTitle}>Total Lifetime Earnings</div>
          <div
            style={{
              background: 'linear-gradient(135deg, var(--brand-subtle), var(--money-subtle))',
              border: '1px solid rgba(217,0,141,0.2)',
              borderRadius: 12,
              padding: '20px',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Settlements</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                &#8377;{totalSettlements.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Bonuses</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                &#8377;{totalBonuses.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Withdrawals</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--negative)' }}>
                -&#8377;{totalWithdrawals.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Lifetime Earned</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--money)' }}>
                &#8377;{lifetimeEarnings.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* ---- All Transactions ---- */}
          <div style={sectionTitle}>All Transactions</div>
          {wallet.transactions.map((txn) => {
            const typeBadge = getTypeBadge(txn.type);
            const statusBadge = getStatusBadge(txn.status);
            const isPositive = txn.amount >= 0;

            return (
              <div
                key={txn.id}
                style={{
                  ...cardStyle,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: typeBadge.color,
                        background: typeBadge.bg,
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}
                    >
                      {typeBadge.label}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: statusBadge.color,
                        background: statusBadge.bg,
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {txn.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {txn.description}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {formatDate(txn.date)}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: isPositive ? 'var(--positive)' : 'var(--negative)',
                    whiteSpace: 'nowrap',
                    marginLeft: 12,
                  }}
                >
                  {isPositive ? '+' : ''}{'\u20B9'}{Math.abs(txn.amount).toLocaleString('en-IN')}
                </div>
              </div>
            );
          })}

          <div style={{ height: 40 }} />
        </div>
      </div>
    );
  }

  // Withdraw amount -- enforces Rate Card 6.2 rules
  if (step === 'withdraw_amount') {
    const minWithdrawal = rateCard.min_withdrawal; // ₹500
    const withdrawCycle = rateCard.withdrawal_cycle; // Weekly
    const numAmount = Number(amount);
    const belowMin = numAmount > 0 && numAmount < minWithdrawal;
    const exceedsBalance = numAmount > wallet.balance;
    const canProceed = !wallet.frozen && !withdrawalCooldown && numAmount >= minWithdrawal && numAmount <= wallet.balance;

    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          {backBtn('hub')}
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Withdraw Funds</div>
        </div>
        <div style={scrollStyle}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Available: &#8377;{wallet.balance.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            Withdrawal cycle: {withdrawCycle} &middot; Min: {'\u20B9'}{minWithdrawal.toLocaleString('en-IN')}
          </div>

          {/* Rate Card 6.2: No SLA-based withdrawal restriction */}
          {/* Only integrity investigation (frozen wallet) may temporarily hold funds */}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              Enter amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min ${'\u20B9'}${minWithdrawal}`}
              min={minWithdrawal}
              style={inputStyle}
            />
          </div>

          {/* Validation messages */}
          {belowMin && (
            <div style={{ fontSize: 12, color: 'var(--warning)', marginBottom: 12 }}>
              Minimum withdrawal is {'\u20B9'}{minWithdrawal.toLocaleString('en-IN')} as per Rate Card v{rateCard.version}
            </div>
          )}
          {exceedsBalance && (
            <div style={{ fontSize: 12, color: 'var(--negative)', marginBottom: 12 }}>
              Amount exceeds available balance
            </div>
          )}

          <button
            onClick={() => {
              if (canProceed) {
                setStep('withdraw_confirm');
              }
            }}
            style={{
              ...btnPrimary,
              opacity: canProceed ? 1 : 0.4,
              ...(wallet.frozen ? { cursor: 'not-allowed' } : {}),
            }}
          >
            Continue
          </button>

          {/* Rate Card reference note */}
          <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Per Rate Card v{rateCard.version}: No SLA-based withdrawal restriction. Only integrity investigation may temporarily hold funds. All holds are logged and time-bound.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Withdraw confirm
  if (step === 'withdraw_confirm') {
    const withdrawAmount = Number(amount);

    const handleConfirmWithdraw = async () => {
      if (wallet.frozen || withdrawing || withdrawalCooldown) return;
      // Double-check balance to prevent overdraw
      if (withdrawAmount > wallet.balance || withdrawAmount < rateCard.min_withdrawal) return;

      setWithdrawing(true);

      const txn: WalletTransaction = {
        id: 'WDR-' + Date.now(),
        type: 'WITHDRAWAL',
        amount: -withdrawAmount,
        date: new Date().toISOString(),
        status: 'COMPLETED',
        description: `Withdrawal to HDFC Bank ***4421`,
      };

      try {
        const res = await fetch('/api/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            balance: wallet.balance - withdrawAmount,
            new_transaction: txn,
          }),
        });
        const data = await res.json();
        if (data.state) setWalletData(data.state);
        setStep('withdraw_receipt');
      } catch {
        // Fallback: update local state directly
        setWalletData({
          ...wallet,
          balance: wallet.balance - withdrawAmount,
          transactions: [txn, ...wallet.transactions],
        });
        setStep('withdraw_receipt');
      } finally {
        setWithdrawing(false);
      }
    };

    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          {backBtn('withdraw_amount')}
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Confirm Withdrawal</div>
        </div>
        <div style={scrollStyle}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            padding: '20px',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Amount</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              &#8377;{withdrawAmount.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>To</div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>HDFC Bank ***4421</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
              Balance after: &#8377;{(wallet.balance - withdrawAmount).toLocaleString('en-IN')}
            </div>
          </div>
          <button
            onClick={handleConfirmWithdraw}
            style={{
              ...btnPrimary,
              ...(wallet.frozen || withdrawing ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
            }}
          >
            {withdrawing ? 'Processing...' : 'Confirm Withdrawal'}
          </button>
        </div>
      </div>
    );
  }

  // Withdraw receipt
  if (step === 'withdraw_receipt') {
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Withdrawal Submitted</div>
        </div>
        <div style={{ ...scrollStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--positive-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 28, color: 'var(--positive)' }}>&#10003;</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Withdrawal of</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            &#8377;{Number(amount).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>has been submitted.</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 32 }}>
            Reference: WDR-{Date.now().toString().slice(-6)}
          </div>
          <button onClick={() => { setStep('hub'); setAmount(''); }} style={{ ...btnPrimary, maxWidth: 300 }}>
            Back to Wallet
          </button>
        </div>
      </div>
    );
  }

  // Add money - amount
  if (step === 'add_amount') {
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          {backBtn('hub')}
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Add Money</div>
        </div>
        <div style={scrollStyle}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              Enter amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              style={inputStyle}
            />
          </div>
          <button
            onClick={() => {
              if (Number(amount) > 0) setStep('add_method');
            }}
            style={{
              ...btnPrimary,
              opacity: Number(amount) > 0 ? 1 : 0.4,
            }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Add money - payment method
  if (step === 'add_method') {
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          {backBtn('add_amount')}
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Select Payment Method</div>
        </div>
        <div style={scrollStyle}>
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method}
              onClick={() => { setPaymentMethod(method); setStep('add_confirm'); }}
              style={{
                width: '100%',
                padding: '16px',
                background: paymentMethod === method ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                border: paymentMethod === method ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                borderRadius: 10,
                color: 'var(--text-primary)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: 8,
              }}
            >
              {method}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Add money - confirm
  if (step === 'add_confirm') {
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          {backBtn('add_method')}
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Confirm Top Up</div>
        </div>
        <div style={scrollStyle}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            padding: '20px',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Amount</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              &#8377;{Number(amount).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Payment Method</div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{paymentMethod}</div>
          </div>
          <button onClick={() => setStep('add_receipt')} style={btnPrimary}>
            Confirm Payment
          </button>
        </div>
      </div>
    );
  }

  // Add money - receipt
  if (step === 'add_receipt') {
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Payment Successful</div>
        </div>
        <div style={{ ...scrollStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--positive-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 28, color: 'var(--positive)' }}>&#10003;</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Top up of</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            &#8377;{Number(amount).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>via {paymentMethod} was successful.</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 32 }}>
            Reference: TOP-{Date.now().toString().slice(-6)}
          </div>
          <button onClick={() => { setStep('hub'); setAmount(''); }} style={{ ...btnPrimary, maxWidth: 300 }}>
            Back to Wallet
          </button>
        </div>
      </div>
    );
  }

  return null;
}
