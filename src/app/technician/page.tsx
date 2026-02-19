'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, Technician } from '@/lib/types';
import TechLogin from '@/components/TechLogin';
import TechDashboard from '@/components/TechDashboard';
import TechTaskDetail from '@/components/TechTaskDetail';
import TechProfile from '@/components/TechProfile';

type View = 'login' | 'dashboard' | 'task_detail' | 'profile';

export default function TechnicianPage() {
  const [techId, setTechId] = useState<string | null>(null);
  const [tech, setTech] = useState<Technician | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<View>('login');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('wiom_tech_id');
    if (stored) {
      setTechId(stored);
      setView('dashboard');
    }
  }, []);

  // Fetch tasks whenever techId changes
  const fetchTasks = useCallback(async () => {
    if (!techId) return;
    try {
      const res = await fetch(`/api/technician/tasks?tech_id=${techId}`);
      if (!res.ok) return;
      const data = await res.json();
      setTech(data.tech);
      setTasks(data.tasks);
    } catch {
      // silently ignore poll errors
    }
  }, [techId]);

  // Poll every 2s
  useEffect(() => {
    if (!techId) return;
    fetchTasks();
    pollRef.current = setInterval(fetchTasks, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [techId, fetchTasks]);

  const handleLogin = useCallback((id: string) => {
    localStorage.setItem('wiom_tech_id', id);
    setTechId(id);
    setView('dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('wiom_tech_id');
    setTechId(null);
    setTech(null);
    setTasks([]);
    setView('login');
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const handleAction = useCallback(
    async (taskId: string, action: string) => {
      if (!techId) return;
      const res = await fetch('/api/technician/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tech_id: techId, task_id: taskId, action }),
      });
      if (res.ok) {
        setConfirmMsg(`${action.replace(/_/g, ' ')} completed`);
        setTimeout(() => setConfirmMsg(null), 2500);
        await fetchTasks();
      }
    },
    [techId, fetchTasks]
  );

  const handleToggleAvailability = useCallback(async () => {
    if (!tech) return;
    // Toggle locally for now (in-memory store will update via poll)
    setTech({ ...tech, available: !tech.available });
  }, [tech]);

  if (view === 'login' || !techId) {
    return <TechLogin onLogin={handleLogin} />;
  }

  if (!tech) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: 14,
        }}
      >
        Loading...
      </div>
    );
  }

  const TERMINAL_STATES = ['RESOLVED', 'VERIFIED', 'ACTIVATION_VERIFIED', 'RETURN_CONFIRMED', 'FAILED', 'UNRESOLVED', 'LOST_DECLARED'];
  const activeCount = tasks.filter((t) => !TERMINAL_STATES.includes(t.state)).length;

  const selectedTask = selectedTaskId ? tasks.find((t) => t.task_id === selectedTaskId) : null;

  return (
    <>
      {/* Confirmation toast */}
      {confirmMsg && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--positive)',
            borderRadius: 10,
            padding: '12px 24px',
            fontSize: 14,
            color: 'var(--positive)',
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          {confirmMsg}
        </div>
      )}

      {/* Task Detail overlay */}
      {view === 'task_detail' && selectedTask && (
        <TechTaskDetail
          task={selectedTask}
          techId={techId}
          onAction={async (taskId, action) => {
            await handleAction(taskId, action);
            setView('dashboard');
            setSelectedTaskId(null);
          }}
          onClose={() => {
            setView('dashboard');
            setSelectedTaskId(null);
          }}
        />
      )}

      {/* Profile overlay */}
      {view === 'profile' && (
        <TechProfile
          tech={tech}
          activeCount={activeCount}
          onLogout={handleLogout}
          onClose={() => setView('dashboard')}
        />
      )}

      {/* Dashboard */}
      <TechDashboard
        tech={tech}
        tasks={tasks}
        onSelectTask={(taskId) => {
          setSelectedTaskId(taskId);
          setView('task_detail');
        }}
        onOpenProfile={() => setView('profile')}
        onToggleAvailability={handleToggleAvailability}
      />
    </>
  );
}
