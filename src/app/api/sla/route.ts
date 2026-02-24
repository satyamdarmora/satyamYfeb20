import { NextResponse } from 'next/server';
import { getSLAState, updateSLAMetric } from '@/lib/data';

export async function GET() {
  return NextResponse.json(getSLAState());
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, domain_id, metric_id, value } = body;

  if (action === 'update_metric' && domain_id && metric_id && value !== undefined) {
    updateSLAMetric(domain_id, metric_id, value);
    return NextResponse.json({ ok: true, state: getSLAState() });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
