import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { QuotationProvider } from '../context/QuotationContext';
import QuotationBuilder from '../components/QuotationBuilder';
import { updateQuotation } from '../services/quotations';

export default function QuotationServices() {
  const navigate = useNavigate();
  const { id } = useParams();

const handleQuotationComplete = async (selectedHeaders) => {
  try {
    // existing transform
    const transformed = selectedHeaders.map(h => ({
      header: h.name,
      services: (h.services || []).map(s => ({
        id: s.id,
        label: s.label,
        subServices: (s.subServices || []).map(ss => ({ id: ss.id, text: ss.text }))
      }))
    }));

    await updateQuotation(id, { headers: transformed }); // This is the API call
    navigate(`/quotations/${id}/summary`); // Or your next step
  } catch (err) {
    console.error('Failed to save services:', err);
    alert('Failed to save services: ' + (err.message || err));
  }
};

  return (
    <QuotationProvider>
      <div style={{ maxWidth: 1200, margin: '24px auto', padding: 16, background: '#ffffff', color: '#1f2937' }}>
        {/* Header */}
        <div style={pageHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={stepBadge}>STEP 2 OF 2</span>
            </div>
            <h1 style={{ margin: 0 }}>Services Selection</h1>
            <p style={{ margin: '6px 0 0', color: '#6b7280' }}>
              Choose headers and services for your quotation. Duplicate sub-services are prevented automatically.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btnSecondary} onClick={() => navigate('/quotations/new')}>
              Back to Step 1
            </button>
          </div>
        </div>

        {/* Quotation Builder */}
        <QuotationBuilder onComplete={handleQuotationComplete} />
      </div>
    </QuotationProvider>
  );
}

// Styles
const pageHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 24
};

const stepBadge = {
  background: '#1e40af',
  color: '#ffffff',
  padding: '4px 8px',
  borderRadius: 4,
  fontSize: '12px',
  fontWeight: '600'
};

const btnSecondary = {
  padding: '10px 16px',
  background: '#6b7280',
  color: '#ffffff',
  border: 0,
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: '500'
};
