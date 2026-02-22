// ---------------------------------------------------------------------------
// Shared date helpers used across seed data modules
// ---------------------------------------------------------------------------

export function iso(offsetMs: number = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

export const MIN = 60 * 1000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;
