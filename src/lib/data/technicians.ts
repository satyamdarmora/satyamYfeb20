// ---------------------------------------------------------------------------
// Technicians -- seed data & CRUD helpers
// ---------------------------------------------------------------------------

import type { Technician } from '../types';
import { getAllTasks } from './tasks';

const technicians: Technician[] = [
  { id: 'TECH-001', name: 'Ajay Patil',    band: 'A', available: true,  csp_id: 'CSP-MH-1001', phone: '+91 98765 43210', join_date: '2025-06-15', completed_count: 47 },
  { id: 'TECH-002', name: 'Suresh Kamble',  band: 'B', available: true,  csp_id: 'CSP-MH-1001', phone: '+91 98765 43211', join_date: '2025-08-01', completed_count: 31 },
  { id: 'TECH-003', name: 'Ramesh Jadhav',  band: 'B', available: false, csp_id: 'CSP-MH-1001', phone: '+91 98765 43212', join_date: '2025-09-10', completed_count: 22 },
  { id: 'TECH-004', name: 'Vikram Shinde',  band: 'C', available: true,  csp_id: 'CSP-MH-1001', phone: '+91 98765 43213', join_date: '2025-11-20', completed_count: 8  },
];

export function getTechnicians(): Technician[] {
  return technicians;
}

export function getTechnicianById(id: string): Technician | undefined {
  return technicians.find((t) => t.id === id);
}

export function addTechnician(tech: Technician): void {
  technicians.push(tech);
}

export function getTasksForTechnician(techId: string) {
  const tech = technicians.find((t) => t.id === techId);
  if (!tech) return [];
  return getAllTasks().filter((t) => t.assigned_to === tech.name);
}

export function getCompletedTasksForTechnician(techId: string) {
  const terminalStates = ['RESOLVED', 'VERIFIED', 'ACTIVATION_VERIFIED', 'RETURN_CONFIRMED', 'FAILED', 'UNRESOLVED', 'LOST_DECLARED'];
  return getTasksForTechnician(techId).filter((t) => terminalStates.includes(t.state));
}
