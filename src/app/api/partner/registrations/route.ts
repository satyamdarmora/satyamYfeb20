import { NextResponse } from 'next/server';
import { getRegistrations, updateRegistration } from '@/lib/data';

export async function GET() {
  return NextResponse.json(getRegistrations());
}

export async function POST(request: Request) {
  const body = await request.json();
  const { id, action, rejectionReason } = body;

  if (!id || !action) {
    return NextResponse.json(
      { error: 'id and action required' },
      { status: 400 }
    );
  }

  if (action === 'APPROVE') {
    updateRegistration(id, {
      status: 'APPROVED',
      reviewedAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, status: 'APPROVED' });
  }

  if (action === 'REJECT') {
    updateRegistration(id, {
      status: 'REJECTED',
      reviewedAt: new Date().toISOString(),
      rejectionReason: rejectionReason || 'Registration rejected.',
    });
    return NextResponse.json({ ok: true, status: 'REJECTED' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
