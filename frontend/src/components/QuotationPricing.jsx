import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const QuotationPricing = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [quotationData, setQuotationData] = useState(null);
  const [pricingBreakdown, setPricingBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Discount state
  const [discountType, setDiscountType] = useState('amount'); // 'amount' or 'percent'
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Fetch quotation data and calculate pricing
  useEffect(() => {
    const fetchQuotationAndPricing = async () => {
      try {
        setLoading(true);
        
        // Fetch quotation data
        const quotationResponse = await fetch(`/api/quotations/${id}`);
        if (!quotationResponse.ok) throw new Error('Failed to fetch quotation');
        const quotation = await quotationResponse.json();
        
        setQuotationData(quotation.data);
        
        // Calculate pricing for selected services
        const pricingResponse = await fetch('/api/quotations/calculate-pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            developerType: quotation.data.developerType,
            projectRegion: quotation.data.projectRegion,
            plotArea: quotation.data.plotArea,
            headers: quotation.data.headers || []
          })
        });
        
        if (!pricingResponse.ok) throw new Error('Failed to calculate pricing');
        const pricingData = await pricingResponse.json();
        
        setPricingBreakdown(pricingData.breakdown);
        
        // Load existing discount if available
        if (quotation.data.discountAmount) {
          setDiscountAmount(quotation.data.discountAmount);
          setDiscountType('amount');
        } else if (quotation.data.discountPercent) {
          setDiscountPercent(quotation.data.discountPercent);
          setDiscountType('percent');
        }
        
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuotationAndPricing();
    }
  }, [id]);

  // Calculate base totals (without discount)
  const baseTotals = useMemo(() => {
    const subtotal = pricingBreakdown.reduce((acc, header) => {
      const headerTotal = header.services.reduce((sum, service) => sum + service.totalAmount, 0);
      return acc + headerTotal;
    }, 0);
    
    return { subtotal };
  }, [pricingBreakdown]);

  // Handle discount amount change
  const handleDiscountAmountChange = (value) => {
    const amount = Math.max(0, Math.min(value, baseTotals.subtotal)); // Ensure discount doesn't exceed subtotal
    setDiscountAmount(amount);
    
    // Calculate corresponding percentage
    if (baseTotals.subtotal > 0) {
      const percent = (amount / baseTotals.subtotal) * 100;
      setDiscountPercent(Math.round(percent * 100) / 100); // Round to 2 decimal places
    } else {
      setDiscountPercent(0);
    }
  };

  // Handle discount percentage change
  const handleDiscountPercentChange = (value) => {
    const percent = Math.max(0, Math.min(value, 100)); // Ensure percentage is between 0-100
    setDiscountPercent(percent);
    
    // Calculate corresponding amount
    const amount = (percent / 100) * baseTotals.subtotal;
    setDiscountAmount(Math.round(amount));
  };

  // Calculate final totals with discount
  const finalTotals = useMemo(() => {
    const subtotal = baseTotals.subtotal;
    const discount = discountAmount;
    const subtotalAfterDiscount = subtotal - discount;
    const tax = Math.round(subtotalAfterDiscount * 0.18); // 18% GST
    const total = subtotalAfterDiscount + tax;
    
    return {
      subtotal,
      discount,
      subtotalAfterDiscount,
      tax,
      total,
      discountPercent: baseTotals.subtotal > 0 ? (discount / baseTotals.subtotal) * 100 : 0
    };
  }, [baseTotals.subtotal, discountAmount]);

  const handleSavePricing = async () => {
    try {
      setLoading(true);
      
      await fetch(`/api/quotations/${id}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricingBreakdown,
          totalAmount: finalTotals.total,
          discountAmount,
          discountPercent,
          discountType
        })
      });
      
      // Navigate to summary
      navigate(`/quotations/${id}/summary`);
      
    } catch (err) {
      console.error('Error saving pricing:', err);
      setError('Failed to save pricing');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Calculating pricing...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!quotationData) return <div className="error">Quotation not found</div>;

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <span style={stepBadgeStyle}>STEP 3 OF 3</span>
          <h1 style={titleStyle}>Pricing Breakdown</h1>
          <p style={subtitleStyle}>
            Review and confirm pricing for selected services
          </p>
        </div>
        <button 
          style={btnSecondaryStyle}
          onClick={() => navigate(`/quotations/${id}/services`)}
        >
          Back to Services
        </button>
      </div>

      {/* Project Summary */}
      <div style={projectSummaryStyle}>
        <h3>Project Details</h3>
        <div style={projectDetailsStyle}>
          <div><strong>Developer:</strong> {quotationData.developerName}</div>
          <div><strong>Project:</strong> {quotationData.projectName || 'N/A'}</div>
          <div><strong>Type:</strong> {quotationData.developerType}</div>
          <div><strong>Region:</strong> {quotationData.projectRegion}</div>
          <div><strong>Plot Area:</strong> {quotationData.plotArea} sq units</div>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div style={pricingContainerStyle}>
        <h3>Service Pricing Breakdown</h3>
        
        {pricingBreakdown.map((header, headerIndex) => (
          <div key={headerIndex} style={headerSectionStyle}>
            <h4 style={headerTitleStyle}>{header.headerName}</h4>
            
            <div style={servicesListStyle}>
              {header.services.map((service, serviceIndex) => (
                <div key={serviceIndex} style={serviceRowStyle}>
                  <div style={serviceInfoStyle}>
                    <div style={serviceNameStyle}>{service.serviceName}</div>
                    <div style={subServicesStyle}>
                      {service.subServices.map((sub, subIndex) => (
                        <span key={subIndex} style={subServiceTagStyle}>
                          {sub.text} {/* The change is here: access the 'text' property */}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={pricingInfoStyle}>
                    <div style={basePriceStyle}>
                      Base: ₹{service.baseAmount.toLocaleString()}
                    </div>
                    {service.subServiceCount > 0 && (
                      <div style={subServicePriceStyle}>
                        Sub-services: {service.subServiceCount} × ₹{service.subServiceRate.toLocaleString()}
                      </div>
                    )}
                    <div style={totalPriceStyle}>
                      ₹{service.totalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={headerTotalStyle}>
              Header Total: ₹{header.services.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Discount Section */}
      <div style={discountContainerStyle}>
        <h3>Apply Discount</h3>
        
        <div style={discountTypeSelectionStyle}>
          <label style={radioLabelStyle}>
            <input
              type="radio"
              value="amount"
              checked={discountType === 'amount'}
              onChange={(e) => setDiscountType(e.target.value)}
              style={radioInputStyle}
            />
            Discount by Amount
          </label>
          <label style={radioLabelStyle}>
            <input
              type="radio"
              value="percent"
              checked={discountType === 'percent'}
              onChange={(e) => setDiscountType(e.target.value)}
              style={radioInputStyle}
            />
            Discount by Percentage
          </label>
        </div>

        <div style={discountInputsStyle}>
          <div style={discountInputGroupStyle}>
            <label style={labelStyle}>Discount Amount:</label>
            <div style={inputWithCurrencyStyle}>
              <span style={currencySymbolStyle}>₹</span>
              <input
                type="number"
                min="0"
                max={baseTotals.subtotal}
                value={discountAmount}
                onChange={(e) => handleDiscountAmountChange(Number(e.target.value))}
                disabled={discountType !== 'amount'}
                style={{
                  ...discountInputStyle,
                  ...(discountType !== 'amount' ? disabledInputStyle : {})
                }}
                placeholder="0"
              />
            </div>
          </div>

          <div style={discountInputGroupStyle}>
            <label style={labelStyle}>Discount Percentage:</label>
            <div style={inputWithCurrencyStyle}>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discountPercent}
                onChange={(e) => handleDiscountPercentChange(Number(e.target.value))}
                disabled={discountType !== 'percent'}
                style={{
                  ...discountInputStyle,
                  ...(discountType !== 'percent' ? disabledInputStyle : {})
                }}
                placeholder="0"
              />
              <span style={percentSymbolStyle}>%</span>
            </div>
          </div>
        </div>

        {discountAmount > 0 && (
          <div style={discountPreviewStyle}>
            <span>You save: ₹{discountAmount.toLocaleString()} ({finalTotals.discountPercent.toFixed(2)}%)</span>
          </div>
        )}
      </div>

      {/* Totals Summary */}
      <div style={totalsSummaryStyle}>
        <h3>Payment Summary</h3>
        
        <div style={totalsRowStyle}>
          <span>Original Subtotal:</span>
          <span>₹{finalTotals.subtotal.toLocaleString()}</span>
        </div>
        
        {discountAmount > 0 && (
          <>
            <div style={discountRowStyle}>
              <span>Discount ({finalTotals.discountPercent.toFixed(2)}%):</span>
              <span>- ₹{discountAmount.toLocaleString()}</span>
            </div>
            <div style={totalsRowStyle}>
              <span>Subtotal after Discount:</span>
              <span>₹{finalTotals.subtotalAfterDiscount.toLocaleString()}</span>
            </div>
          </>
        )}
        
        <div style={totalsRowStyle}>
          <span>GST (18%):</span>
          <span>₹{finalTotals.tax.toLocaleString()}</span>
        </div>
        
        <div style={finalTotalStyle}>
          <span>Total Amount:</span>
          <span>₹{finalTotals.total.toLocaleString()}</span>
        </div>
        
        <div style={paymentScheduleStyle}>
          <div style={scheduleItemStyle}>
            <span>Payment Schedule: {quotationData.paymentSchedule}</span>
          </div>
          <div style={scheduleItemStyle}>
            <span>Validity: {quotationData.validity}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={actionButtonsStyle}>
        <button 
          style={btnSecondaryStyle}
          onClick={() => navigate(`/quotations/${id}/services`)}
        >
          Modify Services
        </button>
        <button 
          style={btnPrimaryStyle}
          onClick={handleSavePricing}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Confirm & Continue'}
        </button>
      </div>
    </div>
  );
};

// Existing styles (keeping all previous styles)
const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px',
  backgroundColor: '#f8fafc'
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '32px'
};

const stepBadgeStyle = {
  background: '#1e40af',
  color: '#ffffff',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '600'
};

const titleStyle = {
  fontSize: '28px',
  fontWeight: '700',
  margin: '8px 0 4px 0'
};

const subtitleStyle = {
  color: '#6b7280',
  margin: '0'
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
  padding: '12px 24px',
  background: '#1e40af',
  color: '#ffffff',
  border: 0,
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '16px'
};

const projectSummaryStyle = {
  backgroundColor: '#ffffff',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '24px',
  border: '1px solid #e5e7eb'
};

const projectDetailsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '12px',
  marginTop: '12px'
};

const pricingContainerStyle = {
  backgroundColor: '#ffffff',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '24px',
  border: '1px solid #e5e7eb'
};

const headerSectionStyle = {
  marginBottom: '32px',
  paddingBottom: '24px',
  borderBottom: '1px solid #f3f4f6'
};

const headerTitleStyle = {
  fontSize: '20px',
  fontWeight: '600',
  marginBottom: '16px',
  color: '#1f2937'
};

const servicesListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const serviceRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '16px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb'
};

const serviceInfoStyle = {
  flex: 1
};

const serviceNameStyle = {
  fontSize: '16px',
  fontWeight: '500',
  marginBottom: '8px'
};

const subServicesStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px'
};

const subServiceTagStyle = {
  backgroundColor: '#dbeafe',
  color: '#1e40af',
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '12px'
};

const pricingInfoStyle = {
  textAlign: 'right',
  minWidth: '200px'
};

const basePriceStyle = {
  fontSize: '14px',
  color: '#6b7280'
};

const subServicePriceStyle = {
  fontSize: '14px',
  color: '#6b7280',
  marginTop: '4px'
};

const totalPriceStyle = {
  fontSize: '18px',
  fontWeight: '600',
  marginTop: '8px',
  color: '#1f2937'
};

const headerTotalStyle = {
  textAlign: 'right',
  fontSize: '18px',
  fontWeight: '600',
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px solid #e5e7eb'
};

// New discount-related styles
const discountContainerStyle = {
  backgroundColor: '#ffffff',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '24px',
  border: '1px solid #e5e7eb'
};

const discountTypeSelectionStyle = {
  display: 'flex',
  gap: '24px',
  marginBottom: '20px'
};

const radioLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: '500'
};

const radioInputStyle = {
  margin: 0
};

const discountInputsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px',
  marginBottom: '16px'
};

const discountInputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151'
};

const inputWithCurrencyStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center'
};

const currencySymbolStyle = {
  position: 'absolute',
  left: '12px',
  fontSize: '16px',
  color: '#6b7280',
  zIndex: 1
};

const percentSymbolStyle = {
  position: 'absolute',
  right: '12px',
  fontSize: '16px',
  color: '#6b7280',
  zIndex: 1
};

const discountInputStyle = {
  width: '100%',
  padding: '12px 40px 12px 40px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '16px',
  outline: 'none',
  transition: 'border-color 0.2s'
};

const disabledInputStyle = {
  backgroundColor: '#f9fafb',
  color: '#9ca3af',
  cursor: 'not-allowed'
};

const discountPreviewStyle = {
  backgroundColor: '#dcfce7',
  color: '#166534',
  padding: '12px',
  borderRadius: '6px',
  textAlign: 'center',
  fontWeight: '500'
};

const totalsSummaryStyle = {
  backgroundColor: '#ffffff',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '24px',
  border: '2px solid #1e40af'
};

const totalsRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '12px',
  fontSize: '16px'
};

const discountRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '12px',
  fontSize: '16px',
  color: '#dc2626',
  fontWeight: '500'
};

const finalTotalStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '24px',
  fontWeight: '700',
  paddingTop: '16px',
  borderTop: '2px solid #e5e7eb',
  color: '#1e40af'
};

const paymentScheduleStyle = {
  marginTop: '20px',
  paddingTop: '16px',
  borderTop: '1px solid #e5e7eb'
};

const scheduleItemStyle = {
  marginBottom: '8px',
  color: '#6b7280'
};

const actionButtonsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px'
};

export default QuotationPricing;