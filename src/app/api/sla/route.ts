import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { backendGet, backendPut } from '@/lib/backend';

export async function GET() {
  try {
    const h = await headers();
    const auth = h.get('authorization');
    const data = await backendGet('/v1/sla', auth);
    return NextResponse.json(data);
  } catch {
    // Backend may not have SLA endpoint yet — return empty state
    return NextResponse.json({
      overall_standing: 'Compliant',
      domains: [],
      last_updated: new Date().toISOString(),
      evaluation_window_days: 30,
      next_evaluation: new Date(Date.now() + 30 * 86400000).toISOString(),
      consequence: {
        routing: 'Full',
        bonus_eligibility: 'Eligible',
      },
      hysteresis: {
        required_clean_windows: 0,
        current_clean_windows: 0,
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const h = await headers();
    const auth = h.get('authorization');
    const body = await request.json();
    const { action, domain_id, metric_id, value } = body;

    if (action === 'update_metric' && domain_id && metric_id && value !== undefined) {
      const data = await backendPut(`/v1/sla/domain/${domain_id}/metric/${metric_id}`, { value }, auth);
      return NextResponse.json({ ok: true, state: data });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Backend error' }, { status: 500 });
  }
}
