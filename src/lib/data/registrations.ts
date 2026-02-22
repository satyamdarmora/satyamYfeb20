// ---------------------------------------------------------------------------
// Partner Registrations -- in-memory store & helpers
// ---------------------------------------------------------------------------

export interface PartnerRegistration {
  id: string;
  mobile: string;
  businessName: string;
  entityType: string;
  state: string;
  city: string;
  area: string;
  pincode: string;
  aadhaarNumber: string;
  panNumber: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankName: string;
  termsAccepted: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

const registrations: PartnerRegistration[] = [];

export function getRegistrations(): PartnerRegistration[] {
  return registrations;
}

export function addRegistration(r: PartnerRegistration): void {
  registrations.push(r);
}

export function updateRegistration(id: string, updates: Partial<PartnerRegistration>): void {
  const reg = registrations.find((r) => r.id === id);
  if (reg) Object.assign(reg, updates);
}

export function getRegistrationById(id: string): PartnerRegistration | undefined {
  return registrations.find((r) => r.id === id);
}
