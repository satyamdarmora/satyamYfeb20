import { NextRequest, NextResponse } from 'next/server';
import { backendGet, backendPost, backendPut, transformAssurance } from '@/lib/backend';

// Map display names to Prisma enum values
const STANDING_MAP: Record<string, string> = {
  'Compliant': 'COMPLIANT',
  'At Risk': 'AT_RISK',
  'Non-Compliant': 'NON_COMPLIANT',
};

const DEFAULT_ASSURANCE = {
  active_base: 0,
  cycle_earned: 0,
  next_settlement_amount: 0,
  next_settlement_date: undefined,
  sla_standing: 'Compliant',
  exposure_state: 'NORMAL',
  exposure_reason: '',
  exposure_since: '',
  active_base_events: [],
  earnings_events: [],
  active_restores: 0,
  unresolved_count: 0,
  capability_reset_active: false,
  capability_reset_reason: undefined,
};

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  try {
    const data = await backendGet('/v1/assurance', auth);
    return NextResponse.json(transformAssurance(data));
  } catch {
    // Return safe defaults so dashboard renders without crashing
    return NextResponse.json(DEFAULT_ASSURANCE);
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const body = await req.json();

  try {
    // Handle SLA standing update
    if (body.sla_standing !== undefined || body.capability_reset_active !== undefined) {
      const standingPayload: Record<string, any> = {};
      if (body.sla_standing) {
        standingPayload.standing = STANDING_MAP[body.sla_standing] || body.sla_standing;
      }
      if (body.capability_reset_active !== undefined) {
        standingPayload.capabilityResetActive = body.capability_reset_active;
      }
      if (body.capability_reset_reason !== undefined) {
        standingPayload.capabilityResetReason = body.capability_reset_reason;
      }
      // standing is required by the endpoint; default to current if not provided
      if (!standingPayload.standing) {
        const current = await backendGet('/v1/assurance', auth);
        standingPayload.standing = current.slaStanding || 'COMPLIANT';
      }
      await backendPut('/v1/assurance/standing', standingPayload, auth);
    }

    // Handle base change events
    if (body.new_base_event) {
      const e = body.new_base_event;
      await backendPost('/v1/assurance/base-change', {
        change: e.change,
        connectionId: e.connection_id,
        reason: e.reason,
      }, auth);
    }

    // Handle earning events
    if (body.new_earning_event) {
      const e = body.new_earning_event;
      await backendPost('/v1/assurance/earning', {
        amount: e.amount,
        earningType: e.type,
        reference: e.reference,
      }, auth);
    }

    // Handle increment_cycle_earned (shorthand for earning)
    if (body.increment_cycle_earned) {
      await backendPost('/v1/assurance/earning', {
        amount: body.increment_cycle_earned,
        earningType: 'INSTALL_EARNING',
        reference: `cycle-increment-${Date.now()}`,
      }, auth);
    }

    // Return updated state
    const data = await backendGet('/v1/assurance', auth);
    return NextResponse.json({ ok: true, state: transformAssurance(data) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
