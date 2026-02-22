// ---------------------------------------------------------------------------
// Support cases -- seed data & helpers
// ---------------------------------------------------------------------------

import type { SupportCase } from '../types';
import { iso, DAY } from './helpers';

// ---- Support cases seed data ------------------------------------------------

const supportCases: SupportCase[] = [
  {
    case_id: 'SUP-001',
    subject: 'Settlement amount mismatch for January 2026',
    status: 'OPEN',
    created_at: iso(-3 * DAY),
    updated_at: iso(-1 * DAY),
    messages: [
      {
        sender: 'CSP-MH-1001',
        text: 'My January settlement shows 13,800 but I expected 14,300 based on 43 active connections.',
        timestamp: iso(-3 * DAY),
      },
      {
        sender: 'Wiom Support',
        text: 'We are reviewing the discrepancy. One connection (WM-CON-2100) churned mid-cycle which adjusted the amount.',
        timestamp: iso(-1 * DAY),
      },
    ],
  },
  {
    case_id: 'SUP-002',
    subject: 'Netbox NB-MH-0455 return confirmation delayed',
    status: 'IN_PROGRESS',
    created_at: iso(-5 * DAY),
    updated_at: iso(-2 * DAY),
    linked_task_id: 'TSK-4006',
    messages: [
      {
        sender: 'CSP-MH-1001',
        text: 'Netbox was returned to warehouse 3 days ago but status still shows COLLECTED.',
        timestamp: iso(-5 * DAY),
      },
      {
        sender: 'Wiom Support',
        text: 'We have escalated to the warehouse team. Expect status update within 24 hours.',
        timestamp: iso(-3 * DAY),
      },
      {
        sender: 'Wiom Support',
        text: 'Warehouse confirmed receipt. Updating status shortly.',
        timestamp: iso(-2 * DAY),
      },
    ],
  },
  {
    case_id: 'SUP-003',
    subject: 'Technician band upgrade request for Suresh Kamble',
    status: 'RESOLVED',
    created_at: iso(-14 * DAY),
    updated_at: iso(-7 * DAY),
    messages: [
      {
        sender: 'CSP-MH-1001',
        text: 'Requesting band upgrade from B to A for Suresh Kamble based on performance.',
        timestamp: iso(-14 * DAY),
      },
      {
        sender: 'Wiom Support',
        text: 'Band upgrade approved. Effective next cycle.',
        timestamp: iso(-7 * DAY),
      },
    ],
  },
];

// ---- Helpers ----------------------------------------------------------------

export function getSupportCases(): SupportCase[] {
  return supportCases;
}

export function addSupportCase(c: SupportCase): void {
  supportCases.push(c);
}
