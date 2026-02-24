'use client';

import { useState, useMemo } from 'react';
import type { Task, NetBoxUnit, DepositLedger, NetBoxUnitStatus, DepositTransaction, RateCard, WalletState } from '@/lib/types';
import { getAllTasks, getDepositLedger, getNetBoxUnits, getRateCard, getWalletState } from '@/lib/data';

interface NetBoxHubProps {
  onBack: () => void;
}

type FlowStep = 'hub' | 'unit_detail' | 'create_order' | 'order_payment' | 'order_confirm' | 'order_receipt' | 'order_detail';
type DepositPayMethod = 'wallet' | 'upi' | 'netbanking' | 'debit_card';

interface NetBoxOrder {
  id: string;
  quantity: number;
  delivery_area: string;
  status: 'ORDERED' | 'DISPATCHED' | 'DELIVERED';
  created_at: string;
}

const AREAS = ['Andheri West', 'Bandra East', 'Powai', 'Malad West', 'Goregaon East', 'Borivali West', 'Jogeshwari West', 'Kandivali West'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusColor(status: NetBoxUnitStatus): string {
  switch (status) {
    case 'WITH_CUSTOMER':
      return 'var(--positive)';
    case 'EXPIRED_WITH_CUSTOMER':
      return 'var(--warning)';
    case 'COLLECTED_IN_TRANSIT':
      return 'var(--brand-primary)';
    case 'IN_WAREHOUSE':
      return 'var(--text-muted)';
    case 'LOST':
      return 'var(--negative)';
    case 'DAMAGED':
      return 'var(--negative)';
  }
}

function getStatusLabel(status: NetBoxUnitStatus): string {
  switch (status) {
    case 'WITH_CUSTOMER':
      return 'With Customer';
    case 'EXPIRED_WITH_CUSTOMER':
      return 'Expired';
    case 'COLLECTED_IN_TRANSIT':
      return 'In Transit';
    case 'IN_WAREHOUSE':
      return 'In Warehouse';
    case 'LOST':
      return 'Lost';
    case 'DAMAGED':
      return 'Damaged';
  }
}

function getStatusBg(status: NetBoxUnitStatus): string {
  switch (status) {
    case 'WITH_CUSTOMER':
      return 'rgba(0,128,67,0.12)';
    case 'EXPIRED_WITH_CUSTOMER':
      return 'rgba(255,128,0,0.12)';
    case 'COLLECTED_IN_TRANSIT':
      return 'rgba(217,0,141,0.12)';
    case 'IN_WAREHOUSE':
      return 'rgba(92,111,130,0.12)';
    case 'LOST':
      return 'rgba(220,38,38,0.12)';
    case 'DAMAGED':
      return 'rgba(220,38,38,0.12)';
  }
}

function getDepositTxnBadge(type: DepositTransaction['type']): { label: string; color: string; bg: string } {
  switch (type) {
    case 'DEPOSIT_COLLECTED':
      return { label: 'Deposit', color: 'var(--positive)', bg: 'rgba(0,128,67,0.12)' };
    case 'LOSS_DEDUCTION':
      return { label: 'Loss', color: 'var(--negative)', bg: 'rgba(220,38,38,0.12)' };
    case 'DAMAGE_DEDUCTION':
      return { label: 'Damage', color: 'var(--warning)', bg: 'rgba(255,128,0,0.12)' };
    case 'DEPOSIT_REFUND':
      return { label: 'Refund', color: 'var(--brand-primary)', bg: 'rgba(217,0,141,0.12)' };
  }
}

function getOrderStatusColor(status: NetBoxOrder['status']): string {
  switch (status) {
    case 'DELIVERED':
      return 'var(--positive)';
    case 'DISPATCHED':
      return 'var(--brand-primary)';
    case 'ORDERED':
      return 'var(--warning)';
  }
}

function getOrderStatusBg(status: NetBoxOrder['status']): string {
  switch (status) {
    case 'DELIVERED':
      return 'rgba(0,128,67,0.12)';
    case 'DISPATCHED':
      return 'rgba(217,0,141,0.12)';
    case 'ORDERED':
      return 'rgba(255,128,0,0.12)';
  }
}

function getTaskStateColor(state: string): string {
  const active = ['IN_PROGRESS', 'ASSIGNED'];
  const alert = ['PICKUP_REQUIRED'];
  const done = ['RETURN_CONFIRMED', 'COLLECTED'];
  const fail = ['LOST_DECLARED'];

  if (active.includes(state)) return 'var(--brand-primary)';
  if (alert.includes(state)) return 'var(--warning)';
  if (done.includes(state)) return 'var(--positive)';
  if (fail.includes(state)) return 'var(--negative)';
  return 'var(--text-secondary)';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NetBoxHub({ onBack }: NetBoxHubProps) {
  const [step, setStep] = useState<FlowStep>('hub');
  const [selectedUnit, setSelectedUnit] = useState<NetBoxUnit | null>(null);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);

  // Order flow state
  const [orders, setOrders] = useState<NetBoxOrder[]>([
    {
      id: 'ORD-0001',
      quantity: 5,
      delivery_area: 'Andheri West',
      status: 'DELIVERED',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ORD-0002',
      quantity: 3,
      delivery_area: 'Bandra East',
      status: 'DISPATCHED',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);
  const [selectedOrder, setSelectedOrder] = useState<NetBoxOrder | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [deliveryArea, setDeliveryArea] = useState(AREAS[0]);
  const [depositPayMethod, setDepositPayMethod] = useState<DepositPayMethod>('wallet');
  const [processing, setProcessing] = useState(false);

  // Data
  const ledger = useMemo<DepositLedger>(() => getDepositLedger(), []);
  const rateCard = useMemo<RateCard>(() => getRateCard(), []);
  const units = ledger.units;
  const transactions = ledger.transactions;

  // Inventory counts by status
  const statusCounts = useMemo(() => {
    const counts: Record<NetBoxUnitStatus, number> = {
      WITH_CUSTOMER: 0,
      EXPIRED_WITH_CUSTOMER: 0,
      COLLECTED_IN_TRANSIT: 0,
      IN_WAREHOUSE: 0,
      LOST: 0,
      DAMAGED: 0,
    };
    units.forEach((u) => {
      counts[u.status]++;
    });
    return counts;
  }, [units]);

  // Carry fee units
  const carryFeeUnits = useMemo(
    () => units.filter((u) => u.carry_fee_eligible || u.carry_fee_accrued > 0),
    [units],
  );

  const totalCarryFeeAccrued = useMemo(
    () => carryFeeUnits.reduce((sum, u) => sum + u.carry_fee_accrued, 0),
    [carryFeeUnits],
  );

  // NETBOX tasks grouped by state
  const netboxTaskGroups = useMemo(() => {
    const all = getAllTasks().filter((t: Task) => t.task_type === 'NETBOX');
    const groups: Record<string, Task[]> = {};
    all.forEach((t: Task) => {
      if (!groups[t.state]) groups[t.state] = [];
      groups[t.state].push(t);
    });
    return groups;
  }, []);

  // ---------------------------------------------------------------------------
  // Shared styles
  // ---------------------------------------------------------------------------

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

  const backBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: 14,
    cursor: 'pointer',
    padding: '4px 0',
    marginBottom: 12,
    fontWeight: 500,
  };

  // ---------------------------------------------------------------------------
  // unit_detail view
  // ---------------------------------------------------------------------------

  if (step === 'unit_detail' && selectedUnit) {
    const u = selectedUnit;
    const statusColor = getStatusColor(u.status);

    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          <button
            onClick={() => { setStep('hub'); setSelectedUnit(null); }}
            style={backBtnStyle}
          >
            &larr; Back
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {u.netbox_id}
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: statusColor,
              background: getStatusBg(u.status),
              padding: '4px 10px',
              borderRadius: 4,
            }}>
              {getStatusLabel(u.status)}
            </span>
          </div>
        </div>

        <div style={scrollStyle}>
          {/* Unit detail card */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            padding: '20px',
            marginBottom: 20,
            borderLeft: `4px solid ${statusColor}`,
          }}>
            {/* Connection ID */}
            {u.connection_id && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Connection ID</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{u.connection_id}</span>
              </div>
            )}

            {/* Customer area */}
            {u.customer_area && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Area</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{u.customer_area}</span>
              </div>
            )}

            {/* Issued date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Issued</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{formatDate(u.issued_at)}</span>
            </div>

            {/* Subscription expiry */}
            {u.subscription_expiry_at && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Subscription Expiry</span>
                <span style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: u.days_past_expiry > 0 ? 'var(--negative)' : 'var(--text-primary)',
                }}>
                  {formatDate(u.subscription_expiry_at)}
                  {u.days_past_expiry > 0 && (
                    <span style={{ fontSize: 11, marginLeft: 6, color: 'var(--negative)' }}>
                      ({u.days_past_expiry}d overdue)
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Collected date */}
            {u.collected_at && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Collected</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{formatDate(u.collected_at)}</span>
              </div>
            )}

            {/* Returned date */}
            {u.returned_at && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Returned</span>
                <span style={{ fontSize: 13, color: 'var(--positive)' }}>{formatDate(u.returned_at)}</span>
              </div>
            )}

            {/* Lost date */}
            {u.lost_declared_at && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Lost Declared</span>
                <span style={{ fontSize: 13, color: 'var(--negative)', fontWeight: 600 }}>{formatDate(u.lost_declared_at)}</span>
              </div>
            )}

            {/* Security deposit */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Security Deposit</span>
              <span style={{ fontSize: 13, color: 'var(--accent-gold)', fontWeight: 600 }}>
                {'\u20B9'}{ledger.security_deposit_per_unit.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Carry fee section -- only for relevant units */}
          {(u.carry_fee_eligible || u.carry_fee_accrued > 0) && (
            <>
              <div style={{ ...sectionTitle, marginTop: 8 }}>Carry Fee Details</div>
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: 12,
                padding: '16px 20px',
                marginBottom: 16,
                border: '1px solid rgba(255,128,0,0.25)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Status</span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: u.carry_fee_eligible ? 'var(--warning)' : 'var(--text-muted)',
                    background: u.carry_fee_eligible ? 'rgba(255,128,0,0.12)' : 'rgba(92,111,130,0.12)',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}>
                    {u.carry_fee_eligible ? 'Accruing' : 'Stopped'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Days Past Expiry</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)' }}>
                    {u.days_past_expiry} days
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Rate</span>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {'\u20B9'}{ledger.carry_fee_per_day}/day
                  </span>
                </div>

                {u.carry_fee_start_at && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Accruing Since</span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                      {formatDate(u.carry_fee_start_at)}
                    </span>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 10,
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Total Accrued</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--negative)' }}>
                    {'\u20B9'}{u.carry_fee_accrued.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Related deposit transactions */}
          <div style={{ ...sectionTitle, marginTop: 8 }}>Deposit Transactions</div>
          {transactions.filter((t) => t.netbox_id === u.netbox_id).length === 0 ? (
            <div style={{ ...cardStyle, color: 'var(--text-muted)', fontSize: 13 }}>
              No deposit transactions for this unit
            </div>
          ) : (
            transactions
              .filter((t) => t.netbox_id === u.netbox_id)
              .map((txn) => {
                const badge = getDepositTxnBadge(txn.type);
                const isPositive = txn.amount >= 0;
                return (
                  <div key={txn.id} style={{
                    ...cardStyle,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: badge.color,
                        background: badge.bg,
                        padding: '2px 8px',
                        borderRadius: 4,
                        marginBottom: 4,
                        display: 'inline-block',
                      }}>
                        {badge.label}
                      </span>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        {txn.description}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {formatDate(txn.date)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: isPositive ? 'var(--positive)' : 'var(--negative)',
                      whiteSpace: 'nowrap',
                      marginLeft: 12,
                    }}>
                      {isPositive ? '+' : ''}{'\u20B9'}{Math.abs(txn.amount).toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })
          )}

          <div style={{ height: 40 }} />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // create_order view
  // ---------------------------------------------------------------------------

  if (step === 'create_order') {
    const depositTotal = quantity * ledger.security_deposit_per_unit;

    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          <button onClick={() => setStep('hub')} style={backBtnStyle}>&larr; Back</button>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Request NetBox</div>
        </div>

        <div style={scrollStyle}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '20px', marginBottom: 20 }}>
            {/* Quantity */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Quantity
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}
                >-</button>
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', minWidth: 40, textAlign: 'center' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}
                >+</button>
              </div>
            </div>

            {/* Delivery area */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Delivery Area</label>
              <select
                value={deliveryArea}
                onChange={(e) => setDeliveryArea(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', appearance: 'auto' }}
              >
                {AREAS.map((area) => (<option key={area} value={area}>{area}</option>))}
              </select>
            </div>

            {/* Deposit summary */}
            <div style={{ padding: '14px', background: 'rgba(255,128,0,0.06)', borderRadius: 8, border: '1px solid rgba(255,128,0,0.15)', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Deposit per unit</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{'\u20B9'}{ledger.security_deposit_per_unit.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Total deposit</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-gold)' }}>{'\u20B9'}{depositTotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Refundable on unit return</div>
            </div>

            <button
              onClick={() => setStep('order_payment')}
              style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: 'var(--brand-primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // order_payment -- choose how to pay the deposit
  // ---------------------------------------------------------------------------

  if (step === 'order_payment') {
    const depositTotal = quantity * ledger.security_deposit_per_unit;
    const walletBalance = getWalletState().balance;
    const canPayFromWallet = walletBalance >= depositTotal;

    const payOptions: { id: DepositPayMethod; label: string; sub: string; disabled?: boolean }[] = [
      { id: 'wallet', label: 'Pay from Wallet', sub: canPayFromWallet ? `Balance: \u20B9${walletBalance.toLocaleString('en-IN')}` : `Insufficient balance (\u20B9${walletBalance.toLocaleString('en-IN')})`, disabled: !canPayFromWallet },
      { id: 'upi', label: 'UPI', sub: 'GPay, PhonePe, Paytm' },
      { id: 'netbanking', label: 'Net Banking', sub: 'All major banks' },
      { id: 'debit_card', label: 'Debit Card', sub: 'Visa, Mastercard, RuPay' },
    ];

    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          <button onClick={() => setStep('create_order')} style={backBtnStyle}>&larr; Back</button>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Pay Deposit</div>
        </div>
        <div style={scrollStyle}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
            {quantity} unit{quantity > 1 ? 's' : ''} &middot; {deliveryArea}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-gold)', marginBottom: 20 }}>
            {'\u20B9'}{depositTotal.toLocaleString('en-IN')}
          </div>

          {payOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { if (!opt.disabled) { setDepositPayMethod(opt.id); setStep('order_confirm'); } }}
              style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px', background: 'var(--bg-card)', border: opt.disabled ? '1px solid var(--border-subtle)' : '1px solid var(--border-subtle)',
                borderRadius: 10, cursor: opt.disabled ? 'not-allowed' : 'pointer', textAlign: 'left', marginBottom: 8,
                opacity: opt.disabled ? 0.5 : 1,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: opt.disabled ? 'var(--negative)' : 'var(--text-muted)', marginTop: 2 }}>{opt.sub}</div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{'\u203A'}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // order_confirm -- review and confirm deposit payment
  // ---------------------------------------------------------------------------

  if (step === 'order_confirm') {
    const depositTotal = quantity * ledger.security_deposit_per_unit;
    const methodLabel = depositPayMethod === 'wallet' ? 'Wallet Balance' : depositPayMethod === 'upi' ? 'UPI' : depositPayMethod === 'netbanking' ? 'Net Banking' : 'Debit Card';

    const handleConfirmOrder = async () => {
      if (processing) return;
      setProcessing(true);

      try {
        // If paying from wallet, deduct balance
        if (depositPayMethod === 'wallet') {
          await fetch('/api/wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              balance: getWalletState().balance - depositTotal,
              new_transaction: {
                id: 'DEP-W-' + Date.now(),
                type: 'DEDUCTION' as const,
                amount: -depositTotal,
                date: new Date().toISOString(),
                status: 'COMPLETED' as const,
                description: `NetBox deposit (${quantity} unit${quantity > 1 ? 's' : ''})`,
              },
            }),
          });
        }

        // Record deposit transactions in the deposit ledger
        for (let i = 0; i < quantity; i++) {
          await fetch('/api/deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'collect_deposit',
              amount: ledger.security_deposit_per_unit,
              description: `Deposit for NetBox order`,
            }),
          });
        }
      } catch {
        // Continue even if API fails — order is local state
      }

      const newOrder: NetBoxOrder = {
        id: `ORD-${String(orders.length + 1).padStart(4, '0')}`,
        quantity,
        delivery_area: deliveryArea,
        status: 'ORDERED',
        created_at: new Date().toISOString(),
      };
      setOrders((prev) => [newOrder, ...prev]);
      setSelectedOrder(newOrder);
      setProcessing(false);
      setStep('order_receipt');
    };

    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          <button onClick={() => setStep('order_payment')} style={backBtnStyle}>&larr; Back</button>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Confirm Order</div>
        </div>
        <div style={scrollStyle}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Quantity</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{quantity} unit{quantity > 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Delivery Area</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{deliveryArea}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Payment</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{methodLabel}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Deposit Amount</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-gold)' }}>{'\u20B9'}{depositTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {depositPayMethod === 'wallet' && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              {'\u20B9'}{depositTotal.toLocaleString('en-IN')} will be deducted from your wallet balance.
            </div>
          )}

          <button
            onClick={handleConfirmOrder}
            style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: 'var(--brand-primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: processing ? 0.5 : 1 }}
          >
            {processing ? 'Processing...' : `Pay \u20B9${depositTotal.toLocaleString('en-IN')} & Place Order`}
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // order_receipt -- payment success
  // ---------------------------------------------------------------------------

  if (step === 'order_receipt') {
    const depositTotal = quantity * ledger.security_deposit_per_unit;
    const methodLabel = depositPayMethod === 'wallet' ? 'Wallet' : depositPayMethod === 'upi' ? 'UPI' : depositPayMethod === 'netbanking' ? 'Net Banking' : 'Debit Card';

    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Order Placed</div>
        </div>
        <div style={{ ...scrollStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,128,67,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 28, color: 'var(--positive)' }}>{'\u2713'}</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>Deposit paid</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{'\u20B9'}{depositTotal.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>via {methodLabel}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {quantity} unit{quantity > 1 ? 's' : ''} &middot; {deliveryArea}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 32 }}>Refundable when units are returned</div>
          <button
            onClick={() => {
              if (selectedOrder) { setStep('order_detail'); }
              else { setStep('hub'); }
              setQuantity(1);
              setDeliveryArea(AREAS[0]);
            }}
            style={{ width: '100%', maxWidth: 300, padding: '14px', borderRadius: 10, border: 'none', background: 'var(--brand-primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            View Order
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // order_detail view
  // ---------------------------------------------------------------------------

  if (step === 'order_detail' && selectedOrder) {
    const o = selectedOrder;
    const statusColor = getOrderStatusColor(o.status);
    const timelineSteps = ['Order Placed', 'Processing', 'Dispatched', 'Delivered'];
    const statusToStepIndex: Record<NetBoxOrder['status'], number> = {
      ORDERED: 1,
      DISPATCHED: 2,
      DELIVERED: 3,
    };
    const activeStepIndex = statusToStepIndex[o.status];

    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          <button
            onClick={() => { setStep('hub'); setSelectedOrder(null); }}
            style={backBtnStyle}
          >
            &larr; Back
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {o.id}
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: statusColor,
              background: getOrderStatusBg(o.status),
              padding: '4px 10px',
              borderRadius: 4,
            }}>
              {o.status}
            </span>
          </div>
        </div>

        <div style={scrollStyle}>
          {/* Order info card */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            padding: '20px',
            marginBottom: 20,
            borderLeft: `4px solid ${statusColor}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Order ID</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{o.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Quantity</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{o.quantity} units</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Delivery Area</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{o.delivery_area}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Ordered On</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{formatDate(o.created_at)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Deposit Due</span>
              <span style={{ fontSize: 13, color: 'var(--accent-gold)', fontWeight: 600 }}>
                {'\u20B9'}{(ledger.security_deposit_per_unit * o.quantity).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Status timeline */}
          <div style={sectionTitle}>Order Status</div>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            padding: '20px',
            marginBottom: 20,
          }}>
            {timelineSteps.map((label, idx) => {
              const isCompleted = idx <= activeStepIndex;
              const isActive = idx === activeStepIndex;
              const isLast = idx === timelineSteps.length - 1;
              const dotColor = isCompleted ? statusColor : 'var(--text-muted)';

              return (
                <div key={label} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                  {/* Vertical line + dot */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
                    <div style={{
                      width: isActive ? 16 : 12,
                      height: isActive ? 16 : 12,
                      borderRadius: '50%',
                      background: isCompleted ? dotColor : 'transparent',
                      border: isCompleted ? 'none' : '2px solid var(--text-muted)',
                      flexShrink: 0,
                      marginTop: 2,
                      boxShadow: isActive ? `0 0 0 4px ${getOrderStatusBg(o.status)}` : 'none',
                    }} />
                    {!isLast && (
                      <div style={{
                        width: 2,
                        flex: 1,
                        minHeight: 28,
                        background: isCompleted && idx < activeStepIndex ? dotColor : 'var(--border-subtle)',
                      }} />
                    )}
                  </div>
                  {/* Label */}
                  <div style={{
                    paddingBottom: isLast ? 0 : 20,
                  }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: isActive ? 700 : 500,
                      color: isCompleted ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}>
                      {label}
                    </div>
                    {isActive && (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        Current status
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ height: 40 }} />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // hub view -- main dashboard
  // ---------------------------------------------------------------------------

  return (
    <div style={overlayStyle}>
      <div style={headerStyle}>
        <button onClick={onBack} style={backBtnStyle}>
          &larr; Back
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            NetBox Inventory
          </div>
          <button
            onClick={() => { setQuantity(1); setDeliveryArea(AREAS[0]); setStep('create_order'); }}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--brand-primary)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Request NetBox
          </button>
        </div>
      </div>

      <div style={scrollStyle}>

        {/* ================================================================== */}
        {/* 1. DEPOSIT POOL SUMMARY CARD                                       */}
        {/* ================================================================== */}

        <div style={{
          background: 'linear-gradient(135deg, var(--card-gradient-start), var(--card-gradient-end))',
          borderRadius: 14,
          padding: '24px 20px',
          marginBottom: 4,
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            Deposit Pool Balance
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent-gold)', marginBottom: 4 }}>
            {'\u20B9'}{ledger.deposit_balance.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            {'\u20B9'}{ledger.security_deposit_per_unit.toLocaleString('en-IN')} x {ledger.total_active} active units = {'\u20B9'}{(ledger.security_deposit_per_unit * ledger.total_active).toLocaleString('en-IN')} held
          </div>

          {/* Summary row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{ledger.total_issued}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Issued</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--positive)' }}>{ledger.total_active}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)' }}>{ledger.total_returned}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Returned</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--negative)' }}>{ledger.total_lost}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Lost</div>
            </div>
          </div>

          {/* Exit refund */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTop: '1px solid var(--border-subtle)',
            marginTop: 8,
          }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Exit Refund Estimate</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--money)' }}>
              {'\u20B9'}{ledger.exit_refund_estimate.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Loss recovery warning */}
          {ledger.total_lost > 0 && (
            <div style={{
              marginTop: 12,
              padding: '10px 12px',
              background: 'rgba(220,38,38,0.08)',
              borderRadius: 8,
              border: '1px solid rgba(220,38,38,0.2)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--negative)', marginBottom: 2 }}>
                Loss Recovery Applied
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {ledger.total_lost} unit{ledger.total_lost > 1 ? 's' : ''} lost. {'\u20B9'}{ledger.total_loss_deductions.toLocaleString('en-IN')} deducted from deposit pool at {'\u20B9'}{ledger.replacement_cost.toLocaleString('en-IN')}/unit replacement cost.
              </div>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* 2. INVENTORY STATUS GRID                                           */}
        {/* ================================================================== */}

        <div style={sectionTitle}>Inventory by Status</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          marginBottom: 4,
        }}>
          {(
            [
              'WITH_CUSTOMER',
              'EXPIRED_WITH_CUSTOMER',
              'COLLECTED_IN_TRANSIT',
              'IN_WAREHOUSE',
              'LOST',
              'DAMAGED',
            ] as NetBoxUnitStatus[]
          ).map((status) => {
            const count = statusCounts[status];
            const color = getStatusColor(status);
            const hasCarryFee = status === 'EXPIRED_WITH_CUSTOMER' && carryFeeUnits.some((u) => u.carry_fee_eligible && u.status === 'EXPIRED_WITH_CUSTOMER');

            return (
              <div
                key={status}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 10,
                  padding: '14px 12px',
                  borderTop: `3px solid ${color}`,
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, color, marginBottom: 4 }}>
                  {count}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.3 }}>
                  {getStatusLabel(status)}
                </div>
                {hasCarryFee && (
                  <div style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--warning)',
                  }}
                    title="Carry fee accruing"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ================================================================== */}
        {/* 3. CARRY FEE TRACKER                                               */}
        {/* ================================================================== */}

        <div style={sectionTitle}>Carry Fee Tracker</div>

        {carryFeeUnits.length === 0 ? (
          <div style={{ ...cardStyle, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            No units with carry fees
          </div>
        ) : (
          <>
            {/* Grace period note */}
            <div style={{
              padding: '10px 14px',
              background: 'rgba(255,128,0,0.06)',
              borderRadius: 8,
              border: '1px solid rgba(255,128,0,0.15)',
              marginBottom: 10,
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}>
              Carry fee of {'\u20B9'}{ledger.carry_fee_per_day}/day starts {ledger.carry_fee_grace_days} days after subscription expiry. Charged to wallet, not deposit.
            </div>

            {carryFeeUnits.map((u) => (
              <div
                key={u.netbox_id}
                style={{
                  ...cardStyle,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderLeft: `3px solid ${u.carry_fee_eligible ? 'var(--warning)' : 'var(--text-muted)'}`,
                  cursor: 'pointer',
                }}
                onClick={() => { setSelectedUnit(u); setStep('unit_detail'); }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{u.netbox_id}</span>
                    {u.carry_fee_eligible && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'var(--warning)',
                        background: 'rgba(255,128,0,0.12)',
                        padding: '1px 6px',
                        borderRadius: 3,
                      }}>
                        ACCRUING
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {u.days_past_expiry}d past expiry &middot; {'\u20B9'}{ledger.carry_fee_per_day}/day
                  </div>
                </div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: u.carry_fee_accrued > 0 ? 'var(--negative)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  marginLeft: 12,
                }}>
                  {'\u20B9'}{u.carry_fee_accrued.toLocaleString('en-IN')}
                </div>
              </div>
            ))}

            {/* Total carry fees */}
            <div style={{
              ...cardStyle,
              display: 'flex',
              justifyContent: 'space-between',
              background: 'rgba(255,128,0,0.06)',
              border: '1px solid rgba(255,128,0,0.2)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Total Carry Fee Accrued</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--negative)' }}>
                {'\u20B9'}{totalCarryFeeAccrued.toLocaleString('en-IN')}
              </span>
            </div>
          </>
        )}

        {/* ================================================================== */}
        {/* 4. UNIT LIST                                                       */}
        {/* ================================================================== */}

        <div style={sectionTitle}>All Units ({units.length})</div>

        {units.map((u) => {
          const isExpanded = expandedUnitId === u.netbox_id;
          const statusColor = getStatusColor(u.status);

          return (
            <div
              key={u.netbox_id}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 10,
                marginBottom: 8,
                borderLeft: `4px solid ${statusColor}`,
                overflow: 'hidden',
              }}
            >
              {/* Summary row -- always visible */}
              <button
                onClick={() => setExpandedUnitId(isExpanded ? null : u.netbox_id)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {u.netbox_id}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: statusColor,
                      background: getStatusBg(u.status),
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}>
                      {getStatusLabel(u.status)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {u.connection_id || 'No connection'} &middot; {u.customer_area || 'N/A'} &middot; {formatDate(u.issued_at)}
                  </div>
                </div>
                <span style={{
                  fontSize: 16,
                  color: 'var(--text-muted)',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  flexShrink: 0,
                  marginLeft: 8,
                }}>
                  &#9660;
                </span>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{
                  padding: '0 16px 14px',
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ paddingTop: 12 }}>
                    {/* Subscription expiry */}
                    {u.subscription_expiry_at && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Subscription Expiry</span>
                        <span style={{
                          fontSize: 12,
                          color: u.days_past_expiry > 0 ? 'var(--negative)' : 'var(--text-primary)',
                          fontWeight: 500,
                        }}>
                          {formatDate(u.subscription_expiry_at)}
                          {u.days_past_expiry > 0 && ` (${u.days_past_expiry}d ago)`}
                        </span>
                      </div>
                    )}

                    {/* Carry fee info */}
                    {(u.carry_fee_eligible || u.carry_fee_accrued > 0) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Carry Fee</span>
                        <span style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: u.carry_fee_eligible ? 'var(--warning)' : 'var(--text-secondary)',
                        }}>
                          {'\u20B9'}{u.carry_fee_accrued.toLocaleString('en-IN')} {u.carry_fee_eligible ? '(accruing)' : '(stopped)'}
                        </span>
                      </div>
                    )}

                    {/* Collected date */}
                    {u.collected_at && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Collected</span>
                        <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{formatDate(u.collected_at)}</span>
                      </div>
                    )}

                    {/* Returned date */}
                    {u.returned_at && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Returned</span>
                        <span style={{ fontSize: 12, color: 'var(--positive)' }}>{formatDate(u.returned_at)}</span>
                      </div>
                    )}

                    {/* Lost date */}
                    {u.lost_declared_at && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lost Declared</span>
                        <span style={{ fontSize: 12, color: 'var(--negative)', fontWeight: 600 }}>{formatDate(u.lost_declared_at)}</span>
                      </div>
                    )}

                    {/* View full detail button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedUnit(u); setStep('unit_detail'); }}
                      style={{
                        marginTop: 8,
                        padding: '8px 14px',
                        background: 'transparent',
                        color: 'var(--brand-primary)',
                        border: '1px solid var(--brand-primary)',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      View Full Detail
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ================================================================== */}
        {/* 5. DEPOSIT TRANSACTIONS                                            */}
        {/* ================================================================== */}

        <div style={sectionTitle}>Deposit Transactions</div>

        {transactions.length === 0 ? (
          <div style={{ ...cardStyle, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            No deposit transactions
          </div>
        ) : (
          transactions.map((txn) => {
            const badge = getDepositTxnBadge(txn.type);
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
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: badge.color,
                      background: badge.bg,
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}>
                      {badge.label}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {txn.netbox_id}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {txn.description}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {formatDate(txn.date)}
                  </div>
                </div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: isPositive ? 'var(--positive)' : 'var(--negative)',
                  whiteSpace: 'nowrap',
                  marginLeft: 12,
                }}>
                  {isPositive ? '+' : ''}{'\u20B9'}{Math.abs(txn.amount).toLocaleString('en-IN')}
                </div>
              </div>
            );
          })
        )}

        {/* ================================================================== */}
        {/* 6. ACTIVE NETBOX TASKS                                             */}
        {/* ================================================================== */}

        <div style={{
          ...sectionTitle,
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
        }}>
          Active NetBox Tasks
        </div>

        {Object.keys(netboxTaskGroups).length === 0 ? (
          <div style={{ ...cardStyle, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            No active NetBox tasks
          </div>
        ) : (
          Object.entries(netboxTaskGroups).map(([state, tasks]) => (
            <div key={state} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: getTaskStateColor(state),
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: getTaskStateColor(state),
                  display: 'inline-block',
                  flexShrink: 0,
                }} />
                {state.replace(/_/g, ' ')} ({tasks.length})
              </div>
              {tasks.map((task: Task) => (
                <div
                  key={task.task_id}
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    marginBottom: 6,
                    borderLeft: `3px solid ${getTaskStateColor(state)}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{task.task_id}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{task.netbox_id}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {task.customer_area}{task.assigned_to ? ` -- ${task.assigned_to}` : ''}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}

        {/* ================================================================== */}
        {/* 7. NETBOX ORDERS                                                   */}
        {/* ================================================================== */}

        <div style={{
          ...sectionTitle,
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
        }}>
          NetBox Orders ({orders.length})
        </div>

        {orders.length === 0 ? (
          <div style={{ ...cardStyle, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            No orders yet
          </div>
        ) : (
          orders.map((o) => {
            const statusColor = getOrderStatusColor(o.status);
            return (
              <div
                key={o.id}
                onClick={() => { setSelectedOrder(o); setStep('order_detail'); }}
                style={{
                  ...cardStyle,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderLeft: `4px solid ${statusColor}`,
                  cursor: 'pointer',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {o.id}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: statusColor,
                      background: getOrderStatusBg(o.status),
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}>
                      {o.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {o.quantity} unit{o.quantity > 1 ? 's' : ''} &middot; {o.delivery_area} &middot; {formatDate(o.created_at)}
                  </div>
                </div>
                <span style={{ fontSize: 16, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>
                  &#8250;
                </span>
              </div>
            );
          })
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
