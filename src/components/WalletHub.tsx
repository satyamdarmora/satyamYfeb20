'use client';

import { useState } from 'react';
import type { WalletTransaction } from '@/lib/types';
import { getWalletState, getAssuranceState } from '@/lib/data';

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
      return { label: 'Settlement', color: '#008043', bg: 'rgba(0,128,67,0.12)' };
    case 'BONUS':
      return { label: 'Bonus', color: '#2196F3', bg: 'rgba(33,150,243,0.12)' };
    case 'WITHDRAWAL':
      return { label: 'Withdrawal', color: '#E01E00', bg: 'rgba(224,30,0,0.12)' };
    case 'TOP_UP':
      return { label: 'Top Up', color: '#D9008D', bg: 'rgba(217,0,141,0.12)' };
  }
}

function getStatusBadge(status: WalletTransaction['status']): { color: string; bg: string } {
  switch (status) {
    case 'COMPLETED':
      return { color: '#008043', bg: 'rgba(0,128,67,0.12)' };
    case 'PENDING':
      return { color: '#FF8000', bg: 'rgba(255,128,0,0.12)' };
    case 'FAILED':
      return { color: '#E01E00', bg: 'rgba(224,30,0,0.12)' };
  }
}

const PAYMENT_METHODS = ['UPI', 'Net Banking', 'Debit Card'];

