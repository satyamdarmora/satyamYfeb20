'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Task, DepositLedger, NetBoxUnit, DepositTransaction } from '@/lib/types';

interface NetBoxHubProps {
  onBack: () => void;
}

type FlowStep = 'hub' | 'create_order' | 'order_detail' | 'deposit_ledger';

interface NetBoxOrder {
  id: string;
  quantity: number;
  delivery_area: string;
  status: 'ORDERED' | 'DISPATCHED' | 'DELIVERED';
  created_at: string;
}

const AREAS = [
  'Andheri West',
  'Bandra East',
  'Powai',
  'Malad West',
  'Goregaon East',
  'Borivali West',
  'Jogeshwari West',
  'Kandivali West',
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStateColor(state: string): string {
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

export default function NetBoxHub({ onBack }: NetBoxHubProps) {
  const [step, setStep] = useState<FlowStep>('hub');
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
  const [quantity, setQuantity] = useState('');
  const [deliveryArea, setDeliveryArea] = useState(AREAS[0]);

  // Deposit ledger state
  const [deposit, setDeposit] = useState<{ ledger: DepositLedger; units: NetBoxUnit[] } | null>(null);

  // Fetch NETBOX tasks and deposit data from API
  const [allNetboxTasks, setAllNetboxTasks] = useState<Task[]>([]);
  useEffect(() => {
    const fetchNetbox = async () => {
      try {
        const res = await fetch('/api/tasks');
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllNetboxTasks(data.filter((t: Task) => t.task_type === 'NETBOX'));
        }
      } catch {}
    };
    const fetchDeposit = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('wiom_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/deposit', { headers });
        const data = await res.json();
        if (data && data.ledger) setDeposit(data);
      } catch {}
    };
    fetchNetbox();
    fetchDeposit();
  }, []);

  // Group by state
  const netboxTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    allNetboxTasks.forEach((t: Task) => {
      if (!groups[t.state]) groups[t.state] = [];
      groups[t.state].push(t);
    });
    return groups;
  }, [allNetboxTasks]);

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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const backBtn = (target: FlowStep = 'hub') => (
    <button
      onClick={() => setStep(target)}
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

  // Hub
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>NetBox Management</div>
            <button
              onClick={() => { setStep('create_order'); setQuantity(''); setDeliveryArea(AREAS[0]); }}
              style={{
                padding: '8px 16px',
                background: 'var(--brand-primary)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Request NetBox
            </button>
          </div>
        </div>

        <div style={scrollStyle}>
          {/* Active NETBOX Tasks by State */}
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            Active Tasks
          </div>

          {Object.keys(netboxTasks).length === 0 && (
            <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              No active NetBox tasks
            </div>
          )}

          {Object.entries(netboxTasks).map(([state, tasks]) => (
            <div key={state} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: getStateColor(state),
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: getStateColor(state),
                  display: 'inline-block',
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
                    borderLeft: `3px solid ${getStateColor(state)}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{task.task_id}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{task.netbox_id}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {task.customer_area} {task.assigned_to ? `-- ${task.assigned_to}` : ''}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Deposit Ledger Card */}
          <button
            onClick={() => setStep('deposit_ledger')}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, var(--card-gradient-start), var(--card-gradient-end))',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: '16px 20px',
              marginTop: 20,
              marginBottom: 8,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Security Deposit Ledger</div>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{'\u203A'}</span>
            </div>
            {deposit?.ledger ? (
              <div style={{ display: 'flex', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--positive)' }}>{'\u20B9'}{deposit.ledger.deposit_balance.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Balance</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{deposit.ledger.total_active}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active units</div>
                </div>
                {deposit.ledger.total_loss_deductions > 0 && (
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--negative)' }}>-{'\u20B9'}{deposit.ledger.total_loss_deductions.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Deductions</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tap to view deposit details</div>
            )}
          </button>

          {/* Orders */}
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginTop: 24,
            marginBottom: 12,
            paddingTop: 16,
            borderTop: '1px solid var(--border-subtle)',
          }}>
            NetBox Orders
          </div>

          {orders.map((order) => {
            const statusColor = order.status === 'DELIVERED' ? 'var(--positive)' : order.status === 'DISPATCHED' ? 'var(--brand-primary)' : 'var(--warning)';
            return (
              <button
                key={order.id}
                onClick={() => { setSelectedOrder(order); setStep('order_detail'); }}
                style={{
                  width: '100%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  marginBottom: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{order.id}</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: statusColor,
                    background: `${statusColor}1A`,
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}>
                    {order.status}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Qty: {order.quantity} &middot; {order.delivery_area} &middot; {formatDate(order.created_at)}
                </div>
              </button>
            );
          })}

          <div style={{ height: 40 }} />
        </div>
      </div>
    );
  }

  // Create order
  if (step === 'create_order') {
    const canSubmit = Number(quantity) > 0;
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          {backBtn('hub')}
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Request New NetBox</div>
        </div>
        <div style={scrollStyle}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Number of NetBox units"
              min="1"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Delivery Area</label>
            <select
              value={deliveryArea}
              onChange={(e) => setDeliveryArea(e.target.value)}
              style={inputStyle}
            >
              {AREAS.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              if (canSubmit) {
                const newOrder: NetBoxOrder = {
                  id: `ORD-${Date.now().toString().slice(-4)}`,
                  quantity: Number(quantity),
                  delivery_area: deliveryArea,
                  status: 'ORDERED',
                  created_at: new Date().toISOString(),
                };
                setOrders([...orders, newOrder]);
                setSelectedOrder(newOrder);
                setStep('order_detail');
              }
            }}
            style={{ ...btnPrimary, opacity: canSubmit ? 1 : 0.4 }}
          >
            Submit Order
          </button>
        </div>
      </div>
    );
  }

  // Order detail
  if (step === 'order_detail' && selectedOrder) {
    const statusColor = selectedOrder.status === 'DELIVERED' ? 'var(--positive)' : selectedOrder.status === 'DISPATCHED' ? 'var(--brand-primary)' : 'var(--warning)';

    const timelineSteps = [
      { label: 'Order Placed', done: true, date: selectedOrder.created_at },
      { label: 'Processing', done: selectedOrder.status !== 'ORDERED', date: selectedOrder.status !== 'ORDERED' ? selectedOrder.created_at : undefined },
      { label: 'Dispatched', done: selectedOrder.status === 'DISPATCHED' || selectedOrder.status === 'DELIVERED', date: selectedOrder.status === 'DISPATCHED' || selectedOrder.status === 'DELIVERED' ? selectedOrder.created_at : undefined },
      { label: 'Delivered', done: selectedOrder.status === 'DELIVERED', date: selectedOrder.status === 'DELIVERED' ? selectedOrder.created_at : undefined },
    ];

    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          {backBtn('hub')}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedOrder.id}</div>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: statusColor,
              background: `${statusColor}1A`,
              padding: '4px 10px',
              borderRadius: 4,
            }}>
              {selectedOrder.status}
            </span>
          </div>
        </div>

        <div style={scrollStyle}>
          {/* Order info */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            padding: '20px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Quantity</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{selectedOrder.quantity} units</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Delivery Area</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{selectedOrder.delivery_area}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Ordered On</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{formatDate(selectedOrder.created_at)}</span>
            </div>
          </div>

          {/* Status Timeline */}
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
            Status Timeline
          </div>

          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div style={{
              position: 'absolute',
              left: 7,
              top: 4,
              bottom: 4,
              width: 2,
              background: 'var(--bg-secondary)',
            }} />

            {timelineSteps.map((ts, i) => (
              <div key={i} style={{ position: 'relative', paddingBottom: i < timelineSteps.length - 1 ? 24 : 0 }}>
                <div style={{
                  position: 'absolute',
                  left: -20,
                  top: 2,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: ts.done ? 'var(--brand-primary)' : 'var(--bg-secondary)',
                  border: '2px solid var(--bg-primary)',
                }} />
                <div style={{ fontSize: 14, fontWeight: ts.done ? 600 : 400, color: ts.done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {ts.label}
                </div>
                {ts.done && ts.date && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {formatDate(ts.date)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Deposit Ledger Detail
  if (step === 'deposit_ledger') {
    const ledger = deposit?.ledger;
    const units = ledger?.units || [];
    const txns = ledger?.transactions || [];

    const unitStatusColor = (s: string) =>
      s === 'WITH_CUSTOMER' ? 'var(--positive)' :
      s === 'EXPIRED_WITH_CUSTOMER' ? 'var(--warning)' :
      s === 'COLLECTED_IN_TRANSIT' ? 'var(--brand-primary)' :
      s === 'IN_WAREHOUSE' ? 'var(--text-secondary)' :
      s === 'LOST' ? 'var(--negative)' :
      s === 'DAMAGED' ? 'var(--negative)' : 'var(--text-muted)';

    const txnTypeLabel = (t: string) =>
      t === 'DEPOSIT_COLLECTED' ? 'Deposit Collected' :
      t === 'LOSS_DEDUCTION' ? 'Loss Deduction' :
      t === 'DAMAGE_DEDUCTION' ? 'Damage Deduction' :
      t === 'DEPOSIT_REFUND' ? 'Refund' : t;

    const txnColor = (t: string) =>
      t === 'DEPOSIT_COLLECTED' ? 'var(--positive)' :
      t.includes('DEDUCTION') ? 'var(--negative)' :
      t === 'DEPOSIT_REFUND' ? 'var(--brand-primary)' : 'var(--text-primary)';

    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          <button
            onClick={() => setStep('hub')}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer', padding: '4px 0', marginBottom: 12, fontWeight: 500 }}
          >
            &larr; Back
          </button>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Security Deposit Ledger</div>
        </div>

        <div style={scrollStyle}>
          {/* Summary Card */}
          <div style={{
            background: 'linear-gradient(135deg, var(--card-gradient-start), var(--card-gradient-end))',
            borderRadius: 14, padding: '20px', marginBottom: 16,
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--positive)' }}>{'\u20B9'}{(ledger?.deposit_balance || 0).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Deposit Balance</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{'\u20B9'}{(ledger?.exit_refund_estimate || 0).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Exit Refund Est.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
              <div><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ledger?.total_issued || 0}</span> <span style={{ color: 'var(--text-muted)' }}>Issued</span></div>
              <div><span style={{ fontWeight: 700, color: 'var(--positive)' }}>{ledger?.total_active || 0}</span> <span style={{ color: 'var(--text-muted)' }}>Active</span></div>
              <div><span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{ledger?.total_returned || 0}</span> <span style={{ color: 'var(--text-muted)' }}>Returned</span></div>
              <div><span style={{ fontWeight: 700, color: 'var(--negative)' }}>{ledger?.total_lost || 0}</span> <span style={{ color: 'var(--text-muted)' }}>Lost</span></div>
            </div>
            {(ledger?.total_loss_deductions || 0) > 0 && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(220,38,38,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--negative)', fontWeight: 500 }}>
                Total deductions: {'\u20B9'}{(ledger?.total_loss_deductions || 0).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          {/* Rate Info */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{'\u20B9'}{ledger?.security_deposit_per_unit || 1500}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Deposit / Unit</div>
            </div>
            <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{'\u20B9'}{ledger?.carry_fee_per_day || 0}/day</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Carry Fee</div>
            </div>
            <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{ledger?.carry_fee_grace_days || 0}d</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Grace Period</div>
            </div>
          </div>

          {/* Units */}
          {units.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                Units ({units.length})
              </div>
              {units.map((u) => (
                <div key={u.netbox_id} style={{
                  background: 'var(--bg-card)', borderRadius: 10, padding: '12px 14px', marginBottom: 8,
                  borderLeft: `3px solid ${unitStatusColor(u.status)}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{u.netbox_id}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: unitStatusColor(u.status), background: `${unitStatusColor(u.status)}1A`, padding: '2px 8px', borderRadius: 4 }}>
                      {u.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                    {u.connection_id && <>{u.connection_id} &middot; </>}{u.customer_area || 'N/A'}
                  </div>
                  {/* Carry fee info */}
                  {u.carry_fee_eligible && (
                    <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(255,128,0,0.08)', borderRadius: 6, fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--warning)', fontWeight: 500 }}>
                        Carry fee accruing &middot; {u.days_past_expiry}d past expiry
                      </span>
                      <span style={{ color: 'var(--negative)', fontWeight: 700 }}>
                        {'\u20B9'}{u.carry_fee_accrued.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {u.status === 'LOST' && u.lost_declared_at && (
                    <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(220,38,38,0.08)', borderRadius: 6, fontSize: 11, color: 'var(--negative)', fontWeight: 500 }}>
                      Lost on {formatDate(u.lost_declared_at)} &middot; {'\u20B9'}{ledger?.replacement_cost || 1500} deducted
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Transactions */}
          {txns.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 10 }}>
                Transactions ({txns.length})
              </div>
              {txns.map((t) => (
                <div key={t.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 8, marginBottom: 6,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{txnTypeLabel(t.type)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t.netbox_id} &middot; {formatDate(t.date)}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: txnColor(t.type) }}>
                    {t.amount >= 0 ? '+' : ''}{'\u20B9'}{Math.abs(t.amount).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Empty state */}
          {units.length === 0 && txns.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              No deposit data yet. Deposits are collected when NetBox units are issued.
            </div>
          )}

          <div style={{ height: 40 }} />
        </div>
      </div>
    );
  }

  return null;
}
