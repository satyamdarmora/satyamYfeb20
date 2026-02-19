import { NextResponse } from 'next/server';
import { addTechnician, getTechnicians } from '@/lib/data';
import type { Technician } from '@/lib/types';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, phone, band, csp_id } = body;

  if (!name || !band || !csp_id) {
    return NextResponse.json({ error: 'name, band, and csp_id are required' }, { status: 400 });
  }

  const newTech: Technician = {
    id: `TECH-${Date.now().toString().slice(-4)}`,
    name: name.trim(),
    band,
    available: true,
    csp_id,
    phone: phone || '',
    join_date: new Date().toISOString().split('T')[0],
    completed_count: 0,
  };

  addTechnician(newTech);
  return NextResponse.json({ ok: true, technician: newTech });
}

export async function GET() {
  return NextResponse.json(getTechnicians());
}
