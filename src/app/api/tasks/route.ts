import { NextRequest, NextResponse } from 'next/server';
import { backendGet, backendPost, backendPut, transformTask } from '@/lib/backend';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  try {
    const data = await backendGet('/v1/tasks', auth);
    const tasks = (data.tasks || data).map(transformTask);
    return NextResponse.json(tasks);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const body = await req.json();

  try {
    // CREATE: if body has 'task' field, create via backend
    if (body.task) {
      const created = await backendPost('/v1/tasks', {
        taskType: body.task.task_type,
        priority: body.task.priority,
        createdBy: body.task.created_by,
        connectionId: body.task.connection_id,
        netboxId: body.task.netbox_id,
        customerArea: body.task.customer_area,
      }, auth);
      return NextResponse.json({ ok: true, task: transformTask(created) });
    }

    // UPDATE state: if body has task_id + updates
    if (body.task_id && body.updates) {
      const numericId = parseInt(body.task_id.replace('TSK-', ''));
      if (body.updates.state) {
        const updated = await backendPut(`/v1/tasks/${numericId}/state`, {
          state: body.updates.state,
          actor: body.updates.actor || 'CSP',
          actorType: body.updates.actor_type || 'CSP',
          detail: body.updates.detail,
        }, auth);
        return NextResponse.json({ ok: true, task: transformTask(updated) });
      }
      if (body.updates.delegation_state) {
        const updated = await backendPut(`/v1/tasks/${numericId}/delegation`, {
          delegationState: body.updates.delegation_state,
          assignedToId: body.updates.assigned_to_id,
        }, auth);
        return NextResponse.json({ ok: true, task: transformTask(updated) });
      }
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
