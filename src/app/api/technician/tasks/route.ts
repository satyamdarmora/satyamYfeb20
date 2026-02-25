import { NextRequest, NextResponse } from 'next/server';
import { backendGet, transformTask, transformTechnician } from '@/lib/backend';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const { searchParams } = new URL(req.url);
  const techId = searchParams.get('tech_id');

  if (!techId) {
    return NextResponse.json({ error: 'tech_id required' }, { status: 400 });
  }

  try {
    const numericId = parseInt(techId.replace('TECH-', ''));
    const tech = await backendGet(`/v1/technicians/${numericId}`, auth);
    const tasks = (tech.tasks || []).map(transformTask);
    return NextResponse.json({
      tech: transformTechnician(tech),
      tasks,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
