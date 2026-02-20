import { NextResponse } from 'next/server';
import { getAllTasks, getTaskById, updateTask, addTask } from '@/lib/data';

export async function GET() {
  return NextResponse.json(getAllTasks());
}

export async function POST(request: Request) {
  const body = await request.json();

  // CREATE: if body has 'task' field, add a new task
  if (body.task) {
    addTask(body.task);
    return NextResponse.json({ ok: true, task: body.task });
  }

  // UPDATE: existing behavior
  const { task_id, updates } = body;
  if (!task_id) {
    return NextResponse.json({ error: 'task_id required' }, { status: 400 });
  }
  updateTask(task_id, updates);
  return NextResponse.json({ ok: true, task: getTaskById(task_id) });
}
