'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Task } from '@/lib/types';

interface NetBoxHubProps {
  onBack: () => void;
}

type FlowStep = 'hub' | 'create_order' | 'order_detail';

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

  // Fetch NETBOX tasks from API
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
    fetchNetbox();
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

  return null;
}
