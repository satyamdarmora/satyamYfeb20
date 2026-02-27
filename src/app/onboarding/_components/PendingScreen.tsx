'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentScreen, type RegistrationResult } from './PaymentScreen';

type FullStatus = 'PENDING' | 'INFO_REQUIRED' | 'APPROVED' | 'REJECTED';
type PartnerLevelStatus = 'TRAINING' | 'ACTIVE' | 'TRAINING_FAILED' | null;

interface InfoDoc {
  id: number;
  documentType: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
}

interface InfoExchange {
  id: number;
  sender: 'ADMIN' | 'PARTNER';
  message: string | null;
  requestedDocs: string[] | null;
  createdAt: string;
  documents: InfoDoc[];
}

interface StatusData {
  status: FullStatus;
  partnerStatus: PartnerLevelStatus;
  adminNotes?: string;
  partnerResponse?: string;
  reviewReason?: string;
  rejectionReason?: string;
  feePaid?: boolean;
  feeRefunded?: boolean;
  infoExchanges?: InfoExchange[];
}

const BACKEND_URL = '/api/backend';

const DOC_TYPE_LABELS: Record<string, string> = {
  PAN_CARD: 'PAN Card',
  AADHAAR_CARD: 'Aadhaar Card',
  ADDRESS_PROOF: 'Address Proof',
  BANK_STATEMENT: 'Bank Statement',
  BUSINESS_LICENSE: 'Business License',
  CANCELLED_CHEQUE: 'Cancelled Cheque',
  OTHER: 'Other',
};

