'use client';

import { useState, useEffect } from 'react';
import type { SLAOverallState, SLADomain, SLASubMetric, SLAStanding, SLADomainId } from '@/lib/types';
import { getSLAState } from '@/lib/data';

interface SLAHubProps {
  onBack: () => void;
}

type FlowStep = 'hub' | 'domain_detail';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

function stColor(s: SLAStanding): string {
  return s === 'Compliant' ? 'var(--positive)' : s === 'At Risk' ? 'var(--warning)' : 'var(--negative)';
}
function stBg(s: SLAStanding): string {
  return s === 'Compliant' ? 'rgba(0,128,67,0.12)' : s === 'At Risk' ? 'rgba(255,128,0,0.12)' : 'rgba(220,38,38,0.12)';
}

function domainIcon(id: SLADomainId): string {
  return id === 'installation' ? '\u2692' : id === 'resolution' ? '\u2699' : id === 'stability' ? '\u2601' : '\u2605';
}

function metricColor(m: SLASubMetric): string {
  if (m.sample_count < m.min_sample) return 'var(--text-muted)';
  const breached = m.threshold_direction === 'above' ? m.value < m.threshold : m.value > m.threshold;
  const severe = m.threshold_direction === 'above' ? m.value < m.severe_threshold : m.value > m.severe_threshold;
  return severe ? 'var(--negative)' : breached ? 'var(--warning)' : 'var(--positive)';
}

function isBreach(m: SLASubMetric): boolean {
  if (m.sample_count < m.min_sample) return false;
  return m.threshold_direction === 'above' ? m.value < m.threshold : m.value > m.threshold;
}

function trendIcon(t: string): string {
  return t === 'improving' ? '\u2197' : t === 'declining' ? '\u2198' : '\u2192';
}

function trendColor(t: string): string {
  return t === 'improving' ? 'var(--positive)' : t === 'declining' ? 'var(--negative)' : 'var(--text-muted)';
}

