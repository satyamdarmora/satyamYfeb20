import { NextRequest, NextResponse } from 'next/server';
import { backendGet, backendPost, transformSupportCase } from '@/lib/backend';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  try {
    const data = await backendGet('/v1/support', auth);
    const cases = (data.cases || data || []).map(transformSupportCase);
    return NextResponse.json(cases);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const body = await req.json();

  try {
    const created = await backendPost('/v1/support', {
      subject: body.subject,
      description: body.description,
      linkedTaskId: body.linked_task_id
        ? parseInt(body.linked_task_id.replace('TSK-', ''))
        : undefined,
    }, auth);
    return NextResponse.json({ ok: true, case: transformSupportCase(created) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
