'use client';

import { useState, useEffect } from 'react';
import type { Technician, Task } from '@/lib/types';
import { getTechnicians, getAllTasks } from '@/lib/data';

interface TeamHubProps {
  onBack: () => void;
}

type FlowStep = 'roster' | 'add_member' | 'member_detail' | 'edit_permissions' | 'remove_confirm';

const BANDS: Technician['band'][] = ['A', 'B', 'C'];

export default function TeamHub({ onBack }: TeamHubProps) {
  const [step, setStep] = useState<FlowStep>('roster');
  const [techs, setTechs] = useState<Technician[]>(getTechnicians());
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [editBand, setEditBand] = useState<Technician['band']>('A');

  // Add member form
  const [newName, setNewName] = useState('');
  const [newBand, setNewBand] = useState<Technician['band']>('B');
  const [newPhone, setNewPhone] = useState('');

  // Active task count per technician
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    const terminal = ['RESOLVED', 'VERIFIED', 'ACTIVATION_VERIFIED', 'RETURN_CONFIRMED', 'FAILED', 'UNRESOLVED', 'LOST_DECLARED'];
    const allTasks = getAllTasks();
    const counts: Record<string, number> = {};
    techs.forEach((t) => {
      counts[t.id] = allTasks.filter((task) => task.assigned_to === t.name && !terminal.includes(task.state)).length;
    });
    setTaskCounts(counts);
  }, [techs]);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 900,
    background: '#161021',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'slideUpIn 0.25s ease',
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px',
    borderBottom: '1px solid #352D42',
    flexShrink: 0,
  };

  const scrollStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  };

  const btnPrimary: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    background: '#D9008D',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: '#352D42',
    border: '1px solid #352D42',
    borderRadius: 10,
    color: '#FAF9FC',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const backBtn = (target: FlowStep = 'roster') => (
    <button
      onClick={() => setStep(target)}
      style={{
        background: 'none',
        border: 'none',
        color: '#A7A1B2',
        fontSize: 14,
        cursor: 'pointer',
        padding: '4px 0',
        marginBottom: 12,
        fontWeight: 500,
      }}
    >
      &larr; Back
    </button>
  );

  // Roster
  if (step === 'roster') {
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#A7A1B2',
              fontSize: 14,
              cursor: 'pointer',
              padding: '4px 0',
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            &larr; Back
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>Team</div>
              <div style={{ fontSize: 12, color: '#A7A1B2', marginTop: 2 }}>
                {techs.length} member{techs.length !== 1 ? 's' : ''}
              </div>
            </div>
            <button
              onClick={() => { setStep('add_member'); setNewName(''); setNewPhone(''); setNewBand('B'); }}
              style={{
                padding: '8px 16px',
                background: '#D9008D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Add Member
            </button>
          </div>
        </div>

        <div style={scrollStyle}>
          {techs.map((tech) => (
            <button
              key={tech.id}
              onClick={() => { setSelectedTech(tech); setEditBand(tech.band); setStep('member_detail'); }}
              style={{
                width: '100%',
                background: '#443152',
                border: '1px solid #352D42',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: tech.available ? '#008043' : '#665E75',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#FAF9FC' }}>{tech.name}</div>
                  <div style={{ fontSize: 12, color: '#A7A1B2', marginTop: 2 }}>
                    Band {tech.band} &middot; {tech.available ? 'Available' : 'Unavailable'}
                    {taskCounts[tech.id] ? ` \u00B7 ${taskCounts[tech.id]} active` : ''}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 16, color: '#665E75' }}>&rsaquo;</span>
            </button>
          ))}

          <div style={{ height: 40 }} />
        </div>
      </div>
    );
  }

  // Add member
  if (step === 'add_member') {
    const canSubmit = newName.trim().length > 0;
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          {backBtn('roster')}
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>Add Team Member</div>
        </div>
        <div style={scrollStyle}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#A7A1B2', display: 'block', marginBottom: 6 }}>Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Technician name"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#A7A1B2', display: 'block', marginBottom: 6 }}>Band</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {BANDS.map((b) => (
                <button
                  key={b}
                  onClick={() => setNewBand(b)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: newBand === b ? '#D9008D' : '#352D42',
                    color: newBand === b ? '#FFFFFF' : '#A7A1B2',
                    border: newBand === b ? '1px solid #D9008D' : '1px solid #352D42',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Band {b}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, color: '#A7A1B2', display: 'block', marginBottom: 6 }}>Phone</label>
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              style={inputStyle}
            />
          </div>
          <button
            onClick={async () => {
              if (canSubmit) {
                try {
                  const res = await fetch('/api/technician/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: newName.trim(),
                      phone: newPhone.trim(),
                      band: newBand,
                      csp_id: 'CSP-MH-1001',
                    }),
                  });
                  const data = await res.json();
                  if (data.ok) {
                    setTechs([...techs, data.technician]);
                  }
                } catch {
                  // fallback: add locally
                  const newTech: Technician = {
                    id: `TECH-${Date.now().toString().slice(-4)}`,
                    name: newName.trim(),
                    band: newBand,
                    available: true,
                    csp_id: 'CSP-MH-1001',
                    phone: newPhone.trim(),
                    join_date: new Date().toISOString().split('T')[0],
                    completed_count: 0,
                  };
                  setTechs([...techs, newTech]);
                }
                setStep('roster');
              }
            }}
            style={{ ...btnPrimary, opacity: canSubmit ? 1 : 0.4 }}
          >
            Add Member
          </button>
        </div>
      </div>
    );
  }

  // Member detail
  if (step === 'member_detail' && selectedTech) {
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          {backBtn('roster')}
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>{selectedTech.name}</div>
        </div>
        <div style={scrollStyle}>
          <div style={{
            background: '#443152',
            borderRadius: 12,
            padding: '20px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#665E75',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#FAF9FC',
                }}
              >
                {selectedTech.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#FAF9FC' }}>{selectedTech.name}</div>
                <div style={{ fontSize: 12, color: '#A7A1B2' }}>{selectedTech.id}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #352D42' }}>
              <span style={{ fontSize: 13, color: '#A7A1B2' }}>Band</span>
              <span style={{ fontSize: 13, color: '#FAF9FC', fontWeight: 600 }}>{selectedTech.band}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #352D42' }}>
              <span style={{ fontSize: 13, color: '#A7A1B2' }}>Availability</span>
              <span style={{ fontSize: 13, color: selectedTech.available ? '#008043' : '#E01E00', fontWeight: 600 }}>
                {selectedTech.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => {
                const updated = techs.map((t) =>
                  t.id === selectedTech.id ? { ...t, available: !t.available } : t
                );
                setTechs(updated);
                setSelectedTech({ ...selectedTech, available: !selectedTech.available });
              }}
              style={{
                ...btnPrimary,
                background: selectedTech.available ? '#665E75' : '#008043',
              }}
            >
              {selectedTech.available ? 'Set Unavailable' : 'Set Available'}
            </button>
            <button
              onClick={() => setStep('edit_permissions')}
              style={btnPrimary}
            >
              Edit Permissions
            </button>
            <button
              onClick={() => setStep('remove_confirm')}
              style={{
                width: '100%',
                padding: '14px',
                background: 'rgba(224,30,0,0.1)',
                color: '#E01E00',
                border: '1px solid rgba(224,30,0,0.3)',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Remove Member
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Edit permissions
  if (step === 'edit_permissions' && selectedTech) {
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          {backBtn('member_detail')}
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>Edit Permissions</div>
        </div>
        <div style={scrollStyle}>
          <div style={{ fontSize: 14, color: '#FAF9FC', marginBottom: 16 }}>
            Editing role for <strong>{selectedTech.name}</strong>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, color: '#A7A1B2', display: 'block', marginBottom: 8 }}>Band / Role</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {BANDS.map((b) => (
                <button
                  key={b}
                  onClick={() => setEditBand(b)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: editBand === b ? '#D9008D' : '#352D42',
                    color: editBand === b ? '#FFFFFF' : '#A7A1B2',
                    border: editBand === b ? '1px solid #D9008D' : '1px solid #352D42',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Band {b}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              const updated = techs.map((t) =>
                t.id === selectedTech.id ? { ...t, band: editBand } : t
              );
              setTechs(updated);
              setSelectedTech({ ...selectedTech, band: editBand });
              setStep('member_detail');
            }}
            style={btnPrimary}
          >
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  // Remove confirm
  if (step === 'remove_confirm' && selectedTech) {
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          {backBtn('member_detail')}
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>Remove Member</div>
        </div>
        <div style={{ ...scrollStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 14, color: '#FAF9FC', textAlign: 'center', marginBottom: 8 }}>
            Are you sure you want to remove
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC', textAlign: 'center', marginBottom: 24 }}>
            {selectedTech.name}?
          </div>
          <div style={{ fontSize: 13, color: '#A7A1B2', textAlign: 'center', marginBottom: 32 }}>
            This action cannot be undone. All pending task assignments will need to be reassigned.
          </div>
          <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 360 }}>
            <button
              onClick={() => setStep('member_detail')}
              style={{
                flex: 1,
                padding: '14px',
                background: '#352D42',
                color: '#A7A1B2',
                border: '1px solid #352D42',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setTechs(techs.filter((t) => t.id !== selectedTech.id));
                setSelectedTech(null);
                setStep('roster');
              }}
              style={{
                flex: 1,
                padding: '14px',
                background: '#E01E00',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
