'use client';

import React from 'react';

interface ReviewModalProps {
  reviewModal: { id: number; regId: string; action: 'APPROVE' | 'REJECT' | 'INFO_REQUIRED' };
  reviewReason: string;
  setReviewReason: (r: string) => void;
  reviewLoading: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

export function ReviewModal({
  reviewModal,
  reviewReason,
  setReviewReason,
  reviewLoading,
  onSubmit,
  onClose,
}: ReviewModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
          {reviewModal.action === 'APPROVE' ? 'Approve Registration' : reviewModal.action === 'REJECT' ? 'Reject Registration' : 'Request More Info'}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>{reviewModal.regId}</p>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.3 }}>
          {reviewModal.action === 'APPROVE' ? 'Reason for approval' : reviewModal.action === 'REJECT' ? 'Reason for rejection' : 'What info do you need?'}
        </label>
        <textarea
          value={reviewReason}
          onChange={(e) => setReviewReason(e.target.value)}
          placeholder={reviewModal.action === 'APPROVE' ? 'Documents verified, all checks passed...' : reviewModal.action === 'REJECT' ? 'Incomplete documentation, invalid PAN...' : 'Please provide proof of address...'}
          rows={4}
          style={{ width: '100%', padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 10, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onSubmit} disabled={!reviewReason.trim() || reviewLoading} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, background: reviewModal.action === 'APPROVE' ? 'var(--positive)' : reviewModal.action === 'REJECT' ? 'var(--negative)' : 'var(--brand-primary)', color: '#FFFFFF', border: 'none', borderRadius: 8, cursor: reviewReason.trim() && !reviewLoading ? 'pointer' : 'default', opacity: !reviewReason.trim() || reviewLoading ? 0.5 : 1 }}>
            {reviewLoading ? 'Submitting...' : reviewModal.action === 'APPROVE' ? 'Approve' : reviewModal.action === 'REJECT' ? 'Reject' : 'Request Info'}
          </button>
        </div>
      </div>
    </div>
  );
}
