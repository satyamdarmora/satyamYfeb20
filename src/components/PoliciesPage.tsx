'use client';

import { useState } from 'react';

interface PoliciesPageProps {
  onBack: () => void;
}

type FlowStep = 'list' | 'policy_detail' | 'changelog';

interface PolicyItem {
  id: string;
  title: string;
  description: string;
  lastUpdated: string;
  content: string;
}

interface ChangeLogEntry {
  date: string;
  title: string;
  description: string;
}

const POLICIES: PolicyItem[] = [
  {
    id: 'POL-001',
    title: 'SLA Policy',
    description: 'Service level agreement terms and compliance requirements',
    lastUpdated: '2026-01-15',
    content: `SLA Policy for Channel Service Partners (CSPs)

1. RESTORE SLA
   - HIGH Priority: 75 minutes from alert to resolution
   - NORMAL Priority: 4 hours from alert to resolution
   - Compliance measured per billing cycle
   - 3 consecutive SLA misses trigger exposure review

2. INSTALL SLA
   - Offer acceptance: 45 minutes from offer
   - Claim acceptance: 15 minutes from claim
   - Installation completion: 48 hours from acceptance
   - Activation verification: 24 hours from installation

3. NETBOX RETURN SLA
   - Pickup from customer: 24 hours from notification
   - Return to warehouse: 48 hours from collection
   - Lost device declaration: 72 hours from assignment

4. COMPLIANCE TIERS
   - Compliant: 95%+ SLA adherence
   - At Risk: 85-95% SLA adherence
   - Non-Compliant: Below 85% SLA adherence

5. PENALTIES
   - Non-compliance affects settlement calculations
   - Repeated violations may result in territory reduction
   - Severe violations may trigger partner review`,
  },
  {
    id: 'POL-002',
    title: 'NetBox Return Policy',
    description: 'Guidelines for NetBox device pickup and return procedures',
    lastUpdated: '2026-01-10',
    content: `NetBox Return Policy

1. PICKUP PROCEDURES
   - Contact customer within 2 hours of assignment
   - Schedule pickup within 24 hours
   - Take selfie proof at customer premises
   - Verify device serial number matches records

2. RETURN PROCEDURES
   - Return collected devices to nearest Wiom warehouse
   - Return must happen within 48 hours of collection
   - Obtain warehouse receipt as proof of return
   - Upload all proofs to the task

3. LOST / DAMAGED DEVICES
   - Report within 24 hours of discovery
   - Provide detailed incident report
   - Lost device charges: Rs. 2,500 per unit
   - Damaged device charges: Rs. 1,000 per unit

4. EXCEPTIONS
   - Customer not available: Reschedule within 12 hours
   - Device not found at premises: Escalate to support
   - Access issues: Document and escalate`,
  },
  {
    id: 'POL-003',
    title: 'Commission Structure',
    description: 'Earnings, bonuses, and settlement calculation details',
    lastUpdated: '2026-02-01',
    content: `Commission Structure for CSPs

1. BASE COMMISSION
   - Per active connection: Rs. 150/month
   - Calculated on last day of billing cycle
   - Pro-rated for mid-cycle activations/churns

2. INSTALLATION BONUS
   - Standard install: Rs. 100 per successful activation
   - Batch bonus: Rs. 500 for 5+ installs in a week
   - First-time area bonus: Rs. 200 for new coverage areas

3. RESTORE BONUS
   - SLA-compliant resolution: Rs. 50 per task
   - Perfect month (100% SLA): Rs. 750 bonus
   - High-priority resolution under 30 min: Rs. 100

4. SETTLEMENT SCHEDULE
   - Monthly settlement on last business day
   - Minimum balance for withdrawal: Rs. 1,000
   - Bank transfer processing: 2-3 business days
   - UPI instant transfer available

5. DEDUCTIONS
   - SLA penalties as per SLA Policy
   - Lost device charges as per NetBox Return Policy
   - Administrative fees: None currently`,
  },
  {
    id: 'POL-004',
    title: 'Service Agreement',
    description: 'Terms and conditions of the CSP partnership agreement',
    lastUpdated: '2025-11-01',
    content: `Service Agreement -- CSP Partnership Terms

1. PARTNERSHIP SCOPE
   - Exclusive service delivery in assigned territory
   - Installation, restoration, and device management
   - Customer relationship management

2. RESPONSIBILITIES
   - Maintain minimum team of 2 technicians
   - Ensure 24/7 availability for HIGH priority tasks
   - Maintain SLA compliance above 85%
   - Provide accurate proof documentation

3. TERRITORY
   - Assigned zone: As per partnership letter
   - Expansion based on performance review
   - Minimum 6-month commitment per zone

4. TERMINATION
   - 30-day notice required from either party
   - Immediate termination for fraud or misconduct
   - Settlement of pending amounts within 15 business days
   - Return of all Wiom devices and materials

5. DISPUTE RESOLUTION
   - First level: Support case through app
   - Second level: Regional manager review
   - Third level: Formal arbitration`,
  },
];

