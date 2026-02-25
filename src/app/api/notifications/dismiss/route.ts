import { NextRequest, NextResponse } from 'next/server';
import { backendPut } from '@/lib/backend';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const { id } = await req.json();

  try {
    const numericId = parseInt(id.replace('NOTIF-', ''));
    await backendPut(`/v1/notifications/${numericId}/dismiss`, {}, auth);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
