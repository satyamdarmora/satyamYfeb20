'use client';

import { useState, useEffect } from 'react';
import type { SupportCase } from '@/lib/types';

interface SupportHubProps {
  onBack: () => void;
}

type FlowStep = 'list' | 'create_case' | 'create_receipt' | 'case_detail';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusStyle(status: SupportCase['status']): { color: string; bg: string } {
  switch (status) {
    case 'OPEN':
      return { color: '#FF8000', bg: 'rgba(255,128,0,0.12)' };
    case 'IN_PROGRESS':
      return { color: '#D9008D', bg: 'rgba(217,0,141,0.12)' };
    case 'RESOLVED':
      return { color: '#008043', bg: 'rgba(0,128,67,0.12)' };
    case 'CLOSED':
      return { color: '#665E75', bg: 'rgba(92,111,130,0.12)' };
  }
}

export default function SupportHub({ onBack }: SupportHubProps) {
  const [step, setStep] = useState<FlowStep>('list');
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<SupportCase | null>(null);
  const [replyText, setReplyText] = useState('');

  // Submitted case ID for receipt
  const [submittedCaseId, setSubmittedCaseId] = useState('');

  // Create case form
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [linkedTaskId, setLinkedTaskId] = useState('');

  // Fetch cases from API on mount
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch('/api/support');
        const data = await res.json();
        if (Array.isArray(data)) setCases(data);
      } catch {}
    };
    fetchCases();
  }, []);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 900,
    background: '#161021',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'slideUpIn 0.25s ease',
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

  const btnPrimary: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    background: '#D9008D',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: '#352D42',
    border: '1px solid #352D42',
    borderRadius: 10,
    color: '#FAF9FC',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const backBtn = (target: FlowStep = 'list') => (
    <button
      onClick={() => setStep(target)}
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
      &larr; Back
    </button>
  );

  // List
  if (step === 'list') {
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
            &larr; Back
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>Support Cases</div>
            <button
              onClick={() => { setStep('create_case'); setSubject(''); setDescription(''); setLinkedTaskId(''); }}
              style={{
                padding: '8px 16px',
                background: '#D9008D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Create Case
            </button>
          </div>
        </div>

        <div style={scrollStyle}>
          {cases.length === 0 && (
            <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 14, color: '#665E75' }}>
              No support cases
            </div>
          )}

          {cases.map((c) => {
            const statusStyle = getStatusStyle(c.status);
            return (
              <button
                key={c.case_id}
                onClick={() => { setSelectedCase(c); setReplyText(''); setStep('case_detail'); }}
                style={{
                  width: '100%',
                  background: '#443152',
                  border: '1px solid #352D42',
                  borderRadius: 10,
                  padding: '14px 16px',
                  marginBottom: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#A7A1B2' }}>{c.case_id}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: statusStyle.color,
                      background: statusStyle.bg,
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#FAF9FC', marginBottom: 4 }}>
                  {c.subject}
                </div>
                <div style={{ fontSize: 11, color: '#665E75' }}>
                  Updated {formatDate(c.updated_at)}
                  {c.linked_task_id && <span> &middot; Linked: {c.linked_task_id}</span>}
                </div>
              </button>
            );
          })}

          <div style={{ height: 40 }} />
        </div>
      </div>
    );
  }

  // Create case
  if (step === 'create_case') {
    const canSubmit = subject.trim().length > 0 && description.trim().length > 0;
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          {backBtn('list')}
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>Create Support Case</div>
        </div>
        <div style={scrollStyle}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#A7A1B2', display: 'block', marginBottom: 6 }}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of the issue"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#A7A1B2', display: 'block', marginBottom: 6 }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about your issue..."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, color: '#A7A1B2', display: 'block', marginBottom: 6 }}>
              Linked Task ID (optional)
            </label>
            <input
              type="text"
              value={linkedTaskId}
              onChange={(e) => setLinkedTaskId(e.target.value)}
              placeholder="TSK-XXXX"
              style={inputStyle}
            />
          </div>
          <button
            onClick={async () => {
              if (canSubmit) {
                try {
                  const res = await fetch('/api/support', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      subject: subject.trim(),
                      description: description.trim(),
                      linked_task_id: linkedTaskId.trim() || undefined,
                    }),
                  });
                  const data = await res.json();
                  if (data.ok && data.case) {
                    setCases([...cases, data.case]);
                    setSubmittedCaseId(data.case.case_id);
                  } else {
                    // Fallback: generate local ID
                    setSubmittedCaseId(`SUP-${Date.now().toString().slice(-4)}`);
                  }
                } catch {
                  setSubmittedCaseId(`SUP-${Date.now().toString().slice(-4)}`);
                }
                setStep('create_receipt');
              }
            }}
            style={{ ...btnPrimary, opacity: canSubmit ? 1 : 0.4 }}
          >
            Submit Case
          </button>
        </div>
      </div>
    );
  }

  // Create receipt
  if (step === 'create_receipt') {
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>Case Submitted</div>
        </div>
        <div style={{ ...scrollStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,128,67,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 28, color: '#008043' }}>&#10003;</span>
          </div>
          <div style={{ fontSize: 14, color: '#A7A1B2', marginBottom: 8 }}>Case ID</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#FAF9FC', marginBottom: 16 }}>
            {submittedCaseId}
          </div>
          <div style={{ fontSize: 14, color: '#A7A1B2', textAlign: 'center', lineHeight: 1.6, marginBottom: 32, maxWidth: 300 }}>
            Your support case has been submitted. Expect a response within 24 hours.
          </div>
          <button
            onClick={() => { setStep('list'); setSubmittedCaseId(''); }}
            style={{ ...btnPrimary, maxWidth: 300 }}
          >
            Back to Support
          </button>
        </div>
      </div>
    );
  }

  // Case detail
  if (step === 'case_detail' && selectedCase) {
    const statusStyle = getStatusStyle(selectedCase.status);

    const sendReply = async () => {
      if (!replyText.trim()) return;
      try {
        const res = await fetch(`/api/support/${selectedCase.case_id}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: replyText.trim(), sender: 'CSP-MH-1001' }),
        });
        const data = await res.json();
        if (data.ok && data.case) {
          setSelectedCase(data.case);
          setCases(cases.map((c) => (c.case_id === selectedCase.case_id ? data.case : c)));
        } else {
          // Fallback: update locally
          const now = new Date().toISOString();
          const updatedCase = {
            ...selectedCase,
            updated_at: now,
            messages: [
              ...selectedCase.messages,
              { sender: 'CSP-MH-1001', text: replyText.trim(), timestamp: now },
            ],
          };
          setSelectedCase(updatedCase);
          setCases(cases.map((c) => (c.case_id === selectedCase.case_id ? updatedCase : c)));
        }
      } catch {
        const now = new Date().toISOString();
        const updatedCase = {
          ...selectedCase,
          updated_at: now,
          messages: [
            ...selectedCase.messages,
            { sender: 'CSP-MH-1001', text: replyText.trim(), timestamp: now },
          ],
        };
        setSelectedCase(updatedCase);
        setCases(cases.map((c) => (c.case_id === selectedCase.case_id ? updatedCase : c)));
      }
      setReplyText('');
    };

    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          {backBtn('list')}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FAF9FC' }}>{selectedCase.case_id}</div>
              <div style={{ fontSize: 13, color: '#A7A1B2', marginTop: 2 }}>{selectedCase.subject}</div>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: statusStyle.color,
                background: statusStyle.bg,
                padding: '4px 10px',
                borderRadius: 4,
              }}
            >
              {selectedCase.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div style={scrollStyle}>
          {/* Messages */}
          {selectedCase.messages.map((msg, i) => {
            const isCSP = msg.sender.startsWith('CSP');
            return (
              <div
                key={i}
                style={{
                  marginBottom: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isCSP ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    background: isCSP ? '#665E75' : '#443152',
                    borderRadius: 12,
                    padding: '12px 14px',
                    maxWidth: '85%',
                    border: '1px solid #352D42',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: isCSP ? '#D9008D' : '#FF8000', marginBottom: 4 }}>
                    {msg.sender}
                  </div>
                  <div style={{ fontSize: 13, color: '#FAF9FC', lineHeight: 1.5 }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: 10, color: '#665E75', marginTop: 4 }}>
                    {formatDate(msg.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #352D42', flexShrink: 0, background: '#161021' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type a reply..."
              style={{ ...inputStyle, flex: 1 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendReply();
              }}
            />
            <button
              onClick={sendReply}
              style={{
                padding: '10px 20px',
                background: '#D9008D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
