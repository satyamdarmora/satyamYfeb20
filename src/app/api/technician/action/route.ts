import { NextRequest, NextResponse } from 'next/server';
import { backendGet, backendPut, transformTask } from '@/lib/backend';

type TechAction =
  | 'ACCEPT_ASSIGNMENT'
  | 'START_WORK'
  | 'MARK_INSTALLED'
  | 'RESOLVE'
  | 'MARK_COLLECTED'
  | 'CONFIRM_RETURN'
  | 'UPLOAD_PROOF';

interface ActionRequest {
  tech_id: string;
  task_id: string;
  action: TechAction;
  detail?: string;
}

// Map action to target state based on task type
function getTargetState(action: TechAction, taskType: string): string | null {
  switch (action) {
    case 'ACCEPT_ASSIGNMENT':
      return taskType === 'INSTALL' ? 'ACCEPTED' : 'ASSIGNED';
    case 'START_WORK':
      return taskType === 'INSTALL' ? 'SCHEDULED' : 'IN_PROGRESS';
    case 'MARK_INSTALLED':
      return 'INSTALLED';
    case 'RESOLVE':
      return 'RESOLVED';
    case 'MARK_COLLECTED':
      return 'COLLECTED';
    case 'CONFIRM_RETURN':
      return 'RETURN_CONFIRMED';
    case 'UPLOAD_PROOF':
      return null; // No state change for proof upload
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const body: ActionRequest = await req.json();
  const { tech_id, task_id, action, detail } = body;

  // Extract numeric task ID
  const numericId = parseInt(task_id.replace('TSK-', ''));

  try {
    // Get current task to determine type
    const tasksData = await backendGet('/v1/tasks', auth);
    const tasks = tasksData.tasks || tasksData || [];
    const task = tasks.find((t: any) => t.id === numericId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (action === 'UPLOAD_PROOF') {
      const updated = await backendPut(`/v1/tasks/${numericId}/proof`, {
        proofKey: `proof_${Date.now()}`,
        proofUrl: `proof://img/${task_id}/tech-upload.jpg`,
        actor: tech_id,
        actorType: 'TECHNICIAN',
        detail: detail || 'Technician uploaded proof.',
      }, auth);
      return NextResponse.json({ ok: true, task: transformTask(updated) });
    }

    const targetState = getTargetState(action, task.taskType);
    if (!targetState) {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const updated = await backendPut(`/v1/tasks/${numericId}/state`, {
      state: targetState,
      actor: tech_id,
      actorType: 'TECHNICIAN',
      detail: detail || `Technician performed ${action}`,
    }, auth);

    return NextResponse.json({ ok: true, task: transformTask(updated) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
