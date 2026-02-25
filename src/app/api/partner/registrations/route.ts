import { NextRequest, NextResponse } from 'next/server';
import { backendGet, backendPost } from '@/lib/backend';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  try {
    const data = await backendGet('/v1/partner/registrations', auth);
    return NextResponse.json(data.registrations || data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const body = await req.json();
  const { id, action, rejectionReason } = body;

  if (!id || !action) {
    return NextResponse.json({ error: 'id and action required' }, { status: 400 });
  }

  try {
    const result = await backendPost(`/v1/partner/registrations/${id}/review`, {
      action,
      reviewReason: rejectionReason || action,
    }, auth);
    return NextResponse.json({ ok: true, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
