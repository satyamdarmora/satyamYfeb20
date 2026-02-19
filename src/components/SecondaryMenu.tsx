'use client';

import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

interface SecondaryMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
}

interface MenuItem {
  id: string;
  icon: string;
  labelKey: string;
  descKey: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'wallet',   icon: '\u20B9', labelKey: 'menu.wallet',   descKey: 'menu.walletDesc' },
  { id: 'team',     icon: '\u2694', labelKey: 'menu.team',     descKey: 'menu.teamDesc' },
  { id: 'netbox',   icon: '\u2750', labelKey: 'menu.netbox',   descKey: 'menu.netboxDesc' },
  { id: 'support',  icon: '\u2709', labelKey: 'menu.support',  descKey: 'menu.supportDesc' },
  { id: 'policies', icon: '\u2637', labelKey: 'menu.policies', descKey: 'menu.policiesDesc' },
  { id: 'profile',  icon: '\u2699', labelKey: 'menu.profile',  descKey: 'menu.profileDesc' },
];

export default function SecondaryMenu({ isOpen, onClose, onNavigate }: SecondaryMenuProps) {
  const { t } = useI18n();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Inject keyframes for slide animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
          }}
        >
          {/* Overlay */}
          <div
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--overlay-bg)',
              animation: 'fadeInOverlay 0.2s ease',
            }}
          />

          {/* Side drawer (slides from right) */}
          <div
            style={{
              position: 'relative',
              width: '80%',
              maxWidth: 320,
              height: '100%',
              marginLeft: 'auto',
              background: 'var(--bg-secondary)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideInRight 0.25s ease',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 20px 16px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {t('menu.title')}
              </h3>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: 20,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  lineHeight: 1,
                }}
              >
                x
              </button>
            </div>

            {/* Menu items */}
            <div
              style={{
                padding: '8px 0',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    width: '100%',
                    padding: '14px 20px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  {/* Icon circle */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      color: 'var(--text-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        lineHeight: 1.3,
                      }}
                    >
                      {t(item.labelKey)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        lineHeight: 1.4,
                        marginTop: 2,
                      }}
                    >
                      {t(item.descKey)}
                    </div>
                  </div>

                  {/* Chevron */}
                  <div style={{ color: 'var(--text-muted)', fontSize: 16, flexShrink: 0 }}>
                    {'\u203A'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
