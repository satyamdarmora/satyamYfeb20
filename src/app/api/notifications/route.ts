import { NextRequest, NextResponse } from 'next/server';
import { backendGet, backendPost, transformNotification } from '@/lib/backend';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  try {
    const data = await backendGet('/v1/notifications/undismissed', auth);
    const notifications = (data || []).map(transformNotification);
    return NextResponse.json(notifications);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const body = await req.json();

  try {
    const created = await backendPost('/v1/notifications', {
      type: body.type,
      title: body.title,
      message: body.message,
      amount: body.amount,
      taskId: body.task_id ? parseInt(body.task_id.replace('TSK-', '')) : undefined,
    }, auth);
    return NextResponse.json({ ok: true, id: `NOTIF-${String(created.id).padStart(4, '0')}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