/** Polls backend for status changes — handles all workflow states */
export function PendingScreen({ businessName }: { businessName?: string }) {
  const router = useRouter();
  const [statusData, setStatusData] = useState<StatusData>({ status: 'PENDING', partnerStatus: null });
  const [checking, setChecking] = useState(false);
  const [infoResponse, setInfoResponse] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [unpaidRegistration, setUnpaidRegistration] = useState<RegistrationResult | null>(null);
  const [uploadFiles, setUploadFiles] = useState<Record<string, File | null>>({});

  useEffect(() => {
    const token = localStorage.getItem('wiom_token');
    if (!token || token === 'undefined') return;

    let cancelled = false;

    const checkStatus = async () => {
      try {
        setChecking(true);
        const res = await fetch(`${BACKEND_URL}/v1/partner/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data;
        if (cancelled) return;

        if (data) {
          // If registration exists but fee not paid, show payment screen
          if (data.isRegistered && data.feePaid === false && data.status === 'PENDING' && data.registrationId) {
            setUnpaidRegistration({
              registrationId: data.registrationId,
              businessName: businessName || 'Your Business',
              registrationFee: data.registrationFee || 2000,
            });
            return;
          }

          setStatusData({
            status: data.status,
            partnerStatus: data.partnerStatus || null,
            adminNotes: data.adminNotes,
            partnerResponse: data.partnerResponse,
            reviewReason: data.reviewReason,
            rejectionReason: data.rejectionReason,
            feePaid: data.feePaid,
            feeRefunded: data.feeRefunded,
            infoExchanges: data.infoExchanges || [],
          });
          // Auto-redirect to dashboard if partner is ACTIVE
          if (data.partnerStatus === 'ACTIVE') {
            localStorage.setItem('wiom_profile_complete', 'true');
            setTimeout(() => router.replace('/'), 1500);
          }
        }
      } catch {
        // backend unreachable, keep polling
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [router]);

  const handleSubmitResponse = async () => {
    const token = localStorage.getItem('wiom_token');
    if (!token) return;

    const hasFiles = Object.values(uploadFiles).some((f) => f !== null);
    if (!infoResponse.trim() && !hasFiles) return;

    setSubmittingResponse(true);
    try {
      const formData = new FormData();
      if (infoResponse.trim()) {
        formData.append('response', infoResponse.trim());
      }

      // Append files and their document types
      const docTypes: string[] = [];
      Object.entries(uploadFiles).forEach(([docType, file]) => {
        if (file) {
          formData.append('documents', file);
          docTypes.push(docType);
        }
      });
      formData.append('documentTypes', JSON.stringify(docTypes));

      await fetch(`${BACKEND_URL}/v1/partner/respond`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        // Do NOT set Content-Type — browser sets it with boundary for FormData
        body: formData,
      });

      setInfoResponse('');
      setUploadFiles({});
      setStatusData((prev) => ({ ...prev, status: 'PENDING', partnerResponse: infoResponse.trim() }));
    } catch {
      // silently fail, user can retry
    } finally {
      setSubmittingResponse(false);
    }
  };

  const containerStyle: React.CSSProperties = { minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' };
  const cardStyle: React.CSSProperties = { width: '100%', maxWidth: 420, textAlign: 'center' };

  const { status, partnerStatus, infoExchanges } = statusData;

  // Extract latest admin request's requested docs
  const latestAdminExchange = infoExchanges
    ?.filter((ex) => ex.sender === 'ADMIN')
    .slice(-1)[0];
  const requestedDocTypes: string[] = (latestAdminExchange?.requestedDocs as string[]) || [];

  // UNPAID — show payment screen
  if (unpaidRegistration) {
    return (
      <PaymentScreen
        registration={unpaidRegistration}
        onPaymentComplete={() => {
          setUnpaidRegistration(null);
          setStatusData((prev) => ({ ...prev, feePaid: true }));
        }}
      />
    );
  }

  // ACTIVE — redirect happening
  if (partnerStatus === 'ACTIVE') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0, 179, 89, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--positive)" strokeWidth="2"/><path d="M8 12l3 3 5-5" stroke="var(--positive)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>You{'\u2019'}re All Set!</h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.5 }}>Training complete. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // TRAINING — partner created, waiting for admin to mark training
  if (status === 'APPROVED' && partnerStatus === 'TRAINING') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(147, 51, 234, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#9333ea" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="#9333ea" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>Registration Approved!</h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.5 }}>
            You are now in the <strong>training phase</strong>. Complete your training to start receiving tasks and earning.
          </p>
          {statusData.reviewReason && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '16px 20px', textAlign: 'left', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Admin Note</div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>{statusData.reviewReason}</div>
            </div>
          )}
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '20px 24px', textAlign: 'left', marginBottom: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.3 }}>Training Progress</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--positive)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Registration Approved</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{'\u20B9'}2,000 registration fee paid</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#9333ea', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>2</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Training In Progress</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Admin will mark completion once training is done.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-secondary)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>3</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Start Earning</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Access your CSP dashboard and start receiving tasks.</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{checking ? 'Checking status...' : 'Auto-checking every 5 seconds'}</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 24 }}>Wiom CSP Partner Portal</p>
          <button onClick={() => router.push('/logout')} style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Logout</button>
        </div>
      </div>
    );
  }

  // TRAINING_FAILED
  if (partnerStatus === 'TRAINING_FAILED') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(224, 30, 0, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--negative)" strokeWidth="2"/><path d="M15 9l-6 6M9 9l6 6" stroke="var(--negative)" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>Training Not Completed</h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.5 }}>
            Unfortunately, your training was not completed successfully. Please contact support for further assistance.
          </p>
          <div style={{ background: 'rgba(224, 30, 0, 0.06)', border: '1px solid rgba(224, 30, 0, 0.15)', borderRadius: 12, padding: '14px 18px', fontSize: 14, color: 'var(--text-secondary)', textAlign: 'left', lineHeight: 1.5 }}>
            Registration fee of {'\u20B9'}2,000 is <strong>not refundable</strong> for training failure.
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 32 }}>Wiom CSP Partner Portal</p>
          <button onClick={() => router.push('/logout')} style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Logout</button>
        </div>
      </div>
    );
  }

  // REJECTED
  if (status === 'REJECTED') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(224, 30, 0, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--negative)" strokeWidth="2"/><path d="M15 9l-6 6M9 9l6 6" stroke="var(--negative)" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>Registration Rejected</h1>
          {(statusData.reviewReason || statusData.rejectionReason) && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '14px 18px', textAlign: 'left', marginBottom: 20, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Reason</div>
              {statusData.reviewReason || statusData.rejectionReason}
            </div>
          )}
          <div style={{ background: 'rgba(0,128,67,0.06)', border: '1px solid rgba(0,128,67,0.15)', borderRadius: 12, padding: '14px 18px', fontSize: 14, color: 'var(--positive)', textAlign: 'left', marginBottom: 32, lineHeight: 1.5 }}>
            {'\u20B9'}2,000 registration fee will be refunded to your bank account.
          </div>
          <button
            onClick={() => router.push('/onboarding')}
            style={{ width: '100%', padding: '14px', background: 'var(--brand-primary)', color: '#FFFFFF', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            Register Again
          </button>
        </div>
      </div>
    );
  }

  // INFO_REQUIRED — partner needs to respond
  if (status === 'INFO_REQUIRED') {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, maxWidth: 480 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(217, 0, 141, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--brand-primary)" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="var(--brand-primary)" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>More Information Needed</h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.5 }}>
            The admin team needs additional information before approving your registration.
          </p>

          {/* Exchange history */}
          {infoExchanges && infoExchanges.length > 0 && (
            <div style={{ textAlign: 'left', marginBottom: 24 }}>
              {infoExchanges.length > 1 && (
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.3 }}>
                  Conversation History
                </div>
              )}
              {infoExchanges.map((ex) => (
                <div
                  key={ex.id}
                  style={{
                    marginBottom: 10,
                    padding: '12px 16px',
                    borderRadius: 10,
                    fontSize: 14,
                    background: ex.sender === 'ADMIN' ? 'rgba(217,0,141,0.06)' : 'rgba(0,128,67,0.06)',
                    border: `1px solid ${ex.sender === 'ADMIN' ? 'rgba(217,0,141,0.15)' : 'rgba(0,128,67,0.15)'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: ex.sender === 'ADMIN' ? 'var(--brand-primary)' : 'var(--positive)' }}>
                      {ex.sender === 'ADMIN' ? 'Admin' : 'You'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(ex.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {ex.message && <div style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>{ex.message}</div>}
                  {/* Requested doc types */}
                  {ex.sender === 'ADMIN' && ex.requestedDocs && ex.requestedDocs.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {ex.requestedDocs.map((doc: string) => (
                        <span key={doc} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 5, background: 'rgba(217,0,141,0.1)', color: 'var(--brand-primary)' }}>
                          {DOC_TYPE_LABELS[doc] || doc.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Uploaded documents */}
                  {ex.sender === 'PARTNER' && ex.documents && ex.documents.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                      {ex.documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={`${BACKEND_URL}/v1/partner/documents/${doc.storedName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--positive)', textDecoration: 'none', padding: '4px 8px', borderRadius: 4, background: 'var(--bg-card)' }}
                        >
                          <span>{DOC_TYPE_LABELS[doc.documentType] || doc.documentType.replace(/_/g, ' ')}</span>
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{doc.originalName}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Document upload section */}
          {requestedDocTypes.length > 0 && (
            <div style={{ textAlign: 'left', marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                Upload Requested Documents
              </label>
              {requestedDocTypes.map((docType: string) => (
                <div key={docType} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1, fontWeight: 500 }}>
                    {DOC_TYPE_LABELS[docType] || docType.replace(/_/g, ' ')}
                  </span>
                  {uploadFiles[docType] ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--positive)', fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {uploadFiles[docType]!.name}
                      </span>
                      <button
                        onClick={() => setUploadFiles((prev) => ({ ...prev, [docType]: null }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--negative)', fontSize: 14, fontWeight: 700, padding: '2px 6px' }}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <label style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: 'var(--brand-primary)', color: '#FFF', borderRadius: 6, cursor: 'pointer' }}>
                      Choose File
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadFiles((prev) => ({ ...prev, [docType]: file }));
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Text response */}
          <div style={{ textAlign: 'left', marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.3 }}>Your Response</label>
            <textarea
              value={infoResponse}
              onChange={(e) => setInfoResponse(e.target.value)}
              placeholder="Provide any additional information..."
              rows={4}
              style={{ width: '100%', padding: '14px 16px', fontSize: 15, color: 'var(--text-primary)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={handleSubmitResponse}
            disabled={(!infoResponse.trim() && !Object.values(uploadFiles).some((f) => f !== null)) || submittingResponse}
            style={{
              width: '100%',
              padding: '14px',
              background: (infoResponse.trim() || Object.values(uploadFiles).some((f) => f !== null)) ? 'var(--brand-primary)' : 'var(--bg-secondary)',
              color: (infoResponse.trim() || Object.values(uploadFiles).some((f) => f !== null)) ? '#FFFFFF' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: (infoResponse.trim() || Object.values(uploadFiles).some((f) => f !== null)) && !submittingResponse ? 'pointer' : 'default',
              opacity: submittingResponse ? 0.7 : 1,
            }}
          >
            {submittingResponse ? 'Submitting...' : 'Submit Response'}
          </button>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 24 }}>Wiom CSP Partner Portal</p>
          <button onClick={() => router.push('/logout')} style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Logout</button>
        </div>
      </div>
    );
  }

  // PENDING (default)
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255, 128, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--warning)" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          {businessName ? 'Registration Submitted' : 'Registration Pending'}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.5 }}>
          {businessName
            ? <><strong>{businessName}</strong> has been registered successfully. Your application is now pending admin approval.</>
            : 'Your partner registration is under review. Our team will verify your details and notify you once approved.'}
        </p>
        {statusData.feePaid && (
          <div style={{ background: 'rgba(0,128,67,0.06)', border: '1px solid rgba(0,128,67,0.15)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: 'var(--positive)', marginBottom: 24, fontWeight: 500 }}>
            {'\u20B9'}2,000 registration fee paid
          </div>
        )}
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '20px 24px', textAlign: 'left', marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.3 }}>What happens next</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--warning)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>1</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Admin Review</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Our team is reviewing your documents and details.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-secondary)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>2</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Training</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Once approved, you{'\u2019'}ll enter the training phase.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-secondary)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>3</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Start Earning</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Complete training and start receiving tasks.</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {checking ? 'Checking status...' : 'Auto-checking every 5 seconds'}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 24 }}>Wiom CSP Partner Portal</p>
        <button onClick={() => router.push('/logout')} style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Logout</button>
      </div>
    </div>
  );
}
