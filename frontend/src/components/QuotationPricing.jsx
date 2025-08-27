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
  const [discountType, setDiscountType] = useState('amount');
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
    const amount = Math.max(0, Math.min(value, baseTotals.subtotal));
    setDiscountAmount(amount);
    
    if (baseTotals.subtotal > 0) {
      const percent = (amount / baseTotals.subtotal) * 100;
      setDiscountPercent(Math.round(percent * 100) / 100);
    } else {
      setDiscountPercent(0);
    }
  };

  // Handle discount percentage change
  const handleDiscountPercentChange = (value) => {
    const percent = Math.max(0, Math.min(value, 100));
    setDiscountPercent(percent);
    
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

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div>Loading pricing...</div>
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', color: 'red' }}>
      <div>Error: {error}</div>
    </div>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Review and confirm pricing for selected services</h1>
        {quotationData && (
          <p>Project: {quotationData.projectName || quotationData.developerName}</p>
        )}
      </div>

      {/* Pricing Breakdown */}
      <div style={{ marginBottom: '2rem' }}>
        <h2>Services and Pricing</h2>
        {pricingBreakdown.map((header, headerIndex) => (
          <div key={headerIndex} style={{ marginBottom: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
            <h3 style={{ color: '#1e40af', marginBottom: '1rem' }}>{header.header}</h3>
            
            {header.services.map((service, serviceIndex) => (
              <div key={serviceIndex} style={{ marginBottom: '1rem', paddingLeft: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong>{service.name}</strong>
                  <span style={{ fontWeight: 'bold' }}>
                    ₹{service.totalAmount.toLocaleString()}
                  </span>
                </div>
                
                {/* ✅ Fixed: Properly render subServices */}
                {service.subServices && service.subServices.length > 0 && (
                  <div style={{ paddingLeft: '1rem', fontSize: '0.9rem', color: '#666' }}>
                    <strong>Sub-services:</strong>
                    <ul style={{ marginTop: '0.5rem', marginBottom: '0' }}>
                      {service.subServices.map((subService, subIndex) => {
                        // ✅ Handle different subService formats
                        let subServiceName;
                        
                        if (typeof subService === 'string') {
                          subServiceName = subService;
                        } else if (typeof subService === 'object' && subService !== null) {
                          subServiceName = subService.name || subService.text || String(subService);
                        } else {
                          subServiceName = String(subService);
                        }
                        
                        return (
                          <li key={subIndex} style={{ marginBottom: '0.25rem' }}>
                            {subServiceName}
                            {subService.included !== false && (
                              <span style={{ color: '#10b981', marginLeft: '0.5rem' }}>✓</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            
            <div style={{ textAlign: 'right', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontWeight: 'bold' }}>
              Header Total: ₹{header.headerTotal.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Discount Section */}
      <div style={{ marginBottom: '2rem', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
        <h3>Discount</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <label>
            <input
              type="radio"
              name="discountType"
              value="amount"
              checked={discountType === 'amount'}
              onChange={(e) => setDiscountType(e.target.value)}
            />
            Amount (₹)
          </label>
          <label>
            <input
              type="radio"
              name="discountType"
              value="percent"
              checked={discountType === 'percent'}
              onChange={(e) => setDiscountType(e.target.value)}
            />
            Percentage (%)
          </label>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="number"
            placeholder={discountType === 'amount' ? 'Enter amount' : 'Enter percentage'}
            value={discountType === 'amount' ? discountAmount : discountPercent}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              if (discountType === 'amount') {
                handleDiscountAmountChange(value);
              } else {
                handleDiscountPercentChange(value);
              }
            }}
            style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <span>
            {discountType === 'amount' 
              ? `(${finalTotals.discountPercent.toFixed(2)}%)`
              : `(₹${discountAmount.toLocaleString()})`
            }
          </span>
        </div>
      </div>

      {/* Final Totals */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', backgroundColor: '#f8f9fa' }}>
        <h3>Total Summary</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>Subtotal:</span>
          <span>₹{finalTotals.subtotal.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>Discount:</span>
          <span>-₹{finalTotals.discount.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>Subtotal after discount:</span>
          <span>₹{finalTotals.subtotalAfterDiscount.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>GST (18%):</span>
          <span>₹{finalTotals.tax.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', borderTop: '1px solid #ccc', paddingTop: '0.5rem' }}>
          <span>Final Total:</span>
          <span>₹{finalTotals.total.toLocaleString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button
          onClick={() => navigate(`/quotations/${id}/services`)}
          style={{ padding: '0.75rem 1.5rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          Back to Services
        </button>
        <button
          onClick={handleSavePricing}
          disabled={loading}
          style={{ padding: '0.75rem 1.5rem', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          {loading ? 'Saving...' : 'Save & Continue to Summary'}
        </button>
      </div>
    </div>
  );
};

export default QuotationPricing;
