import { NextResponse } from 'next/server';
import { getAssuranceState, updateAssuranceState } from '@/lib/data';

export async function GET() {
  return NextResponse.json(getAssuranceState());
}

export async function POST(request: Request) {
  const { increment_cycle_earned, increment_next_settlement, ...updates } = await request.json();
  // Handle increments before applying direct updates
  if (increment_cycle_earned) {
    const current = getAssuranceState();
    updates.cycle_earned = current.cycle_earned + increment_cycle_earned;
  }
  if (increment_next_settlement) {
    const current = getAssuranceState();
    updates.next_settlement_amount = current.next_settlement_amount + increment_next_settlement;
  }
  updateAssuranceState(updates);
  return NextResponse.json({ ok: true, state: getAssuranceState() });
}
