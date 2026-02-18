import { NextResponse } from 'next/server';
import { dismissNotificationServer } from '@/lib/notification-store';

export async function POST(request: Request) {
  const { id } = await request.json();
  dismissNotificationServer(id);
  return NextResponse.json({ ok: true });
}
