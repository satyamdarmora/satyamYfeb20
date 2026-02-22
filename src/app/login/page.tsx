'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { sendOTP, verifyOTP, saveAuth, isAuthenticated } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [tmpToken, setTmpToken] = useState<string | null>(null);
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // If already logged in, check registration status and route
  useEffect(() => {
    if (!isAuthenticated()) return;
    const token = localStorage.getItem('wiom_token');
    if (!token || token === 'undefined') {
      localStorage.removeItem('wiom_token');
      localStorage.removeItem('wiom_user');
      return;
    }

    // If returning from JusPay payment, go straight to onboarding
    if (localStorage.getItem('wiom_pending_payment')) {
      router.replace('/onboarding?status=payment');
      return;
    }

    // Check registration status to route correctly
    fetch('/api/backend/v1/partner/status', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        const d = json?.data;
        if (!d?.isRegistered) {
          router.replace('/onboarding');
        } else if (d.feePaid === false) {
          router.replace('/onboarding?status=payment');
        } else if (d.partnerStatus === 'ACTIVE') {
          localStorage.setItem('wiom_profile_complete', 'true');
          router.replace('/');
        } else if (d.status === 'PENDING') {
          router.replace('/onboarding?status=pending');
        } else {
          router.replace('/onboarding?status=' + (d.status?.toLowerCase() || 'pending'));
        }
      })
      .catch(() => router.replace('/'));
  }, [router]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  const handleSendOTP = useCallback(async () => {
    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const token = await sendOTP(mobile);
      setTmpToken(token);
      setStep('otp');
      setResendTimer(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  }, [mobile]);

  const handleResendOTP = useCallback(async () => {
    if (resendTimer > 0) return;
    setError(null);
    setLoading(true);
    try {
      const token = await sendOTP(mobile);
      setTmpToken(token);
      setResendTimer(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  }, [mobile, resendTimer]);

  const handleVerifyOTP = useCallback(async () => {
    if (otp.length !== 4) {
      setError('Please enter the 4-digit OTP.');
      return;
    }
    if (!tmpToken) {
      setError('Session expired. Please request OTP again.');
      setStep('mobile');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await verifyOTP(otp, mobile, tmpToken);
      saveAuth(token, user);

      // Check registration status from our backend
      try {
        const statusRes = await fetch('/api/backend/v1/partner/status', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statusJson = await statusRes.json();
        const regStatus = statusJson?.data;

        if (!regStatus?.isRegistered) {
          router.push('/onboarding');
        } else if (regStatus.partnerStatus === 'ACTIVE') {
          router.push('/');
        } else if (regStatus.partnerStatus === 'TRAINING') {
          router.push('/onboarding?status=training');
        } else if (regStatus.partnerStatus === 'TRAINING_FAILED') {
          router.push('/onboarding?status=training');
        } else if (regStatus.status === 'APPROVED') {
          router.push('/onboarding?status=training');
        } else if (regStatus.status === 'INFO_REQUIRED') {
          router.push('/onboarding?status=info_required');
        } else if (regStatus.status === 'REJECTED') {
          router.push('/onboarding?status=rejected');
        } else if (regStatus.status === 'PENDING') {
          router.push('/onboarding?status=pending');
        } else {
          router.push('/onboarding');
        }
      } catch {
        // Backend unreachable — fall back to onboarding
        router.push('/onboarding');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  }, [otp, mobile, tmpToken, router]);

  const handleMobileKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && mobile.length === 10) handleSendOTP();
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && otp.length === 4) handleVerifyOTP();
  };

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
        {/* Logo */}
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
            Wiom CSP
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            {step === 'mobile'
              ? 'Enter your mobile number to login'
              : `OTP sent to +91 ${mobile}`}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: 'rgba(224, 30, 0, 0.1)',
              border: '1px solid rgba(224, 30, 0, 0.3)',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 20,
              fontSize: 13,
              color: 'var(--negative)',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {step === 'mobile' ? (
          /* Step 1: Mobile Number */
          <>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                }}
              >
                Mobile Number
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    padding: '14px 12px',
                    fontSize: 16,
                    color: 'var(--text-secondary)',
                    borderRight: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)',
                    fontWeight: 500,
                  }}
                >
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setMobile(val);
                    setError(null);
                  }}
                  onKeyDown={handleMobileKeyDown}
                  placeholder="9876543210"
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    fontSize: 16,
                    color: 'var(--text-primary)',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    letterSpacing: 1,
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading || mobile.length !== 10}
              style={{
                width: '100%',
                padding: '14px',
                background:
                  mobile.length === 10
                    ? 'var(--brand-primary)'
                    : 'var(--bg-secondary)',
                color:
                  mobile.length === 10 ? '#FFFFFF' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: mobile.length === 10 ? 'pointer' : 'default',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </>
        ) : (
          /* Step 2: OTP Verification */
          <>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                }}
              >
                Enter OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setOtp(val);
                  setError(null);
                }}
                onKeyDown={handleOtpKeyDown}
                placeholder="----"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: 24,
                  color: 'var(--text-primary)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  outline: 'none',
                  textAlign: 'center',
                  letterSpacing: 12,
                  fontWeight: 700,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 4}
              style={{
                width: '100%',
                padding: '14px',
                background:
                  otp.length === 4
                    ? 'var(--brand-primary)'
                    : 'var(--bg-secondary)',
                color: otp.length === 4 ? '#FFFFFF' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: otp.length === 4 ? 'pointer' : 'default',
                opacity: loading ? 0.7 : 1,
                marginBottom: 16,
              }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button
                onClick={() => {
                  setStep('mobile');
                  setOtp('');
                  setTmpToken(null);
                  setError(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: 500,
                  padding: '4px 0',
                }}
              >
                &larr; Change Number
              </button>

              <button
                onClick={handleResendOTP}
                disabled={resendTimer > 0 || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color:
                    resendTimer > 0
                      ? 'var(--text-muted)'
                      : 'var(--brand-primary)',
                  fontSize: 13,
                  cursor: resendTimer > 0 ? 'default' : 'pointer',
                  fontWeight: 600,
                  padding: '4px 0',
                }}
              >
                {resendTimer > 0
                  ? `Resend in ${resendTimer}s`
                  : 'Resend OTP'}
              </button>
            </div>
          </>
        )}

        <p
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: 32,
          }}
        >
          Wiom CSP Partner Portal
        </p>
      </div>
    </div>
  );
}
