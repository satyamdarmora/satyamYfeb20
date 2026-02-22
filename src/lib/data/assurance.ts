// ---------------------------------------------------------------------------
// Assurance -- seed data & helpers
// ---------------------------------------------------------------------------

import type { AssuranceState } from '../types';
import { iso, DAY } from './helpers';

// ---- Assurance state --------------------------------------------------------

const assuranceState: AssuranceState = {
  active_base: 42,
  cycle_earned: 12450,
  next_settlement_amount: 14200,
  next_settlement_date: '2026-02-28',
  sla_standing: 'Compliant',
  exposure_state: 'ELIGIBLE',
  exposure_reason: 'All SLA metrics within threshold for the current cycle.',
  exposure_since: '2025-11-01',
  active_restores: 2,
  unresolved_count: 0,
  capability_reset_active: false,
  active_base_events: [
    { date: iso(-2 * DAY),  change: 1,  connection_id: 'WM-CON-3201', reason: 'New activation verified' },
    { date: iso(-5 * DAY),  change: 1,  connection_id: 'WM-CON-3180', reason: 'New activation verified' },
    { date: iso(-7 * DAY),  change: -1, connection_id: 'WM-CON-2100', reason: 'Customer churn' },
    { date: iso(-10 * DAY), change: 1,  connection_id: 'WM-CON-3150', reason: 'New activation verified' },
    { date: iso(-14 * DAY), change: 1,  connection_id: 'WM-CON-3120', reason: 'New activation verified' },
  ],
  earnings_events: [
    { date: '2026-01-31', amount: 13800, type: 'SETTLEMENT',       reference: 'SETT-2026-01' },
    { date: '2026-01-15', amount: 500,   type: 'BONUS_ACTIVATION', reference: 'BONUS-ACT-0042' },
    { date: '2025-12-31', amount: 12200, type: 'SETTLEMENT',       reference: 'SETT-2025-12' },
    { date: '2025-12-10', amount: 750,   type: 'BONUS_RESTORE',    reference: 'BONUS-RST-0038' },
  ],
};

// ---- Helpers ----------------------------------------------------------------

export function getAssuranceState(): AssuranceState {
  return assuranceState;
}

export function updateAssuranceState(updates: Partial<AssuranceState>): void {
  Object.assign(assuranceState, updates);
}
