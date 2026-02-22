// Registration now goes to NestJS backend (MySQL persistence)
const REGISTER_URL = '/api/backend/v1/partner/register';

export interface RegisterPartnerData {
  businessName: string;
  entityType: 'INDIVIDUAL' | 'FIRM' | 'COMPANY';
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
}

export interface RegisterResult {
  registrationId: number;
  businessName: string;
  registrationFee: number;
  feePaid: boolean;
  status: string;
}

interface ApiResponse {
  status: number;
  msg?: string;
  data?: Record<string, unknown>;
}

export async function registerPartner(
  data: RegisterPartnerData,
  token: string
): Promise<RegisterResult> {
  const res = await fetch(REGISTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || `Registration failed (${res.status}). Please try again.`);
  }

  const json: ApiResponse = await res.json();

  if (json.status !== 0) {
    throw new Error(json.msg || 'Registration failed. Please try again.');
  }

  const d = json.data || {};
  return {
    registrationId: d.registrationId as number,
    businessName: (d.businessName as string) || data.businessName,
    registrationFee: (d.registrationFee as number) || 2000,
    feePaid: (d.feePaid as boolean) || false,
    status: (d.status as string) || 'PENDING',
  };
}

export function checkProfileComplete(user: Record<string, unknown>): boolean {
  return user?.isProfileComplete === true;
}

// Validation helpers
export function isValidAadhaar(value: string): boolean {
  return /^\d{12}$/.test(value);
}

export function isValidPan(value: string): boolean {
  return /^[A-Z]{5}\d{4}[A-Z]$/.test(value.toUpperCase());
}

export function isValidIfsc(value: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.toUpperCase());
}

export function isValidPincode(value: string): boolean {
  return /^\d{6}$/.test(value);
}

export function isValidAccountNumber(value: string): boolean {
  return /^\d{9,18}$/.test(value);
}
