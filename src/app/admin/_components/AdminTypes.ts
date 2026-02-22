// ---------------------------------------------------------------------------
// Admin Module — Shared Types, Constants & Utility Functions
// ---------------------------------------------------------------------------

export const BACKEND_URL = '/api/backend';

export interface BackendRegistration {
  id: number;
  registrationId: string;
  mobile: string;
  businessName: string;
  entityType: string;
  state: string;
  city: string;
  area: string;
  pincode: string;
  panNumber: string;
  aadhaarNumber: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankName: string;
  status: 'PENDING' | 'INFO_REQUIRED' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  reviewReason?: string;
  adminNotes?: string;
  partnerResponse?: string;
  registrationFee: number;
  feePaid: boolean;
  feeRefunded: boolean;
  partner?: {
    id: number;
    status: 'TRAINING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRAINING_FAILED';
  };
  payments?: Array<{
    id: number;
    transactionId: string | null;
    amount: number;
    status: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED';
    paymentLink: string | null;
    createdAt: string;
  }>;
}

export const AREAS = [
  'Andheri West',
  'Bandra East',
  'Powai',
  'Malad West',
  'Goregaon East',
  'Borivali West',
];

export const MANUAL_REASONS = [
  'Customer escalation',
  'Repeated outage in area',
  'VIP customer request',
  'Regulatory compliance',
  'Preventive maintenance',
  'Hardware replacement',
  'Network upgrade',
];

export function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStateColor(state: string): string {
  const active = ['IN_PROGRESS', 'ASSIGNED', 'SCHEDULED', 'ACCEPTED', 'CLAIMED'];
  const alert = ['ALERTED', 'OFFERED', 'PICKUP_REQUIRED'];
  const done = ['RESOLVED', 'VERIFIED', 'ACTIVATION_VERIFIED', 'RETURN_CONFIRMED', 'INSTALLED'];
  const fail = ['FAILED', 'UNRESOLVED', 'LOST_DECLARED'];

  if (active.includes(state)) return 'var(--brand-primary)';
  if (alert.includes(state)) return 'var(--warning)';
  if (done.includes(state)) return 'var(--positive)';
  if (fail.includes(state)) return 'var(--negative)';
  return 'var(--text-secondary)';
}

export function getTypeColor(taskType: string): string {
  switch (taskType) {
    case 'INSTALL': return 'var(--brand-primary)';
    case 'RESTORE': return 'var(--accent-restore)';
    case 'NETBOX': return 'var(--accent-gold)';
    default: return 'var(--text-secondary)';
  }
}
