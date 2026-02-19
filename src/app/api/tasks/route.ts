import { NextResponse } from 'next/server';
import { getAllTasks, getTaskById, updateTask } from '@/lib/data';

export async function GET() {
  return NextResponse.json(getAllTasks());
}

export async function POST(request: Request) {
  const { task_id, updates } = await request.json();
  if (!task_id) {
    return NextResponse.json({ error: 'task_id required' }, { status: 400 });
  }
  updateTask(task_id, updates);
  return NextResponse.json({ ok: true, task: getTaskById(task_id) });
}
