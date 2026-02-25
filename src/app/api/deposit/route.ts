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
    // Backend may not have deposit endpoint yet — return empty state
    return NextResponse.json({
      ledger: {
        deposit_balance: 0,
        total_active: 0,
        security_deposit_per_unit: 0,
        exit_refund_estimate: 0,
        total_loss_deductions: 0,
        transactions: [],
        units: [],
      },
      units: [],
      rate_card: null,
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
