'use client';

import type { Technician } from '@/lib/types';

interface TechProfileProps {
  tech: Technician;
  activeCount: number;
  onLogout: () => void;
  onClose: () => void;
}

export default function TechProfile({ tech, activeCount, onLogout, onClose }: TechProfileProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUpIn 0.25s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 14,
            cursor: 'pointer',
            padding: '4px 0',
            marginBottom: 10,
            fontWeight: 500,
          }}
        >
          &larr; Back
        </button>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          Profile
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {/* Avatar + name */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: 12,
            }}
          >
            {tech.name.charAt(0)}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            {tech.name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {tech.id}
          </div>
        </div>

        {/* Info card */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            padding: '18px',
            marginBottom: 20,
          }}
        >
          <InfoRow label="Band" value={`Band ${tech.band}`} />
          <InfoRow label="CSP" value={tech.csp_id} />
          <InfoRow label="Phone" value={tech.phone || '--'} />
          <InfoRow label="Joined" value={tech.join_date} last />
        </div>

        {/* Stats card */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            padding: '18px',
            marginBottom: 28,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Stats
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <StatBox label="Completed" value={tech.completed_count} color="var(--positive)" />
            <StatBox label="Active" value={activeCount} color="var(--brand-primary)" />
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '15px',
            background: 'rgba(224,30,0,0.1)',
            color: 'var(--negative)',
            border: '1px solid rgba(224,30,0,0.3)',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        borderRadius: 10,
        padding: '14px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}
