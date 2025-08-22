import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuotation } from '../services/quotations';

const agentTypes = ['Individual', 'Proprietary', 'Private Ltd', 'LLP', 'Partnership', 'Others'];

export default function CreateAgentQuotation() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    agentName: '',
    mobile: '',
    email: '',
    agentType: ''
  });

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const mobileValid = useMemo(() => /^\d{10}$/.test(form.mobile || ''), [form.mobile]);
  const emailValid = useMemo(() => !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email), [form.email]);
  const canSubmit = form.agentName.trim().length > 0 && mobileValid && emailValid && !!form.agentType;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await createQuotation({
        developerType: 'agent',
        developerName: form.agentName,
        serviceSummary: `Agent Registration - ${form.agentType}`,
        createdBy: form.agentName,
        contactMobile: form.mobile,
        contactEmail: form.email
      });
      navigate('/');
    } catch (e) {
      alert('Failed to save agent quotation');
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: 16, background: '#ffffff', color: '#1f2937' }}>
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Agent Registration</h1>
        <p style={{ margin: '6px 0 0', color: '#6b7280' }}>Step 2: Provide agent details.</p>
      </div>
      <div style={cardSurface}>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: 16, display: 'grid', gap: 12 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input style={inputStyle} value={form.agentName} onChange={(e) => handleChange('agentName', e.target.value)} placeholder="Enter full name / business name" required />
            </div>
            <div>
              <label style={labelStyle}>Mobile No.</label>
              <input style={inputStyle} value={form.mobile} onChange={(e) => handleChange('mobile', e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile" required />
              {!mobileValid && form.mobile && (<div style={errorText}>Enter a valid 10-digit mobile number.</div>)}
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="name@example.com" />
              {!emailValid && (<div style={errorText}>Enter a valid email address.</div>)}
            </div>
            <div>
              <label style={labelStyle}>Agent Type</label>
              <select style={inputStyle} value={form.agentType} onChange={(e) => handleChange('agentType', e.target.value)} required>
                <option value="">Select type</option>
                {agentTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, padding: 16, borderTop: '1px solid #e5e7eb', justifyContent: 'flex-end' }}>
            <button type="button" style={btnSecondary} onClick={() => navigate(-1)}>Back</button>
            <button type="submit" style={{ ...btnPrimary, opacity: canSubmit ? 1 : 0.6 }} disabled={!canSubmit}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = { 
  padding: 10, 
  borderRadius: 6, 
  border: '1px solid #d1d5db', 
  background: '#ffffff', 
  color: '#1f2937',
  width: '100%'
};

const labelStyle = { 
  display: 'block', 
  marginBottom: 6, 
  fontWeight: 600,
  color: '#374151'
};

const errorText = { 
  marginTop: 6, 
  color: '#dc2626',
  fontSize: '14px'
};

const btnPrimary = { 
  padding: '10px 14px', 
  background: '#1e40af', 
  color: '#ffffff', 
  border: 0, 
  borderRadius: 6, 
  cursor: 'pointer',
  fontWeight: '500'
};

const btnSecondary = { 
  padding: '10px 14px', 
  background: '#6b7280', 
  color: '#ffffff', 
  border: 0, 
  borderRadius: 6, 
  cursor: 'pointer',
  fontWeight: '500'
};

const cardSurface = { 
  background: '#ffffff', 
  border: '1px solid #e5e7eb', 
  borderRadius: 8, 
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
};


