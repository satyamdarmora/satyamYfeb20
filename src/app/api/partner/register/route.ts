import { NextResponse } from 'next/server';
import { addRegistration } from '@/lib/data';

/**
 * Mock partner registration endpoint.
 * Stores registration in-memory until the real backend is ready.
 */
export async function POST(request: Request) {
  const body = await request.json();

  const required = [
    'businessName', 'entityType', 'state', 'city', 'area', 'pincode',
    'aadhaarNumber', 'panNumber', 'bankAccountName', 'bankAccountNumber',
    'bankIfsc', 'bankName', 'termsAccepted',
  ];

  for (const field of required) {
    if (!body[field] && body[field] !== true) {
      return NextResponse.json(
        { status: 1, msg: `${field} is required.` },
        { status: 400 }
      );
    }
  }

  if (!body.termsAccepted) {
    return NextResponse.json(
      { status: 1, msg: 'Terms must be accepted.' },
      { status: 400 }
    );
  }

  const regId = `REG-${Date.now().toString().slice(-6)}`;

  addRegistration({
    id: regId,
    mobile: body.mobile || 'unknown',
    businessName: body.businessName,
    entityType: body.entityType,
    state: body.state,
    city: body.city,
    area: body.area,
    pincode: body.pincode,
    aadhaarNumber: body.aadhaarNumber,
    panNumber: body.panNumber,
    bankAccountName: body.bankAccountName,
    bankAccountNumber: body.bankAccountNumber,
    bankIfsc: body.bankIfsc,
    bankName: body.bankName,
    termsAccepted: body.termsAccepted,
    status: 'PENDING',
    submittedAt: new Date().toISOString(),
  });

  return NextResponse.json({
    status: 0,
    msg: 'registered',
    data: {
      isProfileComplete: true,
      registrationId: regId,
      businessName: body.businessName,
      entityType: body.entityType,
    },
  });
}
