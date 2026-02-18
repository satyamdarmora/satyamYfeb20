import { NextResponse } from 'next/server';
import { getUndismissedNotifications, addNotificationServer } from '@/lib/notification-store';

export async function GET() {
  return NextResponse.json(getUndismissedNotifications());
}

export async function POST(request: Request) {
  const body = await request.json();
  addNotificationServer({ ...body, dismissed: false });
  return NextResponse.json({ ok: true, id: body.id });
}
