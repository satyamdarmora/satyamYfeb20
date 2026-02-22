'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, isAuthenticated } from '@/lib/auth';
import {
  registerPartner,
  type RegisterPartnerData,
  isValidAadhaar,
  isValidPan,
  isValidIfsc,
  isValidPincode,
  isValidAccountNumber,
} from '@/lib/onboarding';
import { PaymentScreen, type RegistrationResult } from './PaymentScreen';
import { PendingScreen } from './PendingScreen';

type EntityType = 'INDIVIDUAL' | 'FIRM' | 'COMPANY';

interface FieldErrors {
  [key: string]: string | null;
}

const BACKEND_URL = '/api/backend';

export function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const [initialCheck, setInitialCheck] = useState(true);

  // On mount: verify auth and check if already registered
  useEffect(() => {
    const token = localStorage.getItem('wiom_token');
    if (!token || token === 'undefined') {
      localStorage.removeItem('wiom_token');
      localStorage.removeItem('wiom_user');
      router.replace('/login');
      return;
    }
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    // If we already have a status param, skip the check
    if (statusParam) {
      setInitialCheck(false);
      return;
    }

    // Check registration status before showing form
    fetch(`${BACKEND_URL}/v1/partner/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        const d = json?.data;
        if (!d?.isRegistered) {
          setInitialCheck(false); // Show form
          return;
        }
        if (d.partnerStatus === 'ACTIVE') {
          localStorage.setItem('wiom_profile_complete', 'true');
          router.replace('/');
        } else if (d.feePaid === false) {
          router.replace('/onboarding?status=payment');
        } else {
          const s = (d.partnerStatus === 'TRAINING' || d.partnerStatus === 'TRAINING_FAILED')
            ? 'training'
            : (d.status?.toLowerCase() || 'pending');
          router.replace(`/onboarding?status=${s}`);
        }
      })
      .catch(() => setInitialCheck(false));
  }, [router, statusParam]);

  // Form state — all hooks MUST be before any conditional returns
  const [businessName, setBusinessName] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('INDIVIDUAL');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null);

  // Show loading while checking initial status
  if (initialCheck && !statusParam) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--bg-card)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Show polling status screen for any non-form status
  if (statusParam === 'pending' || statusParam === 'rejected' || statusParam === 'info_required' || statusParam === 'training' || statusParam === 'payment') {
    return <PendingScreen />;
  }

  const fillSampleData = () => {
    setBusinessName('Sharma Telecom Services');
    setEntityType('FIRM');
    setState('Maharashtra');
    setCity('Mumbai');
    setArea('Andheri West');
    setPincode('400058');
    setAadhaarNumber('234567890123');
    setPanNumber('ABCDE1234F');
    setBankAccountName('Rajesh Sharma');
    setBankAccountNumber('1234567890123');
    setBankIfsc('SBIN0001234');
    setBankName('State Bank of India');
    setTermsAccepted(true);
    setErrors({});
    setSubmitError(null);
  };

  const setFieldError = (field: string, error: string | null) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const clearFieldError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // Inline validation on blur
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'businessName':
        setFieldError(field, value.trim() ? null : 'Business name is required.');
        break;
      case 'state':
        setFieldError(field, value.trim() ? null : 'State is required.');
        break;
      case 'city':
        setFieldError(field, value.trim() ? null : 'City is required.');
        break;
      case 'area':
        setFieldError(field, value.trim() ? null : 'Area is required.');
        break;
      case 'pincode':
        if (!value.trim()) setFieldError(field, 'Pincode is required.');
        else if (!isValidPincode(value)) setFieldError(field, 'Please enter a valid 6-digit pincode.');
        else setFieldError(field, null);
        break;
      case 'aadhaarNumber':
        if (!value.trim()) setFieldError(field, 'Aadhaar number is required.');
        else if (!isValidAadhaar(value)) setFieldError(field, 'Please enter a valid 12-digit Aadhaar number.');
        else setFieldError(field, null);
        break;
      case 'panNumber':
        if (!value.trim()) setFieldError(field, 'PAN number is required.');
        else if (!isValidPan(value)) setFieldError(field, 'Please enter a valid PAN number (e.g. ABCDE1234F).');
        else setFieldError(field, null);
        break;
      case 'bankAccountName':
        setFieldError(field, value.trim() ? null : 'Account holder name is required.');
        break;
      case 'bankAccountNumber':
        if (!value.trim()) setFieldError(field, 'Account number is required.');
        else if (!isValidAccountNumber(value)) setFieldError(field, 'Please enter a valid account number (9-18 digits).');
        else setFieldError(field, null);
        break;
      case 'bankIfsc':
        if (!value.trim()) setFieldError(field, 'IFSC code is required.');
        else if (!isValidIfsc(value)) setFieldError(field, 'Please enter a valid 11-character IFSC code.');
        else setFieldError(field, null);
        break;
      case 'bankName':
        setFieldError(field, value.trim() ? null : 'Bank name is required.');
        break;
    }
  };

  const validateAll = (): boolean => {
    const newErrors: FieldErrors = {};
    if (!businessName.trim()) newErrors.businessName = 'Business name is required.';
    if (!state.trim()) newErrors.state = 'State is required.';
    if (!city.trim()) newErrors.city = 'City is required.';
    if (!area.trim()) newErrors.area = 'Area is required.';
    if (!pincode.trim()) newErrors.pincode = 'Pincode is required.';
    else if (!isValidPincode(pincode)) newErrors.pincode = 'Please enter a valid 6-digit pincode.';
    if (!aadhaarNumber.trim()) newErrors.aadhaarNumber = 'Aadhaar number is required.';
    else if (!isValidAadhaar(aadhaarNumber)) newErrors.aadhaarNumber = 'Please enter a valid 12-digit Aadhaar number.';
    if (!panNumber.trim()) newErrors.panNumber = 'PAN number is required.';
    else if (!isValidPan(panNumber)) newErrors.panNumber = 'Please enter a valid PAN number (e.g. ABCDE1234F).';
    if (!bankAccountName.trim()) newErrors.bankAccountName = 'Account holder name is required.';
    if (!bankAccountNumber.trim()) newErrors.bankAccountNumber = 'Account number is required.';
    else if (!isValidAccountNumber(bankAccountNumber)) newErrors.bankAccountNumber = 'Please enter a valid account number (9-18 digits).';
    if (!bankIfsc.trim()) newErrors.bankIfsc = 'IFSC code is required.';
    else if (!isValidIfsc(bankIfsc)) newErrors.bankIfsc = 'Please enter a valid 11-character IFSC code.';
    if (!bankName.trim()) newErrors.bankName = 'Bank name is required.';
    if (!termsAccepted) newErrors.termsAccepted = 'Please accept the terms of partnership.';

    setErrors(newErrors);
    return Object.values(newErrors).every((e) => e === null || e === undefined);
  };

  const handleSubmit = async () => {
    if (!validateAll()) return;

    const auth = getAuth();
    if (!auth) {
      router.replace('/login');
      return;
    }

    setSubmitError(null);
    setLoading(true);

    const data: RegisterPartnerData = {
      businessName: businessName.trim(),
      entityType,
      state: state.trim(),
      city: city.trim(),
      area: area.trim(),
      pincode: pincode.trim(),
      aadhaarNumber: aadhaarNumber.trim(),
      panNumber: panNumber.trim().toUpperCase(),
      bankAccountName: bankAccountName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankIfsc: bankIfsc.trim().toUpperCase(),
      bankName: bankName.trim(),
      termsAccepted: true,
    };

    try {
      const result = await registerPartner(data, auth.token);
      setRegistrationResult({
        registrationId: result.registrationId,
        businessName: result.businessName || businessName.trim(),
        registrationFee: result.registrationFee || 2000,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Shared styles
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 8,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: 15,
    color: 'var(--text-primary)',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 12,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const inputErrorStyle: React.CSSProperties = {
    ...inputStyle,
    borderColor: 'var(--negative)',
  };

  const errorTextStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--negative)',
    marginTop: 6,
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: '1px solid var(--border-subtle)',
  };

  const fieldGroup: React.CSSProperties = {
    marginBottom: 16,
  };

  const renderField = (
    label: string,
    field: string,
    value: string,
    onChange: (v: string) => void,
    opts?: {
      placeholder?: string;
      inputMode?: 'text' | 'numeric';
      maxLength?: number;
      filter?: (v: string) => string;
    }
  ) => (
    <div style={fieldGroup}>
      <label style={labelStyle}>{label}</label>
      <input
        type="text"
        inputMode={opts?.inputMode || 'text'}
        maxLength={opts?.maxLength}
        value={value}
        onChange={(e) => {
          const val = opts?.filter ? opts.filter(e.target.value) : e.target.value;
          onChange(val);
          clearFieldError(field);
          setSubmitError(null);
        }}
        onBlur={() => validateField(field, value)}
        placeholder={opts?.placeholder}
        style={errors[field] ? inputErrorStyle : inputStyle}
      />
      {errors[field] && <div style={errorTextStyle}>{errors[field]}</div>}
    </div>
  );

  const digitsOnly = (v: string) => v.replace(/\D/g, '');
  const alphanumOnly = (v: string) => v.replace(/[^a-zA-Z0-9]/g, '');

  if (registrationSuccess) {
    return <PendingScreen businessName={registrationSuccess} />;
  }

  if (registrationResult) {
    return (
      <PaymentScreen
        registration={registrationResult}
        onPaymentComplete={() => {
          setRegistrationSuccess(registrationResult.businessName);
          setRegistrationResult(null);
        }}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px 48px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: '0 0 6px',
                }}
              >
                Partner Registration
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Complete your registration to access the CSP dashboard.
              </p>
            </div>
            <button
              onClick={fillSampleData}
              style={{
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Fill Sample Data
            </button>
          </div>
        </div>

        {/* Submit error */}
        {submitError && (
          <div
            style={{
              background: 'rgba(224, 30, 0, 0.1)',
              border: '1px solid rgba(224, 30, 0, 0.3)',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 20,
              fontSize: 13,
              color: 'var(--negative)',
            }}
          >
            {submitError}
          </div>
        )}

        {/* Section 1: Business Information */}
        <div style={{ marginBottom: 28 }}>
          <div style={sectionHeaderStyle}>Business Information</div>
          {renderField('Business / Entity Name', 'businessName', businessName, setBusinessName, {
            placeholder: 'Registered business name',
          })}
          <div style={fieldGroup}>
            <label style={labelStyle}>Entity Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['INDIVIDUAL', 'FIRM', 'COMPANY'] as EntityType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setEntityType(type)}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: entityType === type ? '#FFFFFF' : 'var(--text-secondary)',
                    background: entityType === type ? 'var(--brand-primary)' : 'var(--bg-card)',
                    border: `1px solid ${entityType === type ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                    borderRadius: 10,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Service Location */}
        <div style={{ marginBottom: 28 }}>
          <div style={sectionHeaderStyle}>Service Location</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              {renderField('State', 'state', state, setState, { placeholder: 'State' })}
            </div>
            <div style={{ flex: 1 }}>
              {renderField('City', 'city', city, setCity, { placeholder: 'City' })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              {renderField('Area / Zone', 'area', area, setArea, { placeholder: 'Area or service zone' })}
            </div>
            <div style={{ flex: 1 }}>
              {renderField('Pincode', 'pincode', pincode, setPincode, {
                placeholder: '6-digit pincode',
                inputMode: 'numeric',
                maxLength: 6,
                filter: digitsOnly,
              })}
            </div>
          </div>
        </div>

        {/* Section 3: Identity Verification */}
        <div style={{ marginBottom: 28 }}>
          <div style={sectionHeaderStyle}>Identity Verification</div>
          {renderField('Aadhaar Number', 'aadhaarNumber', aadhaarNumber, setAadhaarNumber, {
            placeholder: '12-digit Aadhaar number',
            inputMode: 'numeric',
            maxLength: 12,
            filter: digitsOnly,
          })}
          {renderField('PAN Number', 'panNumber', panNumber, setPanNumber, {
            placeholder: 'ABCDE1234F',
            maxLength: 10,
            filter: alphanumOnly,
          })}
        </div>

        {/* Section 4: Bank Details */}
        <div style={{ marginBottom: 28 }}>
          <div style={sectionHeaderStyle}>Bank Details</div>
          {renderField('Account Holder Name', 'bankAccountName', bankAccountName, setBankAccountName, {
            placeholder: 'Name as on bank account',
          })}
          {renderField('Account Number', 'bankAccountNumber', bankAccountNumber, setBankAccountNumber, {
            placeholder: 'Bank account number',
            inputMode: 'numeric',
            maxLength: 18,
            filter: digitsOnly,
          })}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              {renderField('IFSC Code', 'bankIfsc', bankIfsc, setBankIfsc, {
                placeholder: 'SBIN0001234',
                maxLength: 11,
                filter: alphanumOnly,
              })}
            </div>
            <div style={{ flex: 1 }}>
              {renderField('Bank Name', 'bankName', bankName, setBankName, {
                placeholder: 'Bank name',
              })}
            </div>
          </div>
        </div>

        {/* Section 5: Agreement */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '16px',
              background: 'var(--bg-card)',
              borderRadius: 12,
              border: errors.termsAccepted
                ? '1px solid var(--negative)'
                : '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
            onClick={() => {
              setTermsAccepted(!termsAccepted);
              clearFieldError('termsAccepted');
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                border: `2px solid ${termsAccepted ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                background: termsAccepted ? 'var(--brand-primary)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              {termsAccepted && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              I accept the terms of partnership
            </span>
          </div>
          {errors.termsAccepted && <div style={errorTextStyle}>{errors.termsAccepted}</div>}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            background: 'var(--brand-primary)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Submitting...' : 'Submit Registration'}
        </button>

        <p
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: 24,
          }}
        >
          Wiom CSP Partner Portal
        </p>
      </div>
    </div>
  );
}
