import { NextRequest, NextResponse } from 'next/server';
import { backendGet, backendPost, transformTechnician } from '@/lib/backend';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  try {
    const data = await backendGet('/v1/technicians', auth);
    const technicians = (data.technicians || data || []).map(transformTechnician);
    return NextResponse.json(technicians);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const body = await req.json();
  const { name, phone, band } = body;

  if (!name || !band) {
    return NextResponse.json({ error: 'name and band are required' }, { status: 400 });
  }

  try {
    const created = await backendPost('/v1/technicians', { name, phone, band }, auth);
    return NextResponse.json({ ok: true, technician: transformTechnician(created) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
