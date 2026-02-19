import { NextResponse } from 'next/server';
import { getTaskById, updateTask, getTechnicianById } from '@/lib/data';

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

export async function POST(request: Request) {
  const body: ActionRequest = await request.json();
  const { tech_id, task_id, action, detail } = body;

  const tech = getTechnicianById(tech_id);
  if (!tech) {
    return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
  }

  const task = getTaskById(task_id);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const newEvent = {
    timestamp: now,
    event_type: action,
    actor: tech.name,
    actor_type: 'TECHNICIAN' as const,
    detail: detail || `Technician performed ${action}`,
  };

  switch (action) {
    case 'ACCEPT_ASSIGNMENT':
      updateTask(task_id, {
        state: task.task_type === 'INSTALL' ? 'ACCEPTED' : task.task_type === 'RESTORE' ? 'ASSIGNED' : 'ASSIGNED',
        delegation_state: 'ACCEPTED',
        event_log: [...task.event_log, { ...newEvent, detail: detail || `${tech.name} accepted the assignment.` }],
      });
      break;

    case 'START_WORK':
      updateTask(task_id, {
        state: task.task_type === 'INSTALL' ? 'SCHEDULED' : 'IN_PROGRESS',
        delegation_state: 'IN_PROGRESS',
        event_log: [...task.event_log, { ...newEvent, detail: detail || `${tech.name} started work on the task.` }],
      });
      break;

    case 'MARK_INSTALLED':
      updateTask(task_id, {
        state: 'INSTALLED',
        delegation_state: 'DONE',
        queue_escalation_flag: 'VERIFICATION_PENDING',
        event_log: [...task.event_log, { ...newEvent, detail: detail || `${tech.name} marked installation complete. Awaiting verification.` }],
      });
      // Increment completed count
      tech.completed_count += 1;
      break;

    case 'RESOLVE':
      updateTask(task_id, {
        state: 'RESOLVED',
        delegation_state: 'DONE',
        event_log: [...task.event_log, { ...newEvent, detail: detail || `${tech.name} resolved the issue.` }],
      });
      tech.completed_count += 1;
      break;

    case 'MARK_COLLECTED':
      updateTask(task_id, {
        state: 'COLLECTED',
        delegation_state: 'IN_PROGRESS',
        event_log: [...task.event_log, { ...newEvent, detail: detail || `${tech.name} collected the netbox from customer.` }],
      });
      break;

    case 'CONFIRM_RETURN':
      updateTask(task_id, {
        state: 'RETURN_CONFIRMED',
        delegation_state: 'DONE',
        event_log: [...task.event_log, { ...newEvent, detail: detail || `${tech.name} confirmed netbox return to warehouse.` }],
      });
      tech.completed_count += 1;
      break;

    case 'UPLOAD_PROOF':
      updateTask(task_id, {
        proof_bundle: { ...task.proof_bundle, [`proof_${Date.now()}`]: `proof://img/${task_id}/tech-upload.jpg` },
        event_log: [...task.event_log, { ...newEvent, detail: detail || `${tech.name} uploaded proof.` }],
      });
      break;

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  return NextResponse.json({ ok: true, task: getTaskById(task_id) });
}
