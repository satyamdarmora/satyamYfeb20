import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

async function proxyRequest(req: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const backendPath = path.join('/');
  const url = new URL(req.url);
  const queryString = url.searchParams.toString();
  const target = `${BACKEND_URL}/${backendPath}${queryString ? `?${queryString}` : ''}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward authorization header
    const auth = req.headers.get('authorization');
    if (auth) headers['Authorization'] = auth;

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const body = await req.text();
      if (body) fetchOptions.body = body;
    }

    const res = await fetch(target, fetchOptions);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { status: 1, msg: 'Backend service unavailable' },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx.params);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx.params);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx.params);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx.params);
}
