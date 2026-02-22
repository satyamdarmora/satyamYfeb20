import { NextRequest, NextResponse } from 'next/server';

const AUTH_BASE_URL = 'https://services.qa.i2e1.in/';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${AUTH_BASE_URL}v1/Authentication/SendOTP`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    return NextResponse.json(json, { status: res.ok ? 200 : res.status });
  } catch {
    return NextResponse.json({ status: 1, msg: 'Failed to reach auth service' }, { status: 502 });
  }
}
