import { NextRequest, NextResponse } from 'next/server';

const AUTH_BASE_URL = 'https://services.qa.i2e1.in/';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams.toString();

    const res = await fetch(`${AUTH_BASE_URL}v1/Authentication/VerifyOTP?${params}`);

    const json = await res.json();

    // Try to grab jwt_token header from QA response
    const jwtToken = res.headers.get('jwt_token');

    const response = NextResponse.json(json, { status: res.ok ? 200 : res.status });
    if (jwtToken) {
      response.headers.set('jwt_token', jwtToken);
    }
    return response;
  } catch {
    return NextResponse.json({ status: 1, msg: 'Failed to reach auth service' }, { status: 502 });
  }
}
