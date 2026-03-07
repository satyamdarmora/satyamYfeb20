import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { backendGet, backendPost } from '@/lib/backend';

export async function GET() {
  try {
    const h = await headers();
    const auth = h.get('authorization');
    const data = await backendGet('/v1/deposit', auth);
    return NextResponse.json(data);
  } catch {
    // Backend may not have deposit endpoint yet — return seed data
    const now = Date.now();
    const day = 86400000;

    // Seed data aligned with CSP OS Rate Card v1.0 (Feb 14):
    // §3.1: Security deposit = asset risk coverage only, not SLA/performance linked
    // §4:   Replacement cost = ₹1500. Loss → deduct from deposit, overflow → wallet
    // §5:   Carry fee = ₹2/day/NetBox, after 15 days post-expiry, from wallet NOT deposit
    // Deposit is pure asset accounting — no carry fee, no SLA, no bonus mixing

    const units = [
      {
        netbox_id: 'NB-1001', connection_id: 'CON-2201', customer_area: 'Andheri West',
        status: 'WITH_CUSTOMER', issued_at: new Date(now - 45 * day).toISOString(),
        subscription_expiry_at: new Date(now - 12 * day).toISOString(),
        carry_fee_eligible: false, carry_fee_accrued: 0, days_past_expiry: 12,
        // 12 days past expiry < 15 day grace → NOT yet eligible for carry fee
      },
      {
        netbox_id: 'NB-1002', connection_id: 'CON-2202', customer_area: 'Bandra East',
        status: 'WITH_CUSTOMER', issued_at: new Date(now - 30 * day).toISOString(),
        subscription_expiry_at: new Date(now + 15 * day).toISOString(),
        carry_fee_eligible: false, carry_fee_accrued: 0, days_past_expiry: 0,
      },
      {
        netbox_id: 'NB-1003', connection_id: 'CON-2203', customer_area: 'Powai',
        status: 'WITH_CUSTOMER', issued_at: new Date(now - 60 * day).toISOString(),
        subscription_expiry_at: new Date(now + 5 * day).toISOString(),
        carry_fee_eligible: false, carry_fee_accrued: 0, days_past_expiry: 0,
      },
      {
        netbox_id: 'NB-1004', connection_id: 'CON-2204', customer_area: 'Malad West',
        status: 'EXPIRED_WITH_CUSTOMER', issued_at: new Date(now - 90 * day).toISOString(),
        subscription_expiry_at: new Date(now - 20 * day).toISOString(),
        carry_fee_eligible: true, carry_fee_start_at: new Date(now - 5 * day).toISOString(),
        carry_fee_accrued: 10, days_past_expiry: 20,
        // 20 days past expiry − 15 day grace = 5 days × ₹2/day = ₹10
      },
      {
        netbox_id: 'NB-1005', connection_id: 'CON-2205', customer_area: 'Goregaon East',
        status: 'IN_WAREHOUSE', issued_at: new Date(now - 120 * day).toISOString(),
        returned_at: new Date(now - 10 * day).toISOString(),
        carry_fee_eligible: false, carry_fee_accrued: 0, days_past_expiry: 0,
      },
      {
        netbox_id: 'NB-1006', connection_id: 'CON-2206', customer_area: 'Borivali West',
        status: 'LOST', issued_at: new Date(now - 150 * day).toISOString(),
        lost_declared_at: new Date(now - 30 * day).toISOString(),
        carry_fee_eligible: false, carry_fee_accrued: 0, days_past_expiry: 0,
      },
    ];

    // Deposit ledger: pure asset accounting (doc §6)
    // Total collected: 1500 × 6 = 9000
    // Loss deduction: 1500 × 1 = 1500
    // Balance: 9000 - 1500 = 7500
    const transactions = [
      { id: 'DT-001', type: 'DEPOSIT_COLLECTED', amount: 1500, date: new Date(now - 150 * day).toISOString(), description: 'Security deposit collected for NB-1006', netbox_id: 'NB-1006' },
      { id: 'DT-002', type: 'DEPOSIT_COLLECTED', amount: 3000, date: new Date(now - 90 * day).toISOString(), description: 'Security deposit collected for NB-1004, NB-1005', netbox_id: 'NB-1004' },
      { id: 'DT-003', type: 'DEPOSIT_COLLECTED', amount: 4500, date: new Date(now - 60 * day).toISOString(), description: 'Security deposit collected for NB-1001, NB-1002, NB-1003', netbox_id: 'NB-1001' },
      { id: 'DT-004', type: 'LOSS_DEDUCTION', amount: -1500, date: new Date(now - 30 * day).toISOString(), description: 'Replacement cost deducted for lost NB-1006 (₹1500)', netbox_id: 'NB-1006' },
    ];

    return NextResponse.json({
      ledger: {
        deposit_balance: 7500,       // 9000 collected - 1500 loss
        total_issued: 6,
        total_returned: 1,
        total_lost: 1,
        total_active: 4,
        security_deposit_per_unit: 1500,
        total_loss_deductions: 1500,  // 1500 × 1 lost unit
        exit_refund_estimate: 7500,   // full balance if all remaining returned
        transactions,
        units,
      },
      units,
      rate_card: {
        carry_fee_per_day: 2,         // ₹2/day — operational friction, deducted from wallet NOT deposit
        carry_fee_grace_days: 15,       // §5: "after 15 days post-expiry"
        security_deposit_per_netbox: 1500,  // aligned with replacement cost (doc §7)
        replacement_cost: 1500,             // doc §2: "NetBox replacement cost = ₹1500"
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const h = await headers();
    const auth = h.get('authorization');
    const body = await request.json();
    const { action } = body;

    if (action === 'collect_deposit') {
      const data = await backendPost('/v1/deposit/collect', body, auth);
      return NextResponse.json({ ok: true, ledger: data });
    }

    if (action === 'declare_lost') {
      const data = await backendPost('/v1/deposit/declare-lost', body, auth);
      return NextResponse.json({ ok: true, ledger: data });
    }

    if (action === 'refund_deposit') {
      const data = await backendPost('/v1/deposit/refund', body, auth);
      return NextResponse.json({ ok: true, ledger: data });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Backend error' }, { status: 500 });
  }
}
