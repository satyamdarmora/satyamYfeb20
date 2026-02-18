'use client';

import { useEffect } from 'react';
import type { AppNotification } from '@/lib/types';

interface EventModalProps {
  notification: AppNotification | null;
  onDismiss: () => void;
}

/** Accent colours keyed by notification type */
const ACCENT: Record<string, string> = {
  PAYMENT_RECEIVED: '#4CAF50',
  SETTLEMENT_CREDIT: '#4CAF50',
  NEW_OFFER: '#D9008D',
  HIGH_RESTORE_ALERT: '#E01E00',
  SLA_WARNING: '#FF8000',
  GENERAL: '#A7A1B2',
};

function getAccent(type: string): string {
  return ACCENT[type] ?? ACCENT.GENERAL;
}

export default function EventModal({ notification, onDismiss }: EventModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (notification) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [notification]);

  if (!notification) return null;

  const accent = getAccent(notification.type);
  const hasTask = !!notification.task_id;

  // Build headline text based on type
  let headline = notification.title;
  let subtext = notification.message;

  switch (notification.type) {
    case 'PAYMENT_RECEIVED':
      headline = notification.amount
        ? `Payment of \u20B9${notification.amount.toLocaleString('en-IN')} received`
        : 'Payment received';
      break;
    case 'SETTLEMENT_CREDIT':
      headline = notification.amount
        ? `Settlement of \u20B9${notification.amount.toLocaleString('en-IN')} credited`
        : 'Settlement credited';
      break;
    case 'NEW_OFFER':
      headline = 'New install offer available';
      break;
    case 'HIGH_RESTORE_ALERT':
      headline = 'HIGH priority restore alert';
      break;
    case 'SLA_WARNING':
      headline = notification.title || 'SLA Warning';
      break;
    default:
      break;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Dark overlay */}
      <div
        onClick={onDismiss}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
        }}
      />

      {/* Modal card */}
      <div
        style={{
          position: 'relative',
          width: '90%',
          maxWidth: 380,
          background: '#352D42',
          borderRadius: 16,
          border: `1px solid ${accent}44`,
          overflow: 'hidden',
          animation: 'eventModalIn 0.25s ease forwards',
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 4, background: accent }} />

        {/* Body */}
        <div style={{ padding: '24px 20px 20px' }}>
          {/* Icon area */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `${accent}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              marginBottom: 16,
              color: accent,
              fontWeight: 700,
            }}
          >
            {notification.type === 'PAYMENT_RECEIVED' || notification.type === 'SETTLEMENT_CREDIT'
              ? '\u20B9'
              : notification.type === 'NEW_OFFER'
                ? '\u002B'
                : notification.type === 'HIGH_RESTORE_ALERT'
                  ? '!'
                  : notification.type === 'SLA_WARNING'
                    ? '\u26A0'
                    : '\u2139'}
          </div>

          {/* Headline */}
          <h3
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: '#FAF9FC',
              lineHeight: 1.3,
            }}
          >
            {headline}
          </h3>

          {/* Amount callout for payment types */}
          {notification.amount != null &&
            (notification.type === 'PAYMENT_RECEIVED' || notification.type === 'SETTLEMENT_CREDIT') && (
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: accent,
                  margin: '12px 0',
                }}
              >
                {'\u20B9'}{notification.amount.toLocaleString('en-IN')}
              </div>
            )}

          {/* Sub-text */}
          <p
            style={{
              margin: '10px 0 0',
              fontSize: 13,
              color: '#A7A1B2',
              lineHeight: 1.5,
            }}
          >
            {subtext}
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '0 20px 20px',
          }}
        >
          <button
            onClick={onDismiss}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 10,
              border: '1px solid #352D42',
              background: 'transparent',
              color: '#A7A1B2',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>

          {(hasTask || notification.type === 'NEW_OFFER') && (
            <button
              onClick={onDismiss}
              style={{
                flex: 1,
                padding: '12px 0',
                borderRadius: 10,
                border: 'none',
                background: accent,
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View
            </button>
          )}
        </div>
      </div>

      {/* Keyframe animation injected via style tag */}
      <style>{`
        @keyframes eventModalIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
