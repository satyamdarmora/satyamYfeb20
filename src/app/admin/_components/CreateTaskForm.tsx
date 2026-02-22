'use client';

import React from 'react';
import type { TaskType, TaskPriority, CreatedBy } from '@/lib/types';
import { AREAS, MANUAL_REASONS } from './AdminTypes';

interface CreateTaskFormProps {
  formType: TaskType;
  setFormType: (t: TaskType) => void;
  formPriority: TaskPriority;
  setFormPriority: (p: TaskPriority) => void;
  formConnectionId: string;
  setFormConnectionId: (c: string) => void;
  formArea: string;
  setFormArea: (a: string) => void;
  formCreatedBy: CreatedBy;
  setFormCreatedBy: (c: CreatedBy) => void;
  formReason: string;
  setFormReason: (r: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'var(--text-secondary)',
  marginBottom: 6,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
};

const fieldGroup: React.CSSProperties = {
  marginBottom: 16,
};

export function CreateTaskForm({
  formType,
  setFormType,
  formPriority,
  setFormPriority,
  formConnectionId,
  setFormConnectionId,
  formArea,
  setFormArea,
  formCreatedBy,
  setFormCreatedBy,
  formReason,
  setFormReason,
  onSubmit,
}: CreateTaskFormProps) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}
    >
      <h2
        style={{
          fontSize: 16,
          fontWeight: 600,
          margin: '0 0 20px',
          color: 'var(--text-primary)',
        }}
      >
        Create New Task
      </h2>

      <form onSubmit={onSubmit}>
        <div style={fieldGroup}>
          <label style={labelStyle}>Task Type</label>
          <select
            value={formType}
            onChange={(e) => setFormType(e.target.value as TaskType)}
            style={inputStyle}
          >
            <option value="INSTALL">INSTALL</option>
            <option value="RESTORE">RESTORE</option>
            <option value="NETBOX">NETBOX</option>
          </select>
        </div>

        <div style={fieldGroup}>
          <label style={labelStyle}>Priority</label>
          <select
            value={formPriority}
            onChange={(e) =>
              setFormPriority(e.target.value as TaskPriority)
            }
            style={inputStyle}
          >
            <option value="HIGH">HIGH</option>
            <option value="NORMAL">NORMAL</option>
          </select>
        </div>

        <div style={fieldGroup}>
          <label style={labelStyle}>
            {formType === 'NETBOX'
              ? 'NetBox ID (auto-generate if empty)'
              : 'Connection ID (auto-generate if empty)'}
          </label>
          <input
            type="text"
            value={formConnectionId}
            onChange={(e) => setFormConnectionId(e.target.value)}
            placeholder={
              formType === 'NETBOX' ? 'NB-MH-XXXX' : 'WM-CON-XXXX'
            }
            style={inputStyle}
          />
        </div>

        <div style={fieldGroup}>
          <label style={labelStyle}>Customer Area</label>
          <select
            value={formArea}
            onChange={(e) => setFormArea(e.target.value)}
            style={inputStyle}
          >
            {AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldGroup}>
          <label style={labelStyle}>Created By</label>
          <select
            value={formCreatedBy}
            onChange={(e) => setFormCreatedBy(e.target.value as CreatedBy)}
            style={inputStyle}
          >
            <option value="SYSTEM">SYSTEM</option>
            <option value="MANUAL_EXCEPTION">MANUAL_EXCEPTION</option>
          </select>
        </div>

        {formCreatedBy === 'MANUAL_EXCEPTION' && (
          <div style={fieldGroup}>
            <label style={labelStyle}>Reason</label>
            <select
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              style={inputStyle}
            >
              {MANUAL_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            background: 'var(--brand-primary)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 4,
          }}
        >
          Create Task
        </button>
      </form>
    </div>
  );
}
