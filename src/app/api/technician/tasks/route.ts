import { NextResponse } from 'next/server';
import { getTasksForTechnician, getTechnicianById } from '@/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const techId = searchParams.get('tech_id');

  if (!techId) {
    return NextResponse.json({ error: 'tech_id required' }, { status: 400 });
  }

  const tech = getTechnicianById(techId);
  if (!tech) {
    return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
  }

  const tasks = getTasksForTechnician(techId);
  return NextResponse.json({ tech, tasks });
}
