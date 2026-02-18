'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

interface ProfilePageProps {
  onBack: () => void;
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { lang, setLang, t } = useI18n();
  const [taskAlerts, setTaskAlerts] = useState(true);
  const [slaWarnings, setSlaWarnings] = useState(true);
  const [settlementUpdates, setSettlementUpdates] = useState(true);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 900,
    background: '#161021',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
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

  const sectionTitle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#A7A1B2',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 24,
  };

  const toggleRow = (label: string, value: boolean, onChange: (v: boolean) => void) => (
    <div
      key={label}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 0',
        borderBottom: '1px solid #352D42',
      }}
    >
      <span style={{ fontSize: 14, color: '#FAF9FC' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          border: 'none',
          background: value ? '#D9008D' : '#352D42',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#FFFFFF',
            position: 'absolute',
            top: 3,
            left: value ? 23 : 3,
            transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  );

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
          &larr; {t('profile.back')}
        </button>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>{t('profile.title')}</div>
      </div>

      <div style={scrollStyle}>
        {/* CSP Info Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #443152, #665E75)',
            borderRadius: 14,
            padding: '24px 20px',
            marginBottom: 8,
            border: '1px solid #352D42',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#D9008D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 700,
                color: '#FFFFFF',
              }}
            >
              C
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>CSP-MH-1001</div>
              <div style={{ fontSize: 13, color: '#A7A1B2', marginTop: 2 }}>Mumbai West Zone</div>
            </div>
          </div>
          <div
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              background: 'rgba(0,128,67,0.12)',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              color: '#008043',
            }}
          >
            {t('profile.bandPartner')}
          </div>
        </div>

        {/* Language Settings */}
        <div style={sectionTitle}>{t('profile.language')}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setLang('en')}
            style={{
              flex: 1,
              padding: '12px',
              background: lang === 'en' ? '#D9008D' : '#443152',
              color: lang === 'en' ? '#FFFFFF' : '#A7A1B2',
              border: lang === 'en' ? '1px solid #D9008D' : '1px solid #352D42',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            English
          </button>
          <button
            onClick={() => setLang('hi')}
            style={{
              flex: 1,
              padding: '12px',
              background: lang === 'hi' ? '#D9008D' : '#443152',
              color: lang === 'hi' ? '#FFFFFF' : '#A7A1B2',
              border: lang === 'hi' ? '1px solid #D9008D' : '1px solid #352D42',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {'\u0939\u093F\u0902\u0926\u0940'}
          </button>
        </div>

        {/* Notification Settings */}
        <div style={sectionTitle}>{t('profile.notifications')}</div>
        {toggleRow(t('profile.taskAlerts'), taskAlerts, setTaskAlerts)}
        {toggleRow(t('profile.slaWarnings'), slaWarnings, setSlaWarnings)}
        {toggleRow(t('profile.settlementUpdates'), settlementUpdates, setSettlementUpdates)}

        {/* Account Info */}
        <div style={sectionTitle}>{t('profile.accountInfo')}</div>
        <div style={{
          background: '#443152',
          borderRadius: 12,
          padding: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #352D42' }}>
            <span style={{ fontSize: 13, color: '#A7A1B2' }}>{t('profile.cspId')}</span>
            <span style={{ fontSize: 13, color: '#FAF9FC' }}>CSP-MH-1001</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #352D42' }}>
            <span style={{ fontSize: 13, color: '#A7A1B2' }}>{t('profile.zone')}</span>
            <span style={{ fontSize: 13, color: '#FAF9FC' }}>Mumbai West</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #352D42' }}>
            <span style={{ fontSize: 13, color: '#A7A1B2' }}>{t('profile.partnerSince')}</span>
            <span style={{ fontSize: 13, color: '#FAF9FC' }}>Nov 2025</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #352D42' }}>
            <span style={{ fontSize: 13, color: '#A7A1B2' }}>{t('profile.email')}</span>
            <span style={{ fontSize: 13, color: '#FAF9FC' }}>csp.mh1001@wiom.in</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: 13, color: '#A7A1B2' }}>{t('profile.phone')}</span>
            <span style={{ fontSize: 13, color: '#FAF9FC' }}>+91 98XXX XXXXX</span>
          </div>
        </div>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