const CHANGELOG: ChangeLogEntry[] = [
  {
    date: '2026-02-01',
    title: 'Commission Structure Updated',
    description: 'Added batch bonus for 5+ installs per week. Updated restore SLA bonus amounts.',
  },
  {
    date: '2026-01-15',
    title: 'SLA Policy Revised',
    description: 'HIGH priority restore SLA reduced from 90 minutes to 75 minutes. Added activation verification SLA.',
  },
  {
    date: '2026-01-10',
    title: 'NetBox Policy Amendment',
    description: 'Added selfie proof requirement for pickups. Updated lost device charges.',
  },
  {
    date: '2025-12-01',
    title: 'Settlement Schedule Change',
    description: 'Moved from bi-monthly to monthly settlement cycle. Added UPI instant transfer option.',
  },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function PoliciesPage({ onBack }: PoliciesPageProps) {
  const [step, setStep] = useState<FlowStep>('list');
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyItem | null>(null);

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
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>Policies &amp; Documents</div>
        </div>

        <div style={scrollStyle}>
          {/* Policies */}
          <div style={{ fontSize: 13, fontWeight: 600, color: '#A7A1B2', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            Policies
          </div>

          {POLICIES.map((policy) => (
            <button
              key={policy.id}
              onClick={() => { setSelectedPolicy(policy); setStep('policy_detail'); }}
              style={{
                width: '100%',
                background: '#443152',
                border: '1px solid #352D42',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 8,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#FAF9FC', marginBottom: 4 }}>
                  {policy.title}
                </div>
                <div style={{ fontSize: 12, color: '#A7A1B2' }}>
                  {policy.description}
                </div>
                <div style={{ fontSize: 11, color: '#665E75', marginTop: 4 }}>
                  Updated {formatDate(policy.lastUpdated)}
                </div>
              </div>
              <span style={{ fontSize: 16, color: '#665E75', marginLeft: 12 }}>&rsaquo;</span>
            </button>
          ))}

          {/* Change Log */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#A7A1B2',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginTop: 24,
              marginBottom: 12,
              paddingTop: 16,
              borderTop: '1px solid #352D42',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Change Log</span>
            <button
              onClick={() => setStep('changelog')}
              style={{
                background: 'none',
                border: 'none',
                color: '#D9008D',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'none',
                letterSpacing: 0,
              }}
            >
              View All
            </button>
          </div>

          {CHANGELOG.slice(0, 2).map((entry, i) => (
            <div
              key={i}
              style={{
                background: '#443152',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#FAF9FC' }}>{entry.title}</span>
                <span style={{ fontSize: 11, color: '#665E75' }}>{formatDate(entry.date)}</span>
              </div>
              <div style={{ fontSize: 12, color: '#A7A1B2', lineHeight: 1.4 }}>
                {entry.description}
              </div>
            </div>
          ))}

          <div style={{ height: 40 }} />
        </div>
      </div>
    );
  }

  // Policy detail
  if (step === 'policy_detail' && selectedPolicy) {
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          {backBtn('list')}
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>{selectedPolicy.title}</div>
          <div style={{ fontSize: 12, color: '#665E75', marginTop: 4 }}>
            Last updated: {formatDate(selectedPolicy.lastUpdated)}
          </div>
        </div>

        <div style={scrollStyle}>
          <pre
            style={{
              fontSize: 13,
              color: '#FAF9FC',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'inherit',
              margin: 0,
            }}
          >
            {selectedPolicy.content}
          </pre>

          <div style={{ height: 40 }} />
        </div>
      </div>
    );
  }

  // Changelog
  if (step === 'changelog') {
    return (
      <div style={overlayStyle}>
        <div style={headerStyle}>
          {backBtn('list')}
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FAF9FC' }}>Change Log</div>
        </div>

        <div style={scrollStyle}>
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div style={{
              position: 'absolute',
              left: 7,
              top: 4,
              bottom: 4,
              width: 2,
              background: '#352D42',
            }} />

            {CHANGELOG.map((entry, i) => (
              <div key={i} style={{ position: 'relative', paddingBottom: i < CHANGELOG.length - 1 ? 24 : 0 }}>
                <div style={{
                  position: 'absolute',
                  left: -20,
                  top: 3,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#D9008D',
                  border: '2px solid #161021',
                }} />
                <div style={{ fontSize: 11, color: '#665E75', marginBottom: 4 }}>
                  {formatDate(entry.date)}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#FAF9FC', marginBottom: 4 }}>
                  {entry.title}
                </div>
                <div style={{ fontSize: 13, color: '#A7A1B2', lineHeight: 1.5 }}>
                  {entry.description}
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: 40 }} />
        </div>
      </div>
    );
  }

  return null;
}
