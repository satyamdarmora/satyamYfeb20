'use client';

import { useEffect, useRef, useCallback } from 'react';
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
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  // --- Swipe-to-dismiss (same pattern as DrillDown) --------------------------

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || !sheetRef.current) return;
    currentYRef.current = e.touches[0].clientY;
    const diff = currentYRef.current - startYRef.current;
    if (diff > 0) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current || !sheetRef.current) return;
    isDraggingRef.current = false;
    const diff = currentYRef.current - startYRef.current;
    if (diff > 100) {
      onClose();
    }
    sheetRef.current.style.transform = '';
  }, [onClose]);

  // --- Lock body scroll ------------------------------------------------------

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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
        }}
      />

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          maxHeight: '80vh',
          background: '#352D42',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s ease',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 10,
            paddingBottom: 4,
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: '#665E75',
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 20px 16px',
            borderBottom: '1px solid #352D42',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: '#FAF9FC',
            }}
          >
            {t('menu.title')}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#A7A1B2',
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
                (e.currentTarget as HTMLButtonElement).style.background = '#443152';
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
                  background: '#443152',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  color: '#A7A1B2',
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
                    color: '#FAF9FC',
                    lineHeight: 1.3,
                  }}
                >
                  {t(item.labelKey)}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#665E75',
                    lineHeight: 1.4,
                    marginTop: 2,
                  }}
                >
                  {t(item.descKey)}
                </div>
              </div>

              {/* Chevron */}
              <div style={{ color: '#665E75', fontSize: 16, flexShrink: 0 }}>
                {'\u203A'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
