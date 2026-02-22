'use client';

import { useState, useEffect } from 'react';

export interface RegistrationResult {
  registrationId: number;
  businessName: string;
  registrationFee: number;
}

const BACKEND_URL = '/api/backend';

/** Payment screen — contextual to Wiom CSP with reassuring microcopy */
export function PaymentScreen({ registration, onPaymentComplete }: {
  registration: RegistrationResult;
  onPaymentComplete: () => void;
}) {
  const [paymentState, setPaymentState] = useState<'ready' | 'processing' | 'verifying' | 'success' | 'failed'>('ready');
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const containerStyle: React.CSSProperties = { minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' };
  const cardStyle: React.CSSProperties = { width: '100%', maxWidth: 420, textAlign: 'center' };

  // On mount, check if returning from JusPay payment
  useEffect(() => {
    const saved = localStorage.getItem('wiom_pending_payment');
    if (saved) {
      try {
        const { transactionId: savedTxn, paymentLink: savedLink } = JSON.parse(saved);
        if (savedTxn) {
          setTransactionId(savedTxn);
          setPaymentLink(savedLink || null);
          setPaymentState('verifying');
        }
      } catch { /* ignore */ }
    }
  }, []);

  const handleInitiatePayment = async () => {
    const token = localStorage.getItem('wiom_token');
    if (!token) return;

    setError(null);
    setPaymentState('processing');

    try {
      const res = await fetch(`${BACKEND_URL}/v1/payment/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ registrationId: registration.registrationId }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || json?.msg || 'Payment initiation failed');
      }

      const data = json?.data;
      if (data?.paymentLink) {
        setPaymentLink(data.paymentLink);
        setTransactionId(data.transactionId);

        // Save to sessionStorage so we can resume after returning from JusPay
        localStorage.setItem('wiom_pending_payment', JSON.stringify({
          transactionId: data.transactionId,
          paymentLink: data.paymentLink,
          registrationId: registration.registrationId,
        }));

        // Navigate to JusPay — on mobile, window.open often fails or gets blocked.
        // Using location.href is reliable. User returns to our app after payment.
        window.location.href = data.paymentLink;
      } else {
        throw new Error('No payment link received. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setPaymentState('ready');
    }
  };

  // Poll for payment status when verifying
  useEffect(() => {
    if (paymentState !== 'verifying' || !transactionId) return;

    const token = localStorage.getItem('wiom_token');
    if (!token) return;

    let cancelled = false;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/v1/payment/status/${transactionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        const data = json?.data;

        if (cancelled) return;

        if (data?.feePaid || data?.status === 'SUCCESS') {
          localStorage.removeItem('wiom_pending_payment');
          setPaymentState('success');
          setTimeout(onPaymentComplete, 2000);
          return;
        }

        attempts++;
        if (attempts >= 60) {
          setPaymentState('failed');
          setError('Payment verification timed out. If you completed the payment, it will be updated shortly.');
        }
      } catch {
        // Keep polling on network errors
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [paymentState, transactionId, onPaymentComplete]);

  // SUCCESS state
  if (paymentState === 'success') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0, 179, 89, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--positive)" strokeWidth="2"/><path d="M8 12l3 3 5-5" stroke="var(--positive)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>Payment Successful</h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
            Your registration fee has been received. Moving to the review stage now...
          </p>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Redirecting...</div>
        </div>
      </div>
    );
  }

  // VERIFYING state — waiting for payment confirmation
  if (paymentState === 'verifying') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(217, 0, 141, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--bg-card)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>Verifying Your Payment</h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.5 }}>
            Checking your payment status. This usually takes a few seconds.
          </p>

          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Amount</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{'\u20B9'}{registration.registrationFee.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>For</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{registration.businessName}</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 128, 0, 0.06)', border: '1px solid rgba(255, 128, 0, 0.15)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20, textAlign: 'left' }}>
            Don{'\u2019'}t close this page. We{'\u2019'}re checking every few seconds.
          </div>

          {paymentLink && (
            <button
              onClick={() => { window.location.href = paymentLink; }}
              style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, color: 'var(--brand-primary)', cursor: 'pointer' }}
            >
              Retry Payment
            </button>
          )}

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 24 }}>Wiom CSP Partner Portal</p>
        </div>
      </div>
    );
  }

  // READY / FAILED state — main payment screen
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(217, 0, 141, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="5" width="20" height="14" rx="3" stroke="var(--brand-primary)" strokeWidth="1.8"/>
            <path d="M2 10h20" stroke="var(--brand-primary)" strokeWidth="1.8"/>
            <circle cx="7" cy="15" r="1.5" fill="var(--brand-primary)"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>Registration Fee</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.5 }}>
          One-time fee to activate your CSP partnership with Wiom. This covers your onboarding and training.
        </p>

        {/* Fee breakdown card */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '20px 24px', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>CSP Registration Fee</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>For {registration.businessName}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
              {'\u20B9'}{registration.registrationFee.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Onboarding & Training</span>
              <span>Included</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>CSP Dashboard Access</span>
              <span>Included</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
              <span>Business Support</span>
              <span>Included</span>
            </div>
          </div>
        </div>

        {/* Trust signals */}
        <div style={{ background: 'rgba(0, 179, 89, 0.06)', border: '1px solid rgba(0, 179, 89, 0.12)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><path d="M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z" stroke="var(--positive)" strokeWidth="1.2" fill="rgba(0,179,89,0.1)"/><path d="M5.5 8L7 9.5L10.5 6" stroke="var(--positive)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>Secure payment via JusPay. Your card details are never stored with us.</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="8" cy="8" r="6.5" stroke="var(--positive)" strokeWidth="1.2"/><path d="M8 5v3l2 1" stroke="var(--positive)" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>Full refund if your registration is not approved.</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(224, 30, 0, 0.08)', border: '1px solid rgba(224, 30, 0, 0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--negative)', textAlign: 'left', lineHeight: 1.4 }}>
            {error}
          </div>
        )}

        {/* Pay button */}
        <button
          onClick={handleInitiatePayment}
          disabled={paymentState === 'processing'}
          style={{
            width: '100%',
            padding: '16px',
            background: 'var(--brand-primary)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: paymentState === 'processing' ? 'default' : 'pointer',
            opacity: paymentState === 'processing' ? 0.7 : 1,
            marginBottom: 12,
          }}
        >
          {paymentState === 'processing' ? 'Setting up payment...' : `Pay \u20B9${registration.registrationFee.toLocaleString('en-IN')}`}
        </button>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 24px' }}>
          You{'\u2019'}ll be redirected to a secure payment page. Come back here after paying.
        </p>

        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Wiom CSP Partner Portal</p>
      </div>
    </div>
  );
}