export default function WalletHub({ onBack }: WalletHubProps) {
  const wallet = getWalletState();
  const assurance = getAssuranceState();
  const [step, setStep] = useState<FlowStep>('hub');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);

  // Derived financial data
  const settlements = wallet.transactions.filter((t) => t.type === 'SETTLEMENT' && t.status === 'COMPLETED');
  const bonuses = wallet.transactions.filter((t) => t.type === 'BONUS' && t.status === 'COMPLETED');
  const totalSettlements = settlements.reduce((s, t) => s + t.amount, 0);
  const totalBonuses = bonuses.reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = wallet.transactions
    .filter((t) => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const lifetimeEarnings = totalSettlements + totalBonuses;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 900,
    background: '#161021',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px',
    borderBottom: '1px solid #352D42',
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
    background: '#D9008D',
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
    color: '#D9008D',
    border: '1px solid #D9008D',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: '#352D42',
    border: '1px solid #352D42',
    borderRadius: 10,
    color: '#FAF9FC',
    fontSize: 18,
    fontWeight: 600,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#A7A1B2',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 24,
  };

  const cardStyle: React.CSSProperties = {
    background: '#443152',
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
        color: '#A7A1B2',
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
              color: '#A7A1B2',
              fontSize: 14,
              cursor: 'pointer',
              padding: '4px 0',
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            &larr; Back
          </button>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>
            Wallet
          </div>
        </div>

        <div style={scrollStyle}>
          {/* Balance Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #443152, #665E75)',
              borderRadius: 14,
              padding: '24px 20px',
              marginBottom: 4,
              border: '1px solid #352D42',
            }}
          >
            <div style={{ fontSize: 12, color: '#A7A1B2', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Available Balance
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#2196F3', marginBottom: 8 }}>
              &#8377;{wallet.balance.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 13, color: '#FF8000' }}>
              Pending settlement: &#8377;{wallet.pending_settlement.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 4, marginTop: 16 }}>
            <button
              onClick={() => setStep('withdraw_amount')}
              style={{ ...btnOutline, flex: 1 }}
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
              <span style={{ fontSize: 13, color: '#A7A1B2' }}>Cycle Earned</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#FAF9FC' }}>
                &#8377;{assurance.cycle_earned.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#A7A1B2' }}>Active Base</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#FAF9FC' }}>
                {assurance.active_base} connections
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#A7A1B2' }}>Per-connection rate</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#FAF9FC' }}>
                ~&#8377;{assurance.active_base > 0 ? Math.round(assurance.cycle_earned / assurance.active_base).toLocaleString('en-IN') : '0'}/conn
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #352D42' }}>
              <span style={{ fontSize: 13, color: '#A7A1B2' }}>Next Settlement</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#008043' }}>
                &#8377;{assurance.next_settlement_amount.toLocaleString('en-IN')} on {assurance.next_settlement_date}
              </span>
            </div>
          </div>

          {/* ---- Bonus Breakdown ---- */}
          <div style={sectionTitle}>Bonus Breakdown</div>
          {bonuses.length === 0 ? (
            <div style={{ ...cardStyle, color: '#665E75', fontSize: 13 }}>No bonuses this period</div>
          ) : (
            bonuses.map((txn) => (
              <div key={txn.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#FAF9FC', fontWeight: 500 }}>{txn.description}</div>
                  <div style={{ fontSize: 11, color: '#665E75', marginTop: 2 }}>{formatDate(txn.date)}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#2196F3', whiteSpace: 'nowrap', marginLeft: 12 }}>
                  +&#8377;{txn.amount.toLocaleString('en-IN')}
                </div>
              </div>
            ))
          )}
          <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', background: 'rgba(33,150,243,0.08)', border: '1px solid rgba(33,150,243,0.2)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#A7A1B2' }}>Total Bonuses</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#2196F3' }}>
              &#8377;{totalBonuses.toLocaleString('en-IN')}
            </span>
          </div>

          {/* ---- Settlement History ---- */}
          <div style={sectionTitle}>Settlement History</div>
          {settlements.map((txn) => (
            <div key={txn.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: '#FAF9FC', fontWeight: 500 }}>{txn.description}</div>
                <div style={{ fontSize: 11, color: '#665E75', marginTop: 2 }}>{formatDate(txn.date)}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#008043', whiteSpace: 'nowrap', marginLeft: 12 }}>
                +&#8377;{txn.amount.toLocaleString('en-IN')}
              </div>
            </div>
          ))}

          {/* ---- Total Lifetime Earnings ---- */}
          <div style={sectionTitle}>Total Lifetime Earnings</div>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(217,0,141,0.1), rgba(33,150,243,0.1))',
              border: '1px solid rgba(217,0,141,0.2)',
              borderRadius: 12,
              padding: '20px',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#A7A1B2' }}>Total Settlements</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#FAF9FC' }}>
                &#8377;{totalSettlements.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#A7A1B2' }}>Total Bonuses</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#FAF9FC' }}>
                &#8377;{totalBonuses.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#A7A1B2' }}>Total Withdrawals</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#E01E00' }}>
                -&#8377;{totalWithdrawals.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #352D42' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#FAF9FC' }}>Lifetime Earned</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#2196F3' }}>
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
                  <div style={{ fontSize: 13, color: '#FAF9FC', marginBottom: 2 }}>
                    {txn.description}
                  </div>
                  <div style={{ fontSize: 11, color: '#665E75' }}>
                    {formatDate(txn.date)}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: isPositive ? '#008043' : '#E01E00',
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

  // Withdraw amount
  if (step === 'withdraw_amount') {
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          {backBtn('hub')}
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>Withdraw Funds</div>
        </div>
        <div style={scrollStyle}>
          <div style={{ fontSize: 13, color: '#A7A1B2', marginBottom: 8 }}>
            Available: &#8377;{wallet.balance.toLocaleString('en-IN')}
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, color: '#A7A1B2', display: 'block', marginBottom: 8 }}>
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
              if (Number(amount) > 0 && Number(amount) <= wallet.balance) {
                setStep('withdraw_confirm');
              }
            }}
            style={{
              ...btnPrimary,
              opacity: Number(amount) > 0 && Number(amount) <= wallet.balance ? 1 : 0.4,
            }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Withdraw confirm
  if (step === 'withdraw_confirm') {
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          {backBtn('withdraw_amount')}
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>Confirm Withdrawal</div>
        </div>
        <div style={scrollStyle}>
          <div style={{
            background: '#443152',
            borderRadius: 12,
            padding: '20px',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 13, color: '#A7A1B2', marginBottom: 4 }}>Amount</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#FAF9FC', marginBottom: 16 }}>
              &#8377;{Number(amount).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 13, color: '#A7A1B2', marginBottom: 4 }}>To</div>
            <div style={{ fontSize: 14, color: '#FAF9FC' }}>HDFC Bank ***4421</div>
          </div>
          <button onClick={() => setStep('withdraw_receipt')} style={btnPrimary}>
            Confirm Withdrawal
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
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>Withdrawal Submitted</div>
        </div>
        <div style={{ ...scrollStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,128,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 28, color: '#008043' }}>&#10003;</span>
          </div>
          <div style={{ fontSize: 14, color: '#A7A1B2', marginBottom: 8 }}>Withdrawal of</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#FAF9FC', marginBottom: 8 }}>
            &#8377;{Number(amount).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 13, color: '#A7A1B2', marginBottom: 4 }}>has been submitted.</div>
          <div style={{ fontSize: 12, color: '#665E75', marginBottom: 32 }}>
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
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>Add Money</div>
        </div>
        <div style={scrollStyle}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, color: '#A7A1B2', display: 'block', marginBottom: 8 }}>
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
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>Select Payment Method</div>
        </div>
        <div style={scrollStyle}>
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method}
              onClick={() => { setPaymentMethod(method); setStep('add_confirm'); }}
              style={{
                width: '100%',
                padding: '16px',
                background: paymentMethod === method ? '#665E75' : '#443152',
                border: paymentMethod === method ? '1px solid #D9008D' : '1px solid #352D42',
                borderRadius: 10,
                color: '#FAF9FC',
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
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>Confirm Top Up</div>
        </div>
        <div style={scrollStyle}>
          <div style={{
            background: '#443152',
            borderRadius: 12,
            padding: '20px',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 13, color: '#A7A1B2', marginBottom: 4 }}>Amount</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#FAF9FC', marginBottom: 16 }}>
              &#8377;{Number(amount).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 13, color: '#A7A1B2', marginBottom: 4 }}>Payment Method</div>
            <div style={{ fontSize: 14, color: '#FAF9FC' }}>{paymentMethod}</div>
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
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>Payment Successful</div>
        </div>
        <div style={{ ...scrollStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,128,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 28, color: '#008043' }}>&#10003;</span>
          </div>
          <div style={{ fontSize: 14, color: '#A7A1B2', marginBottom: 8 }}>Top up of</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#FAF9FC', marginBottom: 8 }}>
            &#8377;{Number(amount).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 13, color: '#A7A1B2', marginBottom: 4 }}>via {paymentMethod} was successful.</div>
          <div style={{ fontSize: 12, color: '#665E75', marginBottom: 32 }}>
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
