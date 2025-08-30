// src/pages/QuotationTerms.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const QuotationTerms = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [quotationData, setQuotationData] = useState(null);
  const [applicableTerms, setApplicableTerms] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Terms data structure
  const termsData = {
    "General T&C": [
      "The above quotation is subject to this project only.",
      "The prices mentioned above are in particular to One Project per year.",
      "The services outlined above are included within the project scope. Any additional services not specified are excluded from this scope.",
      "The prices mentioned above are applicable to One Project only for the duration of the services obtained.",
      "The prices mentioned above DO NOT include Government Fees.",
      "The prices mentioned above DO NOT include Edit Fees.",
      "*18% GST Applicable on above mentioned charges.",
      "The prices listed above do not include any applicable statutory taxes.",
      "Any and all services not mentioned in the above scope of services are not applicable",
      "All Out-of-pocket expenses incurred for completion of the work shall be re-imbursed to RERA Easy"
    ],
    "Package A,B,C": [
      "Payment is due at the initiation of services, followed by annual payments thereafter.",
      "Any kind of drafting of legal documents or contracts are not applicable.",
      "The quoted fee covers annual MahaRERA compliance services, with billing on a Yearly basis for convenience and predictable financial planning.",
      "Invoices will be generated at a predetermined interval for each year in advance.",
      "The initial invoice will be issued from the date of issuance or a start date as specified in the Work Order."
    ],
    "Package D": [
      "All Out-of-pocket expenses incurred for the explicit purpose of Commuting, Refreshment meals of RERA Easy's personnel shall be re-imbursed to RERA Easy, subject to submission of relevant invoices, bills and records submitted."
    ],
    "Legal": [],  // Uses General T&C
    "Compliance": []  // Uses General T&C
  };

  // Service to terms mapping
  const serviceTermsMapping = {
    "Package A": "Package A,B,C",
    "Package B": "Package A,B,C",
    "Package C": "Package A,B,C",
    "Package D": "Package D",
    "Project Registration": "General T&C",
    "Drafting of Legal Documents": "Legal",
    "Vetting of Legal Documents": "Legal",
    "Drafting of Title Report in Format A": "Legal",
    "Liasioning": "Compliance",
    "SRO Membership": "Compliance",
    "Project Extension - Section 7.3": "General T&C",
    "Project Correction - Change of FSI/ Plan": "General T&C",
    "Project Closure": "General T&C",
    "Removal of Abeyance - QPR, Lapsed": "General T&C",
    "Deregistration": "General T&C",
    "Change of Promoter (section 15)": "General T&C",
    "Profile Migration": "General T&C",
    "Profile Updation": "General T&C",
    "Form 1": "General T&C",
    "Form 2": "General T&C",
    "Form 3": "General T&C",
    "Form 5": "General T&C",
    "Title Certificate": "General T&C"
  };

  useEffect(() => {
    const fetchQuotationData = async () => {
      try {
        setLoading(true);
        
        // Fetch quotation data
        const response = await fetch(`/api/quotations/${id}`);
        if (!response.ok) throw new Error('Failed to fetch quotation');
        const quotation = await response.json();
        setQuotationData(quotation.data);

        // Determine applicable terms based on selected services
        const applicableTermsSets = new Set(['General T&C']); // Always include general terms
        
        quotation.data.headers?.forEach(header => {
          header.services?.forEach(service => {
            const termCategory = serviceTermsMapping[service.label] || 'General T&C';
            applicableTermsSets.add(termCategory);
          });
        });

        // Build applicable terms object
        const terms = {};
        Array.from(applicableTermsSets).forEach(category => {
          if (termsData[category] && termsData[category].length > 0) {
            terms[category] = termsData[category];
          } else if (category === 'Legal' || category === 'Compliance') {
            // Legal and Compliance use General T&C terms
            terms[category] = termsData['General T&C'];
          }
        });

        setApplicableTerms(terms);

        // Load existing terms acceptance status
        if (quotation.data.termsAccepted) {
          setTermsAccepted(true);
        }

      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuotationData();
    }
  }, [id]);

  const handleAcceptTerms = (accepted) => {
    setTermsAccepted(accepted);
  };

  const handleSaveAndContinue = async () => {
    if (!termsAccepted) {
      alert('Please accept the terms and conditions to proceed.');
      return;
    }

    try {
      setLoading(true);
      
      // Save terms acceptance status
      await fetch(`/api/quotations/${id}/terms`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termsAccepted: true,
          applicableTerms: Object.keys(applicableTerms)
        }),
      });

      // Navigate to summary
      navigate(`/quotations/${id}/summary`);
    } catch (err) {
      console.error('Error saving terms:', err);
      setError('Failed to save terms acceptance');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={loadingStyle}>Loading...</div>;
  if (error) return <div style={errorStyle}>Error: {error}</div>;

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={stepBadgeStyle}>STEP 3 OF 4</div>
        <h1 style={titleStyle}>Terms & Conditions</h1>
        <p style={descriptionStyle}>
          Please review and accept the terms and conditions applicable to your selected services
        </p>
      </div>

      {/* Quotation Info */}
      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>Quotation Details</h3>
        <div style={quotationInfoStyle}>
          <div style={infoItemStyle}>
            <span style={labelStyle}>Quotation ID:</span>
            <span style={valueStyle}>{quotationData?.id}</span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>Developer:</span>
            <span style={valueStyle}>{quotationData?.developerName}</span>
          </div>
          <div style={infoItemStyle}>
            <span style={labelStyle}>Project:</span>
            <span style={valueStyle}>{quotationData?.projectName || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Selected Services */}
      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>Selected Services</h3>
        <div style={servicesListStyle}>
          {quotationData?.headers?.map((header, index) => (
            <div key={index} style={serviceHeaderStyle}>
              <h4 style={serviceHeaderTitleStyle}>{header.header}</h4>
              <ul style={serviceListStyle}>
                {header.services?.map((service, sIndex) => (
                  <li key={sIndex} style={serviceItemStyle}>
                    {service.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Applicable Terms */}
      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>Applicable Terms & Conditions</h3>
        {Object.entries(applicableTerms).map(([category, terms]) => (
          <div key={category} style={termsCategoryStyle}>
            <h4 style={termsCategoryTitleStyle}>
              {category === 'General T&C' ? 'General Terms & Conditions' : 
               category === 'Package A,B,C' ? 'Package A, B, C Terms' :
               category}
            </h4>
            <ul style={termsListStyle}>
              {terms.map((term, index) => (
                <li key={index} style={termItemStyle}>
                  {term}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Terms Acceptance */}
      <div style={cardStyle}>
        <div style={acceptanceStyle}>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => handleAcceptTerms(e.target.checked)}
              style={checkboxStyle}
            />
            <span style={checkboxTextStyle}>
              I have read and agree to the above terms and conditions
            </span>
          </label>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={buttonGroupStyle}>
        <button 
          onClick={() => navigate(`/quotations/${id}/pricing`)}
          style={btnSecondaryStyle}
        >
          ← Previous
        </button>
        <button 
          onClick={handleSaveAndContinue}
          disabled={!termsAccepted || loading}
          style={{
            ...btnPrimaryStyle,
            ...((!termsAccepted || loading) ? btnDisabledStyle : {})
          }}
        >
          {loading ? 'Saving...' : 'Accept & Continue →'}
        </button>
      </div>
    </div>
  );
};

// Styles
const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '20px',
  fontFamily: 'system-ui, sans-serif'
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '30px'
};

const stepBadgeStyle = {
  background: '#1e40af',
  color: '#ffffff',
  padding: '6px 12px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '600',
  display: 'inline-block',
  marginBottom: '10px'
};

const titleStyle = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1f2937',
  margin: '10px 0'
};

const descriptionStyle = {
  fontSize: '16px',
  color: '#6b7280',
  margin: '0'
};

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '20px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
};

const sectionTitleStyle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1f2937',
  marginBottom: '16px'
};

const quotationInfoStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '12px'
};

const infoItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px solid #f3f4f6'
};

const labelStyle = {
  fontWeight: '500',
  color: '#374151'
};

const valueStyle = {
  color: '#1f2937',
  fontWeight: '600'
};

const servicesListStyle = {
  display: 'grid',
  gap: '16px'
};

const serviceHeaderStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '16px'
};

const serviceHeaderTitleStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  marginBottom: '8px'
};

const serviceListStyle = {
  listStyle: 'none',
  padding: '0',
  margin: '0'
};

const serviceItemStyle = {
  padding: '4px 0',
  color: '#374151',
  borderLeft: '3px solid #3b82f6',
  paddingLeft: '12px',
  marginBottom: '4px'
};

const termsCategoryStyle = {
  marginBottom: '24px',
  padding: '16px',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  backgroundColor: '#f9fafb'
};

const termsCategoryTitleStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  marginBottom: '12px'
};

