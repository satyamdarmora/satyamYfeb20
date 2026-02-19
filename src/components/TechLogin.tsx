'use client';

import { useState, useEffect } from 'react';
import type { Technician } from '@/lib/types';

interface TechLoginProps {
  onLogin: (techId: string) => void;
}

export default function TechLogin({ onLogin }: TechLoginProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/technician/register')
      .then((r) => r.json())
      .then((data) => {
        setTechnicians(data);
        setLoading(false);
      });
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 24,
              fontWeight: 800,
              color: '#FFFFFF',
            }}
          >
            W
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 6px',
            }}
          >
            Wiom Technician
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Select your profile to continue
          </p>
        </div>

        {/* Technician list */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Loading...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {technicians.map((tech) => (
              <button
                key={tech.id}
                onClick={() => onLogin(tech.id)}
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: 'var(--brand-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    flexShrink: 0,
                  }}
                >
                  {tech.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {tech.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Band {tech.band} &middot; {tech.id}
                  </div>
                </div>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: tech.available ? 'var(--positive)' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                />
              </button>
            ))}
          </div>
        )}

        <p
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: 24,
          }}
        >
          Only technicians added by your CSP can log in.
        </p>
      </div>
    </div>
  );
}
