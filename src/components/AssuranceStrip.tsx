'use client';

import { useState } from 'react';
import type { AssuranceState } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import DrillDown from './DrillDown';

interface AssuranceStripProps {
  assuranceState: AssuranceState;
  lifetimeEarnings?: number;
  onOpenSLA?: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN').format(amount);
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

type DrillDownType = 'activeBase' | 'earnings' | 'sla' | 'exposure' | null;

export default function AssuranceStrip({ assuranceState, lifetimeEarnings, onOpenSLA }: AssuranceStripProps) {
  const { t } = useI18n();
  const [openDrill, setOpenDrill] = useState<DrillDownType>(null);

  const slaColor =
    assuranceState.sla_standing === 'Compliant'
      ? 'var(--positive)'
      : assuranceState.sla_standing === 'At Risk'
        ? 'var(--warning)'
        : 'var(--negative)';

  const exposureColor =
    assuranceState.exposure_state === 'ELIGIBLE'
      ? 'var(--positive)'
      : assuranceState.exposure_state === 'LIMITED'
        ? 'var(--warning)'
        : 'var(--negative)';

  const slaDisplay =
    assuranceState.sla_standing === 'Compliant'
      ? t('sla.compliant')
      : assuranceState.sla_standing === 'At Risk'
        ? t('sla.atRisk')
        : t('sla.nonCompliant');

  const exposureDisplay =
    assuranceState.exposure_state === 'ELIGIBLE'
      ? t('exposure.eligible')
      : assuranceState.exposure_state === 'LIMITED'
        ? t('exposure.limited')
        : t('exposure.ineligible');

  const drillLabelStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 4,
  };

  const drillValueStyle: React.CSSProperties = {
    fontSize: 15,
    color: 'var(--text-primary)',
    fontWeight: 600,
    marginBottom: 16,
  };

