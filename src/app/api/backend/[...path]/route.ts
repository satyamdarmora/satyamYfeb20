import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

async function proxyRequest(req: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const backendPath = path.join('/');
  const url = new URL(req.url);
  const queryString = url.searchParams.toString();
  const target = `${BACKEND_URL}/${backendPath}${queryString ? `?${queryString}` : ''}`;

  try {
    const contentType = req.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');

    const headers: Record<string, string> = {};

    if (isMultipart) {
      // Pass content-type through (includes boundary)
      headers['Content-Type'] = contentType;
    } else {
      headers['Content-Type'] = 'application/json';
    }

    // Forward authorization header
    const auth = req.headers.get('authorization');
    if (auth) headers['Authorization'] = auth;

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (isMultipart) {
        // Pass raw body bytes for multipart
        const buffer = await req.arrayBuffer();
        fetchOptions.body = buffer;
      } else {
        const body = await req.text();
        if (body) fetchOptions.body = body;
      }
    }

    const res = await fetch(target, fetchOptions);

    // Check response content type for file downloads vs JSON
    const resContentType = res.headers.get('content-type') || '';
    if (resContentType.includes('application/json')) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } else {
      // Binary response (file download)
      const blob = await res.arrayBuffer();
      return new NextResponse(blob, {
        status: res.status,
        headers: {
          'Content-Type': resContentType,
          ...(res.headers.get('content-disposition')
            ? { 'Content-Disposition': res.headers.get('content-disposition')! }
            : {}),
        },
      });
    }
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
