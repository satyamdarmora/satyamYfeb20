import { NextResponse } from 'next/server';
import { getWalletState, updateWalletState, addWalletTransaction } from '@/lib/data';

export async function GET() {
  return NextResponse.json(getWalletState());
}

export async function POST(request: Request) {
  const body = await request.json();
  const { new_transaction, ...updates } = body;
  if (Object.keys(updates).length > 0) {
    updateWalletState(updates);
  }
  if (new_transaction) {
    addWalletTransaction(new_transaction);
  }
  return NextResponse.json({ ok: true, state: getWalletState() });
}
