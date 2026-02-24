import { NextResponse } from 'next/server';
import {
  getDepositLedger,
  getNetBoxUnits,
  getNetBoxUnitById,
  updateNetBoxUnit,
  addDepositTransaction,
  getRateCard,
} from '@/lib/data';

export async function GET() {
  return NextResponse.json({
    ledger: getDepositLedger(),
    units: getNetBoxUnits(),
    rate_card: getRateCard(),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;

  if (action === 'collect_deposit') {
    const { amount, description } = body;
    const rc = getRateCard();
    addDepositTransaction({
      id: `DEP-COL-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'DEPOSIT_COLLECTED',
      amount: amount || rc.security_deposit_per_netbox,
      netbox_id: `ORD-${Date.now()}`,
      description: description || 'Deposit collected for new NetBox order',
    });
    return NextResponse.json({ ok: true, ledger: getDepositLedger() });
  }

  if (action === 'declare_lost') {
    const { netbox_id } = body;
    const unit = getNetBoxUnitById(netbox_id);
    if (!unit) {
      return NextResponse.json({ ok: false, error: 'Unit not found' }, { status: 404 });
    }
    const now = new Date().toISOString();
    updateNetBoxUnit(netbox_id, { status: 'LOST', lost_declared_at: now });
    const rc = getRateCard();
    addDepositTransaction({
      id: `DEP-LOSS-${Date.now()}`,
      date: now,
      type: 'LOSS_DEDUCTION',
      amount: -rc.replacement_cost,
      netbox_id,
      description: `Loss recovery -- ${netbox_id} declared lost`,
    });
    return NextResponse.json({ ok: true, ledger: getDepositLedger() });
  }

  if (action === 'refund_deposit') {
    const { netbox_id } = body;
    const unit = getNetBoxUnitById(netbox_id);
    if (!unit) {
      return NextResponse.json({ ok: false, error: 'Unit not found' }, { status: 404 });
    }
    const rc = getRateCard();
    addDepositTransaction({
      id: `DEP-REF-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'DEPOSIT_REFUND',
      amount: -rc.security_deposit_per_netbox,
      netbox_id,
      description: `Deposit refund -- ${netbox_id} returned`,
    });
    return NextResponse.json({ ok: true, ledger: getDepositLedger() });
  }

  return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
}