const termsListStyle = {
  listStyle: 'decimal',
  paddingLeft: '20px',
  margin: '0'
};

const termItemStyle = {
  marginBottom: '8px',
  color: '#374151',
  lineHeight: '1.5'
};

const acceptanceStyle = {
  padding: '20px',
  backgroundColor: '#f0f9ff',
  border: '1px solid #0ea5e9',
  borderRadius: '6px'
};

const checkboxLabelStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  cursor: 'pointer',
  gap: '12px'
};

const checkboxStyle = {
  width: '18px',
  height: '18px',
  marginTop: '2px'
};

const checkboxTextStyle = {
  fontSize: '16px',
  fontWeight: '500',
  color: '#1f2937',
  lineHeight: '1.5'
};

const buttonGroupStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  marginTop: '30px'
};

const btnSecondaryStyle = {
  padding: '12px 24px',
  background: '#6b7280',
  color: '#ffffff',
  border: '0',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '16px'
};

const btnPrimaryStyle = {
  padding: '12px 24px',
  background: '#3b82f6',
  color: '#ffffff',
  border: '0',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '16px'
};

const btnDisabledStyle = {
  background: '#9ca3af',
  cursor: 'not-allowed'
};

const loadingStyle = {
  textAlign: 'center',
  padding: '50px',
  fontSize: '18px',
  color: '#6b7280'
};

const errorStyle = {
  textAlign: 'center',
  padding: '50px',
  fontSize: '18px',
  color: '#dc2626',
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  margin: '20px'
};

export default QuotationTerms;