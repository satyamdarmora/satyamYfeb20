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

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: res.ok ? 200 : res.status });
    } catch {
      return NextResponse.json({ status: 1, msg: 'Auth service returned invalid response' }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ status: 1, msg: 'Failed to reach auth service' }, { status: 502 });
  }
}