  const eventRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid var(--border-subtle)',
    fontSize: 13,
  };

  return (
    <>
      {/* Assurance Strip: 2 metric cards + stacked SLA/Exposure */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          gap: 10,
          padding: '16px 20px',
          background: 'var(--strip-bg)',
        }}
      >
        {/* Active Base */}
        <div
          onClick={() => setOpenDrill('activeBase')}
          style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            padding: '14px 16px',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>
            {t('assurance.activeBase')}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {assuranceState.active_base}
          </div>
        </div>

        {/* Earnings */}
        <div
          onClick={() => setOpenDrill('earnings')}
          style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            padding: '14px 16px',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>
            {t('assurance.cycleEarnings')}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {'\u20B9'}{formatCurrency(assuranceState.cycle_earned)}
          </div>
        </div>

        {/* SLA + Exposure stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* SLA */}
          <div
            onClick={() => onOpenSLA ? onOpenSLA() : setOpenDrill('sla')}
            style={{
              flex: 1,
              background: 'var(--bg-card)',
              borderRadius: 10,
              padding: '6px 14px',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: slaColor,
                boxShadow: `0 0 6px ${slaColor}`,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.3 }}>
              SLA
            </span>
          </div>

          {/* Exposure */}
          <div
            onClick={() => setOpenDrill('exposure')}
            style={{
              flex: 1,
              background: 'var(--bg-card)',
              borderRadius: 10,
              padding: '6px 14px',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: exposureColor,
                boxShadow: `0 0 6px ${exposureColor}`,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.3 }}>
              {t('assurance.exposure')}
            </span>
          </div>
        </div>
      </div>

      {/* Active Base Drill-Down */}
      <DrillDown
        isOpen={openDrill === 'activeBase'}
        onClose={() => setOpenDrill(null)}
        title={t('assurance.activeBase')}
      >
        <div style={drillLabelStyle}>{t('assurance.currentCount')}</div>
        <div style={drillValueStyle}>{assuranceState.active_base} {t('assurance.connections')}</div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {t('assurance.recentChanges')}
        </div>
        {assuranceState.active_base_events.map((evt, i) => (
          <div key={i} style={eventRowStyle}>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{evt.connection_id}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{evt.reason}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  color: evt.change > 0 ? 'var(--positive)' : 'var(--negative)',
                  fontWeight: 600,
                }}
              >
                {evt.change > 0 ? '+1' : '-1'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                {formatRelativeDate(evt.date)}
              </div>
            </div>
          </div>
        ))}
      </DrillDown>

      {/* Earnings Drill-Down */}
      <DrillDown
        isOpen={openDrill === 'earnings'}
        onClose={() => setOpenDrill(null)}
        title={t('assurance.cycleEarnings')}
      >
        <div style={drillLabelStyle}>{t('assurance.cycleEarned')}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
          {'\u20B9'}{formatCurrency(assuranceState.cycle_earned)}
        </div>

        <div style={drillLabelStyle}>{t('assurance.activeBase')}</div>
        <div style={drillValueStyle}>{assuranceState.active_base} {t('assurance.connections')}</div>

        <div style={drillLabelStyle}>{t('assurance.nextSettlement')}</div>
        <div style={drillValueStyle}>
          {'\u20B9'}{formatCurrency(assuranceState.next_settlement_amount)} on{' '}
          {formatDate(assuranceState.next_settlement_date)}
        </div>

        {lifetimeEarnings != null && (
          <>
            <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 8, marginBottom: 12 }} />
            <div style={drillLabelStyle}>{t('assurance.lifetimeEarned')}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--money)', marginBottom: 16 }}>
              {'\u20B9'}{formatCurrency(lifetimeEarnings)}
            </div>
          </>
        )}

        <div
          style={{
            marginTop: 12,
            padding: 14,
            background: 'var(--bg-primary)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          {t('assurance.cycleNote')}{' '}
          <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{t('assurance.wallet')}</span>{' '}
          {t('assurance.fromMenu')}
        </div>
      </DrillDown>

      {/* SLA Standing Drill-Down */}
      <DrillDown
        isOpen={openDrill === 'sla'}
        onClose={() => setOpenDrill(null)}
        title={t('assurance.slaStanding')}
      >
        <div style={drillLabelStyle}>{t('assurance.currentStatus')}</div>
        <div style={{ ...drillValueStyle, color: slaColor }}>
          {slaDisplay}
        </div>

        <div style={drillLabelStyle}>{t('assurance.activeRestores')}</div>
        <div style={drillValueStyle}>{assuranceState.active_restores}</div>

        <div style={drillLabelStyle}>{t('assurance.unresolvedCount')}</div>
        <div style={drillValueStyle}>{assuranceState.unresolved_count}</div>

        <div
          style={{
            marginTop: 12,
            padding: 14,
            background: 'var(--bg-primary)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          {t('assurance.slaNote')}
        </div>
      </DrillDown>

      {/* Exposure Drill-Down */}
      <DrillDown
        isOpen={openDrill === 'exposure'}
        onClose={() => setOpenDrill(null)}
        title={t('assurance.exposure')}
      >
        <div style={drillLabelStyle}>{t('assurance.currentStatus')}</div>
        <div style={{ ...drillValueStyle, color: exposureColor }}>
          {exposureDisplay}
        </div>

        <div style={drillLabelStyle}>{t('assurance.reasonCode')}</div>
        <div style={drillValueStyle}>{assuranceState.exposure_reason}</div>

        <div style={drillLabelStyle}>{t('assurance.effectiveSince')}</div>
        <div style={drillValueStyle}>{formatDate(assuranceState.exposure_since)}</div>

        <div
          style={{
            marginTop: 12,
            padding: 14,
            background: 'var(--bg-primary)',
            borderRadius: 8,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <div style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>{t('assurance.qualSignal')}</div>
          <div style={{ color: 'var(--text-primary)' }}>
            {assuranceState.exposure_state === 'ELIGIBLE'
              ? t('assurance.exposureOk')
              : assuranceState.exposure_state === 'LIMITED'
                ? t('assurance.exposureLimited')
                : t('assurance.exposureCritical')}
          </div>
        </div>
      </DrillDown>
    </>
  );
}
