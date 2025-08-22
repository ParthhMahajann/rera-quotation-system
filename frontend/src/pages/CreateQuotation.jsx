import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuotation } from '../services/quotations';

const developerTypeOptions = [
  { value: 'cat1', label: 'Category 1' },
  { value: 'cat2', label: 'Category 2' },
  { value: 'cat3', label: 'Category 3' },
  { value: 'agent', label: 'Agent Registration' }
];

const regionGroups = [
  { label: 'Mumbai Metropolitan Region', options: ['Mumbai Suburban', 'Mumbai City', 'Thane', 'Palghar'] },
  { label: 'Navi/KDMC/Raigad', options: ['KDMC', 'Navi Mumbai', 'Raigad'] },
  { label: 'Pune & ROM', options: ['Pune - City', 'Pune - PCMC', 'Pune - PMRDA', 'Pune - Rural', 'ROM (Rest of Maharashtra)'] }
];

const validityOptions = ['7 days', '15 days', '30 days'];
const paymentScheduleOptions = ['50%', '70%', '100%'];

export default function CreateQuotation() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    developerType: '',
    projectRegion: '',
    projectLocation: '',
    plotArea: '',
    developerName: '',
    projectName: '',
    validity: '7 days',
    paymentSchedule: '50%',
    reraNumber: '',
    serviceSummary: ''
  });

  const plotAreaNum = useMemo(() => Number(form.plotArea), [form.plotArea]);
  const plotAreaValid = useMemo(() => Number.isFinite(plotAreaNum) && plotAreaNum >= 0, [plotAreaNum]);

  const plotAreaBand = useMemo(() => {
    if (!plotAreaValid) return '';
    const v = plotAreaNum;
    if (v <= 500) return '0 - 500 sq units';
    if (v <= 1000) return '501 - 1000 sq units';
    if (v <= 1500) return '1001 - 1500 sq units';
    if (v <= 2500) return '1501 - 2500 sq units';
    if (v <= 4000) return '2501 - 4000 sq units';
    if (v <= 6500) return '4001 - 6500 sq units';
    return '6500+ sq units';
  }, [plotAreaValid, plotAreaNum]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validateReraNumber(value) {
    if (!value) return true; // optional
    // Simplified format: 3-5 uppercase letters/numbers, a dash, 6-10 alphanumerics
    return /^[A-Z0-9]{3,5}-[A-Z0-9]{6,10}$/i.test(value);
  }

  const reraValid = validateReraNumber(form.reraNumber);

  const canSubmit =
    form.developerType &&
    form.projectRegion &&
    form.developerName.trim().length > 0 &&
    plotAreaValid &&
    reraValid;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      const created = await createQuotation({
        developerType: form.developerType,
        projectRegion: form.projectRegion,
        projectLocation: form.projectLocation,
        plotArea: Number(form.plotArea),
        developerName: form.developerName,
        projectName: form.projectName || null,
        validity: form.validity,
        paymentSchedule: form.paymentSchedule,
        reraNumber: form.reraNumber || null,
        serviceSummary: form.serviceSummary || null,
        createdBy: form.developerName // placeholder attribution
      });
      // Navigate to step 2 for categories 1-3
      if (form.developerType !== 'agent' && created?.id) {
        navigate(`/quotations/${encodeURIComponent(created.id)}/services`);
      } else {
        navigate('/');
      }
    } catch (err) {
      alert('Failed to save quotation');
    }
  }

  const developerDependentDisabled = form.developerType === 'agent';

  useEffect(() => {
    if (form.developerType === 'agent') {
      navigate('/quotations/new/agent', { replace: true });
    }
  }, [form.developerType, navigate]);

  return (
    <div style={{ maxWidth: 960, margin: '24px auto', padding: 16, background: '#ffffff', color: '#1f2937' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>New Quotation</h1>
          <p style={{ margin: '6px 0 0', color: '#6b7280' }}>Enter project, developer, and scope details.</p>
        </div>
      </div>

      <div style={cardSurface}>
        <form onSubmit={handleSubmit}>
          <section style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0 }}>Developer & Project</h3>
            <div style={gridTwoCols}>
              <div>
                <label style={labelStyle}>Developer Type</label>
                <select value={form.developerType} onChange={(e) => handleChange('developerType', e.target.value)} style={inputStyle} required>
                  <option value="">Select developer type</option>
                  {developerTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {form.developerType === 'agent' && (
                  <div style={helpText}>Some project-specific fields are disabled for Agent Registration.</div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Project Region</label>
                <select value={form.projectRegion} onChange={(e) => handleChange('projectRegion', e.target.value)} style={inputStyle} required>
                  <option value="">Select region</option>
                  {regionGroups.map((g) => (
                    <optgroup key={g.label} label={g.label}>
                      {g.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Project Location</label>
                <input style={inputStyle} placeholder="e.g., Andheri East, Mumbai" value={form.projectLocation} onChange={(e) => handleChange('projectLocation', e.target.value)} disabled={developerDependentDisabled} />
              </div>
              <div>
                <label style={labelStyle}>Developer Name</label>
                <input style={inputStyle} value={form.developerName} onChange={(e) => handleChange('developerName', e.target.value)} placeholder="Enter developer name" required disabled={developerDependentDisabled} />
              </div>
              <div>
                <label style={labelStyle}>Project Name (optional)</label>
                <input style={inputStyle} value={form.projectName} onChange={(e) => handleChange('projectName', e.target.value)} placeholder="Enter project name" disabled={developerDependentDisabled} />
              </div>
              <div>
                <label style={labelStyle}>Plot Area</label>
                <input style={inputStyle} type="number" min="0" value={form.plotArea} onChange={(e) => handleChange('plotArea', e.target.value)} placeholder="Enter area in sq units" required />
                {!plotAreaValid && form.plotArea !== '' && (<div style={errorText}>Enter a valid non-negative number.</div>)}
                {plotAreaValid && <div style={helpText}>Detected range: <strong>{plotAreaBand}</strong></div>}
              </div>
            </div>
          </section>

          <section style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Quotation Settings</h3>
            <div style={gridThreeCols}>
              <div>
                <label style={labelStyle}>Validity</label>
                <select style={inputStyle} value={form.validity} onChange={(e) => handleChange('validity', e.target.value)}>
                  {validityOptions.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Payment Schedule</label>
                <select style={inputStyle} value={form.paymentSchedule} onChange={(e) => handleChange('paymentSchedule', e.target.value)}>
                  {paymentScheduleOptions.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>RERA Compliance Number (optional)</label>
                <input style={inputStyle} value={form.reraNumber} onChange={(e) => handleChange('reraNumber', e.target.value.toUpperCase())} placeholder="e.g., P517-201234" />
                {!reraValid && <div style={errorText}>Format should be like ABC-123456 or P517-201234.</div>}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Service Summary (optional)</label>
              <textarea style={{ ...inputStyle, minHeight: 80 }} value={form.serviceSummary} onChange={(e) => handleChange('serviceSummary', e.target.value)} placeholder="Brief description of services" />
            </div>
          </section>

          <div style={{ display: 'flex', gap: 8, padding: 16, borderTop: '1px solid #e5e7eb', justifyContent: 'flex-end' }}>
            <button type="button" style={btnSecondary} onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" style={{ ...btnPrimary, opacity: canSubmit ? 1 : 0.6 }} disabled={!canSubmit}>Next Step</button>
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

const helpText = {
  marginTop: 6,
  color: '#6b7280',
  fontSize: '14px'
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

const gridTwoCols = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 12
};

const gridThreeCols = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12
};