export default function SLAHub({ onBack }: SLAHubProps) {
  const [sla, setSla] = useState<SLAOverallState>(getSLAState());
  const [step, setStep] = useState<FlowStep>('hub');
  const [selectedDomain, setSelectedDomain] = useState<SLADomain | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/sla');
        const data: SLAOverallState = await res.json();
        if (data) setSla(data);
      } catch { setSla(getSLAState()); }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 900, background: 'var(--bg-primary)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideUpIn 0.25s ease',
  };
  const scroll: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: '16px' };
  const back: React.CSSProperties = {
    background: 'none', border: 'none', color: 'var(--text-secondary)',
    fontSize: 14, cursor: 'pointer', padding: '4px 0', marginBottom: 12, fontWeight: 500,
  };

  // ---- Domain Drill-Down ----

  if (step === 'domain_detail' && selectedDomain) {
    const d = selectedDomain;
    return (
      <div style={overlay}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <button onClick={() => { setStep('hub'); setSelectedDomain(null); }} style={back}>&larr; Back</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              {domainIcon(d.id)} {d.name}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: stColor(d.state), background: stBg(d.state), padding: '5px 12px', borderRadius: 6 }}>
              {d.state}
            </span>
          </div>
        </div>

        <div style={scroll}>
          {d.sub_metrics.map((m) => {
            const mc = metricColor(m);
            const breached = isBreach(m);
            const isAbove = m.threshold_direction === 'above';

            // Bar math
            let barPct: number, thPct: number, sevPct: number;
            if (isAbove) {
              barPct = Math.min(100, (m.value / 100) * 100);
              thPct = (m.threshold / 100) * 100;
              sevPct = (m.severe_threshold / 100) * 100;
            } else {
              const max = m.severe_threshold * 1.5;
              barPct = Math.min(100, Math.max(0, 100 - (m.value / max) * 100));
              thPct = 100 - (m.threshold / max) * 100;
              sevPct = 100 - (m.severe_threshold / max) * 100;
            }

            return (
              <div key={m.id} style={{
                background: 'var(--bg-card)', borderRadius: 12, padding: '16px', marginBottom: 12,
                borderLeft: `4px solid ${mc}`,
              }}>
                {/* Name + value */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1, lineHeight: 1.3 }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: mc, marginLeft: 12 }}>
                    {m.value}{m.unit === '%' ? '%' : ''}
                  </div>
                </div>

                {/* Bar */}
                <div style={{ position: 'relative', height: 6, background: 'var(--bg-secondary)', borderRadius: 3, marginBottom: 6 }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${barPct}%`, background: mc, borderRadius: 3 }} />
                  <div style={{ position: 'absolute', left: `${thPct}%`, top: -2, width: 2, height: 10, background: 'var(--warning)', borderRadius: 1 }} />
                  <div style={{ position: 'absolute', left: `${sevPct}%`, top: -2, width: 2, height: 10, background: 'var(--negative)', borderRadius: 1 }} />
                </div>

                {/* Threshold + Trend row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>
                    Min: {isAbove ? '\u2265' : '\u2264'}{m.threshold}{m.unit === '%' ? '%' : ''}
                    {' '}&middot;{' '}
                    Severe: {isAbove ? '<' : '>'}{m.severe_threshold}{m.unit === '%' ? '%' : ''}
                  </span>
                  <span style={{ color: trendColor(m.trend), fontWeight: 500 }}>
                    {trendIcon(m.trend)} {m.trend}
                  </span>
                </div>

                {/* Action needed */}
                {breached && (
                  <div style={{
                    marginTop: 10, padding: '8px 12px', borderRadius: 6,
                    background: 'rgba(255,128,0,0.06)', border: '1px solid rgba(255,128,0,0.2)',
                    fontSize: 12, color: 'var(--warning)', fontWeight: 500,
                  }}>
                    {isAbove
                      ? `Needs to be above ${m.threshold}${m.unit === '%' ? '%' : ''}. Currently ${(m.threshold - m.value).toFixed(1)} below.`
                      : `Needs to be below ${m.threshold}${m.unit === '%' ? '%' : ''}. Currently ${(m.value - m.threshold).toFixed(1)} above.`
                    }
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ height: 40 }} />
        </div>
      </div>
    );
  }

  // ---- Hub ----

  const breached = sla.domains.filter((d) => d.state !== 'Compliant');

  return (
    <div style={overlay}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <button onClick={onBack} style={back}>&larr; Back</button>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>SLA</div>
      </div>

      <div style={scroll}>

        {/* Overall State */}
        <div style={{
          background: 'linear-gradient(135deg, var(--card-gradient-start), var(--card-gradient-end))',
          borderRadius: 14, padding: '20px', marginBottom: 12,
          border: `1px solid ${stColor(sla.overall_standing)}40`, textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-block', fontSize: 20, fontWeight: 700,
            color: stColor(sla.overall_standing), background: stBg(sla.overall_standing),
            padding: '8px 24px', borderRadius: 8, marginBottom: 10,
          }}>
            {sla.overall_standing}
          </div>

          {sla.overall_standing !== 'Compliant' && breached.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
              {breached.map((d) => d.name).join(', ')} needs attention
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{daysUntil(sla.next_evaluation)}d</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Next eval</div>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: sla.consequence.routing === 'Full' ? 'var(--positive)' : 'var(--warning)' }}>
                {sla.consequence.routing === 'Full' ? 'Full' : 'Tapered'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Routing</div>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: sla.consequence.bonus_eligibility === 'Eligible' ? 'var(--positive)' : 'var(--warning)' }}>
                {sla.consequence.bonus_eligibility === 'Eligible' ? 'Active' : 'Paused'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Bonus</div>
            </div>
          </div>
        </div>

        {/* Fix This (only when not compliant) */}
        {breached.length > 0 && (
          <div style={{
            background: 'rgba(255,128,0,0.06)', border: '1px solid rgba(255,128,0,0.25)',
            borderRadius: 10, padding: '12px 14px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)', marginBottom: 8 }}>
              Fix to recover
            </div>
            {breached.map((d) => {
              const failingMetrics = d.sub_metrics.filter(isBreach);
              return (
                <button
                  key={d.id}
                  onClick={() => { setSelectedDomain(d); setStep('domain_detail'); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', background: stBg(d.state), border: 'none',
                    borderRadius: 8, cursor: 'pointer', textAlign: 'left', marginBottom: 4,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: stColor(d.state) }}>
                      {domainIcon(d.id)} {d.name}
                    </span>
                    {failingMetrics.length > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {failingMetrics.map((m) => m.name.split('(')[0].trim()).join(', ')}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 14, color: stColor(d.state) }}>{'\u203A'}</span>
                </button>
              );
            })}
            {sla.hysteresis.required_clean_windows > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                {sla.hysteresis.required_clean_windows} clean eval window{sla.hysteresis.required_clean_windows > 1 ? 's' : ''} needed to recover
                ({sla.hysteresis.current_clean_windows}/{sla.hysteresis.required_clean_windows} done)
              </div>
            )}
          </div>
        )}

        {/* 4 Domains */}
        {sla.domains.map((domain) => {
          const dc = stColor(domain.state);
          return (
            <button
              key={domain.id}
              onClick={() => { setSelectedDomain(domain); setStep('domain_detail'); }}
              style={{
                width: '100%', background: 'var(--bg-card)', borderRadius: 10,
                padding: '14px 16px', marginBottom: 8, border: 'none',
                borderLeft: `4px solid ${dc}`, cursor: 'pointer', textAlign: 'left',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {domainIcon(domain.id)} {domain.name}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {domain.sub_metrics.map((m) => (
                    <span key={m.id} style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: metricColor(m), display: 'inline-block' }} />
                      {m.value}{m.unit === '%' ? '%' : ''}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: dc, background: stBg(domain.state), padding: '3px 10px', borderRadius: 5 }}>
                  {domain.state}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{'\u203A'}</span>
              </div>
            </button>
          );
        })}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
