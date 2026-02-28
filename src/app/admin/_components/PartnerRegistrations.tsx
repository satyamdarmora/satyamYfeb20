'use client';

import React, { useState } from 'react';
import { formatTimestamp, BACKEND_URL } from './AdminTypes';
import type { BackendRegistration, InfoExchangeData } from './AdminTypes';

interface PartnerRegistrationsProps {
  registrations: BackendRegistration[];
  expandedRegId: number | null;
  setExpandedRegId: (id: number | null) => void;
  onReview: (modal: { id: number; regId: string; action: 'APPROVE' | 'REJECT' | 'INFO_REQUIRED' }) => void;
  onTraining: (regId: number, registrationId: string, action: 'COMPLETE' | 'FAIL') => void;
}

export function PartnerRegistrations({
  registrations,
  expandedRegId,
  setExpandedRegId,
  onReview,
  onTraining,
}: PartnerRegistrationsProps) {
  const needsAttention = registrations.filter((r) => {
    const last = r.infoExchanges?.length ? r.infoExchanges[r.infoExchanges.length - 1] : null;
    return r.status === 'INFO_REQUIRED' && last?.sender === 'PARTNER';
  }).length;

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 32,
      }}
    >
      {/* Pulse animation for badge */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: 0,
            color: 'var(--text-primary)',
          }}
        >
          Partner Registrations
        </h2>
        {needsAttention > 0 && (
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: 12,
            color: '#FFF',
            background: 'var(--positive)',
            animation: 'pulse 2s infinite',
          }}>
            {needsAttention} response{needsAttention > 1 ? 's' : ''} pending review
          </span>
        )}
      </div>

      {registrations.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
          No registrations yet. New partner registrations will appear here.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['ID', 'Business Name', 'Mobile', 'Location', 'Status', 'Fee', 'Submitted', 'Actions'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => {
                const isExpReg = expandedRegId === reg.id;
                const statusColor = reg.status === 'APPROVED' ? 'var(--positive)' : reg.status === 'REJECTED' ? 'var(--negative)' : reg.status === 'INFO_REQUIRED' ? 'var(--brand-primary)' : 'var(--warning)';
                const statusBg = reg.status === 'APPROVED' ? 'rgba(0,128,67,0.1)' : reg.status === 'REJECTED' ? 'rgba(224,30,0,0.1)' : reg.status === 'INFO_REQUIRED' ? 'rgba(217,0,141,0.1)' : 'rgba(255,128,0,0.1)';
                const feeLabel = reg.feeRefunded ? 'Refunded' : reg.feePaid ? 'Paid' : 'Unpaid';
                const feeColor = reg.feeRefunded ? 'var(--brand-primary)' : reg.feePaid ? 'var(--positive)' : 'var(--text-muted)';
                const partnerStatus = reg.partner?.status;
                // Check if partner has responded and admin hasn't acted yet
                const lastExchange = reg.infoExchanges?.length ? reg.infoExchanges[reg.infoExchanges.length - 1] : null;
                const hasNewResponse = reg.status === 'INFO_REQUIRED' && lastExchange?.sender === 'PARTNER';
                const docCount = reg.infoExchanges?.reduce((n, ex) => n + (ex.documents?.length || 0), 0) || 0;
                return (
                  <tr key={reg.id} style={{ verticalAlign: 'top' }}>
                    <td colSpan={8} style={{ padding: 0 }}>
                      {/* Main row */}
                      <div
                        onClick={() => setExpandedRegId(isExpReg ? null : reg.id)}
                        style={{ display: 'grid', gridTemplateColumns: 'minmax(90px,0.8fr) 1.2fr 100px 1.2fr 110px 80px 100px minmax(180px,1.5fr)', cursor: 'pointer', borderBottom: isExpReg ? 'none' : '1px solid var(--bg-card)', borderLeft: hasNewResponse ? '3px solid var(--positive)' : '3px solid transparent' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card-hover)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = hasNewResponse ? 'rgba(0,128,67,0.04)' : 'transparent'; }}
                      >
                        <div style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{reg.registrationId}</div>
                        <div style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>{reg.businessName}</div>
                        <div style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 12 }}>{reg.mobile}</div>
                        <div style={{ padding: '10px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{reg.area}, {reg.city}</div>
                        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6, color: statusColor, background: statusBg, width: 'fit-content' }}>{reg.status.replace('_', ' ')}</span>
                          {hasNewResponse && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, color: '#FFF', background: 'var(--positive)', width: 'fit-content', animation: 'pulse 2s infinite' }}>
                              RESPONSE RECEIVED
                            </span>
                          )}
                          {docCount > 0 && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>
                              {docCount} doc{docCount > 1 ? 's' : ''} uploaded
                            </span>
                          )}
                        </div>
                        <div style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: feeColor }}>{feeLabel}</div>
                        <div style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatTimestamp(reg.submittedAt)}</div>
                        <div style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          {(reg.status === 'PENDING' || reg.status === 'INFO_REQUIRED') ? (
                            <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => reg.feePaid && onReview({ id: reg.id, regId: reg.registrationId, action: 'APPROVE' })} disabled={!reg.feePaid} title={!reg.feePaid ? 'Fee not paid yet' : ''} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, background: 'var(--positive)', color: '#FFF', border: 'none', borderRadius: 5, cursor: reg.feePaid ? 'pointer' : 'not-allowed', opacity: reg.feePaid ? 1 : 0.4 }}>Approve</button>
                              <button onClick={() => onReview({ id: reg.id, regId: reg.registrationId, action: 'REJECT' })} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, background: 'transparent', color: 'var(--negative)', border: '1px solid var(--negative)', borderRadius: 5, cursor: 'pointer' }}>Reject</button>
                              <button onClick={() => reg.feePaid && onReview({ id: reg.id, regId: reg.registrationId, action: 'INFO_REQUIRED' })} disabled={!reg.feePaid} title={!reg.feePaid ? 'Fee not paid yet' : ''} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, background: 'transparent', color: 'var(--brand-primary)', border: '1px solid var(--brand-primary)', borderRadius: 5, cursor: reg.feePaid ? 'pointer' : 'not-allowed', opacity: reg.feePaid ? 1 : 0.4 }}>Info</button>
                            </div>
                          ) : reg.status === 'APPROVED' && partnerStatus === 'TRAINING' ? (
                            <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => onTraining(reg.id, reg.registrationId, 'COMPLETE')} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, background: 'var(--positive)', color: '#FFF', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Complete Training</button>
                              <button onClick={() => onTraining(reg.id, reg.registrationId, 'FAIL')} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, background: 'transparent', color: 'var(--negative)', border: '1px solid var(--negative)', borderRadius: 5, cursor: 'pointer' }}>Fail</button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {partnerStatus ? <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, color: partnerStatus === 'ACTIVE' ? 'var(--positive)' : partnerStatus === 'TRAINING_FAILED' ? 'var(--negative)' : 'var(--text-muted)', background: partnerStatus === 'ACTIVE' ? 'rgba(0,128,67,0.1)' : partnerStatus === 'TRAINING_FAILED' ? 'rgba(224,30,0,0.1)' : 'transparent' }}>{partnerStatus.replace('_', ' ')}</span> : reg.reviewedAt ? formatTimestamp(reg.reviewedAt) : '\u2014'}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Expanded detail */}
                      {isExpReg && (
                        <div style={{ padding: '16px 20px 20px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px 24px', fontSize: 12, marginBottom: reg.adminNotes || reg.partnerResponse || reg.reviewReason ? 16 : 0 }}>
                            <div><span style={{ color: 'var(--text-muted)' }}>Entity Type: </span><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{reg.entityType}</span></div>
                            <div><span style={{ color: 'var(--text-muted)' }}>State: </span><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{reg.state}</span></div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Pincode: </span><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{reg.pincode}</span></div>
                            {reg.address && <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--text-muted)' }}>Address: </span><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{reg.address}</span></div>}
                            {reg.latitude != null && reg.longitude != null && (
                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>GPS: </span>
                                <a href={`https://maps.google.com/?q=${reg.latitude},${reg.longitude}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-primary)', fontWeight: 500, fontFamily: 'monospace', fontSize: 11, textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                                  {reg.latitude.toFixed(6)}, {reg.longitude.toFixed(6)} ↗
                                </a>
                              </div>
                            )}
                            <div><span style={{ color: 'var(--text-muted)' }}>PAN: </span><span style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'monospace' }}>{reg.panNumber}</span></div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Aadhaar: </span><span style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'monospace' }}>{reg.aadhaarNumber}</span></div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Bank: </span><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{reg.bankName}</span></div>
                            <div><span style={{ color: 'var(--text-muted)' }}>A/C Name: </span><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{reg.bankAccountName}</span></div>
                            <div><span style={{ color: 'var(--text-muted)' }}>A/C No: </span><span style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'monospace' }}>{reg.bankAccountNumber}</span></div>
                            <div><span style={{ color: 'var(--text-muted)' }}>IFSC: </span><span style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'monospace' }}>{reg.bankIfsc}</span></div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Fee: </span><span style={{ color: feeColor, fontWeight: 600 }}>{'\u20B9'}{reg.registrationFee} {feeLabel}</span></div>
                            {reg.payments?.[0] && (
                              <div><span style={{ color: 'var(--text-muted)' }}>Txn: </span><span style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'monospace', fontSize: 11 }}>{reg.payments[0].transactionId || 'N/A'}</span> <span style={{ fontSize: 11, fontWeight: 600, color: reg.payments[0].status === 'SUCCESS' ? 'var(--positive)' : reg.payments[0].status === 'FAILED' ? 'var(--negative)' : 'var(--warning)' }}>{reg.payments[0].status}</span></div>
                            )}
                          </div>
                          {/* Security Deposit & Device Batch Config */}
                          {reg.status === 'APPROVED' && reg.partner && (
                            <BatchSizeConfig regId={reg.id} partner={reg.partner} />
                          )}
                          {/* Info Exchange History */}
                          {reg.infoExchanges && reg.infoExchanges.length > 0 ? (
                            <div style={{ marginTop: 4 }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.3 }}>
                                Info Request History ({reg.infoExchanges.length} messages)
                              </div>
                              {reg.infoExchanges.map((ex: InfoExchangeData) => (
                                <div
                                  key={ex.id}
                                  style={{
                                    marginBottom: 10,
                                    padding: '10px 14px',
                                    borderRadius: 8,
                                    fontSize: 13,
                                    background: ex.sender === 'ADMIN' ? 'rgba(217,0,141,0.06)' : 'rgba(0,128,67,0.06)',
                                    border: `1px solid ${ex.sender === 'ADMIN' ? 'rgba(217,0,141,0.15)' : 'rgba(0,128,67,0.15)'}`,
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: ex.sender === 'ADMIN' ? 'var(--brand-primary)' : 'var(--positive)' }}>
                                      {ex.sender === 'ADMIN' ? 'Admin Request' : 'Partner Response'}
                                    </span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTimestamp(ex.createdAt)}</span>
                                  </div>
                                  {ex.message && <div style={{ color: 'var(--text-primary)', marginBottom: 6 }}>{ex.message}</div>}
                                  {/* Requested document types */}
                                  {ex.sender === 'ADMIN' && ex.requestedDocs && ex.requestedDocs.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                      {ex.requestedDocs.map((doc: string) => (
                                        <span key={doc} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(217,0,141,0.1)', color: 'var(--brand-primary)' }}>
                                          {doc.replace(/_/g, ' ')}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {/* Uploaded documents */}
                                  {ex.sender === 'PARTNER' && ex.documents && ex.documents.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                                      {ex.documents.map((doc) => (
                                        <button
                                          key={doc.id}
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              const res = await fetch(`/api/backend/v1/partner/documents/${doc.storedName}`);
                                              if (!res.ok) throw new Error('Download failed');
                                              const blob = await res.blob();
                                              const url = URL.createObjectURL(blob);
                                              const a = document.createElement('a');
                                              a.href = url;
                                              a.download = doc.originalName;
                                              document.body.appendChild(a);
                                              a.click();
                                              document.body.removeChild(a);
                                              URL.revokeObjectURL(url);
                                            } catch {
                                              // Fallback: open direct backend URL
                                              window.open(`/api/backend/v1/partner/documents/${doc.storedName}`, '_blank');
                                            }
                                          }}
                                          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--brand-primary)', textDecoration: 'none', padding: '6px 10px', borderRadius: 4, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left' }}
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                          <span style={{ fontWeight: 600 }}>{doc.documentType.replace(/_/g, ' ')}</span>
                                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                                          <span style={{ color: 'var(--text-secondary)' }}>{doc.originalName}</span>
                                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({(doc.sizeBytes / 1024).toFixed(0)} KB)</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <>
                              {reg.reviewReason && (
                                <div style={{ marginBottom: 10, padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 8, fontSize: 13 }}>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Review Reason</div>
                                  <div style={{ color: 'var(--text-primary)' }}>{reg.reviewReason}</div>
                                </div>
                              )}
                              {reg.adminNotes && (
                                <div style={{ marginBottom: 10, padding: '10px 14px', background: 'rgba(217,0,141,0.06)', border: '1px solid rgba(217,0,141,0.15)', borderRadius: 8, fontSize: 13 }}>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: 4 }}>Admin Notes (Info Requested)</div>
                                  <div style={{ color: 'var(--text-primary)' }}>{reg.adminNotes}</div>
                                </div>
                              )}
                              {reg.partnerResponse && (
                                <div style={{ padding: '10px 14px', background: 'rgba(0,128,67,0.06)', border: '1px solid rgba(0,128,67,0.15)', borderRadius: 8, fontSize: 13 }}>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--positive)', textTransform: 'uppercase', marginBottom: 4 }}>Partner Response</div>
                                  <div style={{ color: 'var(--text-primary)' }}>{reg.partnerResponse}</div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BatchSizeConfig({ regId, partner }: { regId: number; partner: NonNullable<BackendRegistration['partner']> }) {
  const [batchSize, setBatchSize] = useState(5);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${BACKEND_URL}/v1/partner/registrations/${regId}/batch-size`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    setSaving(false);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginTop: 12, padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 8, fontSize: 13 }}>
      <div>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Security Deposit: </span>
        <span style={{ fontWeight: 600, color: partner.status === 'ACTIVE' ? 'var(--positive)' : 'var(--warning)' }}>
          {'\u20B9'}20,000 — Pending
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>First Batch Devices: </span>
        <select
          value={batchSize}
          onChange={(e) => setBatchSize(Number(e.target.value))}
          style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}
        >
          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <button
          onClick={(e) => { e.stopPropagation(); handleSave(); }}
          disabled={saving}
          style={{ padding: '4px 12px', fontSize: 11, fontWeight: 600, background: saved ? 'var(--positive)' : 'var(--brand-primary)', color: '#FFF', border: 'none', borderRadius: 5, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
        >
          {saved ? 'Saved!' : saving ? '...' : 'Set'}
        </button>
      </div>
    </div>
  );
}
