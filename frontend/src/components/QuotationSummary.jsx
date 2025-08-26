import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const QuotationSummary = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const response = await fetch(`/api/quotations/${id}`);
        if (!response.ok) throw new Error('Failed to fetch quotation');
        
        const data = await response.json();
        setQuotation(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchQuotation();
  }, [id]);

  const handleDownload = () => {
    if (!quotation) return;
    
    const quotationData = {
      id: quotation.id,
      projectDetails: {
        developerName: quotation.developerName,
        projectName: quotation.projectName,
        developerType: quotation.developerType,
        projectRegion: quotation.projectRegion,
        plotArea: quotation.plotArea,
        validity: quotation.validity,
        paymentSchedule: quotation.paymentSchedule,
        reraNumber: quotation.reraNumber
      },
      services: quotation.headers || [],
      pricing: quotation.pricingBreakdown || [],
      totalAmount: quotation.totalAmount || 0,
      createdAt: quotation.createdAt
    };

    const blob = new Blob([JSON.stringify(quotationData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotation-${quotation.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={loadingStyle}>Loading quotation...</div>;
  if (error) return <div style={errorStyle}>Error: {error}</div>;
  if (!quotation) return <div style={errorStyle}>Quotation not found</div>;

  const totalAmount = quotation.totalAmount || 0;
  const subtotal = Math.round(totalAmount / 1.18);
  const tax = totalAmount - subtotal;

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Quotation Summary</h1>
          <p style={subtitleStyle}>
            Complete quotation for {quotation.projectName || quotation.developerName}
          </p>
        </div>
        <div style={headerActionsStyle}>
          <button 
            style={btnSecondaryStyle}
            onClick={() => navigate(`/quotations/${id}/pricing`)}
          >
            Edit Pricing
          </button>
          <button 
            style={btnPrimaryStyle}
            onClick={handleDownload}
          >
            Download
          </button>
        </div>
      </div>

      {/* Success Message */}
      <div style={successMessageStyle}>
        <div style={successIconStyle}>✓</div>
        <div>
          <h3>Quotation Created Successfully!</h3>
          <p>Quotation ID: <strong>{quotation.id}</strong></p>
        </div>
      </div>

      {/* Project Details */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Project Details</h3>
        <div style={detailsGridStyle}>
          <div style={detailItemStyle}>
            <span style={labelStyle}>Developer Name:</span>
            <span>{quotation.developerName}</span>
          </div>
          <div style={detailItemStyle}>
            <span style={labelStyle}>Project Name:</span>
            <span>{quotation.projectName || 'N/A'}</span>
          </div>
          <div style={detailItemStyle}>
            <span style={labelStyle}>Developer Type:</span>
            <span>{quotation.developerType}</span>
          </div>
          <div style={detailItemStyle}>
            <span style={labelStyle}>Project Region:</span>
            <span>{quotation.projectRegion}</span>
          </div>
          <div style={detailItemStyle}>
            <span style={labelStyle}>Plot Area:</span>
            <span>{quotation.plotArea} sq units</span>
          </div>
          <div style={detailItemStyle}>
            <span style={labelStyle}>Validity:</span>
            <span>{quotation.validity}</span>
          </div>
          <div style={detailItemStyle}>
            <span style={labelStyle}>Payment Schedule:</span>
            <span>{quotation.paymentSchedule}</span>
          </div>
          {quotation.reraNumber && (
            <div style={detailItemStyle}>
              <span style={labelStyle}>RERA Number:</span>
              <span>{quotation.reraNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Selected Services */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Selected Services</h3>
        {quotation.headers && quotation.headers.length > 0 ? (
          quotation.headers.map((header, index) => (
            <div key={index} style={serviceHeaderStyle}>
              <h4 style={serviceHeaderTitleStyle}>{header.header}</h4>
              <div style={servicesListStyle}>
                {header.services.map((service, serviceIndex) => (
                  <div key={serviceIndex} style={serviceItemStyle}>
                    <div style={serviceNameStyle}>{service.label}</div>
                    {service.subServices && service.subServices.length > 0 && (
                      <div style={subServicesStyle}>
                        {service.subServices.map((subService, subIndex) => (
                          <span key={subIndex} style={subServiceTagStyle}>
                            {subService.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p style={noDataStyle}>No services selected</p>
        )}
      </div>

      {/* Pricing Summary */}
      {quotation.pricingBreakdown && quotation.pricingBreakdown.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Pricing Summary</h3>
          <div style={pricingSummaryStyle}>
            <div style={pricingRowStyle}>
              <span>Subtotal:</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div style={pricingRowStyle}>
              <span>GST (18%):</span>
              <span>₹{tax.toLocaleString()}</span>
            </div>
            <div style={finalTotalStyle}>
              <span>Total Amount:</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={actionsStyle}>
        <button 
          style={btnSecondaryStyle}
          onClick={() => navigate('/')}
        >
          Back to Dashboard
        </button>
        <button 
          style={btnPrimaryStyle}
          onClick={() => navigate('/quotations/new')}
        >
          Create New Quotation
        </button>
      </div>
    </div>
  );
};

// Styles
const containerStyle = {
  maxWidth: '1000px',
  margin: '0 auto',
  padding: '24px',
  backgroundColor: '#f8fafc',
  minHeight: '100vh'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '32px'
};

const titleStyle = {
  fontSize: '32px',
  fontWeight: '700',
  margin: '0 0 8px 0',
  color: '#1f2937'
};

const subtitleStyle = {
  color: '#6b7280',
  margin: '0',
  fontSize: '16px'
};

const headerActionsStyle = {
  display: 'flex',
  gap: '12px'
};

const btnSecondaryStyle = {
  padding: '10px 16px',
  background: '#6b7280',
  color: '#ffffff',
  border: 0,
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '500'
};

const btnPrimaryStyle = {
  padding: '10px 16px',
  background: '#1e40af',
  color: '#ffffff',
  border: 0,
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '500'
};

const successMessageStyle = {
  backgroundColor: '#dcfce7',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '32px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
};

const successIconStyle = {
  width: '48px',
  height: '48px',
  backgroundColor: '#22c55e',
  color: 'white',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  fontWeight: 'bold'
};

const sectionStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '24px',
  border: '1px solid #e5e7eb'
};

const sectionTitleStyle = {
  fontSize: '20px',
  fontWeight: '600',
  marginBottom: '16px',
  color: '#1f2937'
};

const detailsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '16px'
};

const detailItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#6b7280'
};

const serviceHeaderStyle = {
  marginBottom: '24px',
  paddingBottom: '16px',
  borderBottom: '1px solid #f3f4f6'
};

const serviceHeaderTitleStyle = {
  fontSize: '18px',
  fontWeight: '600',
  marginBottom: '12px',
  color: '#1f2937'
};

const servicesListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const serviceItemStyle = {
  padding: '12px',
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  border: '1px solid #e5e7eb'
};

const serviceNameStyle = {
  fontSize: '16px',
  fontWeight: '500',
  marginBottom: '8px'
};

const subServicesStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px'
};

const subServiceTagStyle = {
  backgroundColor: '#dbeafe',
  color: '#1e40af',
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '12px'
};

const pricingSummaryStyle = {
  backgroundColor: '#f8fafc',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb'
};

const pricingRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '12px',
  fontSize: '16px'
};

const finalTotalStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '20px',
  fontWeight: '700',
  paddingTop: '12px',
  borderTop: '2px solid #e5e7eb',
  color: '#1e40af'
};

const actionsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '32px'
};

const loadingStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  fontSize: '18px',
  color: '#6b7280'
};

const errorStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  fontSize: '18px',
  color: '#dc2626'
};

const noDataStyle = {
  color: '#6b7280',
  fontStyle: 'italic',
  textAlign: 'center',
  padding: '20px'
};

export default QuotationSummary;
