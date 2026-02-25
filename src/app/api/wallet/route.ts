import { NextRequest, NextResponse } from 'next/server';
import { backendGet, backendPost, backendPut, transformWallet } from '@/lib/backend';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  try {
    const data = await backendGet('/v1/wallet', auth);
    return NextResponse.json(transformWallet(data));
  } catch {
    return NextResponse.json({ balance: 0, pending_settlement: 0, frozen: false, transactions: [] });
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const body = await req.json();

  try {
    // Handle freeze/unfreeze
    if (body.frozen === true) {
      await backendPut('/v1/wallet/freeze', {
        reason: body.frozen_reason || 'Wallet frozen by admin.',
      }, auth);
    } else if (body.frozen === false) {
      await backendPut('/v1/wallet/unfreeze', {}, auth);
    }

    // Handle new transaction
    if (body.new_transaction) {
      const t = body.new_transaction;
      await backendPost('/v1/wallet/transaction', {
        type: t.type,
        amount: t.amount,
        description: t.description,
        status: t.status,
      }, auth);
    }

    // Return updated state
    const data = await backendGet('/v1/wallet', auth);
    return NextResponse.json({ ok: true, state: transformWallet(data) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
