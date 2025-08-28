import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const QuotationPricing = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [quotationData, setQuotationData] = useState(null);
  const [pricingBreakdown, setPricingBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Discount state for the total amount
  const [discountType, setDiscountType] = useState('none'); // 'none', 'amount', or 'percent'
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

        // Initialize pricing breakdown with discount fields
        const initialPricingBreakdown = pricingData.breakdown.map(header => ({
          ...header,
          services: header.services.map(service => ({
            ...service,
            discountType: 'none', // 'none', 'amount', or 'percent'
            discountAmount: 0,
            discountPercent: 0,
            finalAmount: service.totalAmount,
          }))
        }));

        // Load existing discounts if available from the quotation data
        if (quotation.data.pricingBreakdown) {
          const loadedPricing = initialPricingBreakdown.map(header => ({
            ...header,
            services: header.services.map(service => {
              const savedService = quotation.data.pricingBreakdown
                .find(h => h.header === header.header)?.services
                .find(s => s.name === service.name);
              
              if (savedService) {
                return {
                  ...service,
                  discountType: savedService.discountType || 'none',
                  discountAmount: savedService.discountAmount || 0,
                  discountPercent: savedService.discountPercent || 0,
                  finalAmount: savedService.finalAmount || service.totalAmount,
                };
              }
              return service;
            })
          }));
          setPricingBreakdown(loadedPricing);
        } else {
          setPricingBreakdown(initialPricingBreakdown);
        }

        // Load existing total discount if available
        if (quotation.data.discountAmount && quotation.data.discountType === 'global') {
          setDiscountAmount(quotation.data.discountAmount);
          setDiscountType('amount');
        } else if (quotation.data.discountPercent && quotation.data.discountType === 'global') {
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

  // Handle discount type change for a specific service
  const handleServiceDiscountTypeChange = (headerIndex, serviceIndex, newDiscountType) => {
    // If a global discount is set, disable individual discounts
    if (discountType !== 'none') return;

    setPricingBreakdown(prevBreakdown => {
      const newBreakdown = [...prevBreakdown];
      const service = newBreakdown[headerIndex].services[serviceIndex];
      
      // Reset discount values when changing type
      service.discountType = newDiscountType;
      service.discountAmount = 0;
      service.discountPercent = 0;
      service.finalAmount = service.totalAmount;
      
      return newBreakdown;
    });
  };

  // Handle discount value change for a specific service with a 20% threshold
  const handleServiceDiscountChange = (headerIndex, serviceIndex, value) => {
    // If a global discount is set, disable individual discounts
    if (discountType !== 'none') return;

    setPricingBreakdown(prevBreakdown => {
      const newBreakdown = [...prevBreakdown];
      const service = newBreakdown[headerIndex].services[serviceIndex];
      const subtotal = service.totalAmount;
      const maxDiscountPercent = 20;
      
      let newDiscountAmount = 0;
      let newDiscountPercent = 0;

      if (service.discountType === 'amount') {
        const maxAmount = (subtotal * maxDiscountPercent) / 100;
        newDiscountAmount = Math.max(0, Math.min(value, maxAmount));
        newDiscountPercent = subtotal > 0 ? (newDiscountAmount / subtotal) * 100 : 0;
      } else if (service.discountType === 'percent') {
        newDiscountPercent = Math.max(0, Math.min(value, maxDiscountPercent));
        newDiscountAmount = (newDiscountPercent / 100) * subtotal;
      }

      service.discountAmount = newDiscountAmount;
      service.discountPercent = newDiscountPercent;
      service.finalAmount = Math.round(subtotal - newDiscountAmount);

      return newBreakdown;
    });
  };

  // Calculate base totals (without any discount applied)
  const baseTotals = useMemo(() => {
    const subtotal = pricingBreakdown.reduce((acc, header) => {
      const headerTotal = header.services.reduce((sum, service) => 
        sum + (service.totalAmount || 0), 0);
      return acc + headerTotal;
    }, 0);

    return { subtotal };
  }, [pricingBreakdown]);

  // Calculate individual service discounts totals
  const individualDiscountTotals = useMemo(() => {
    const totalIndividualDiscount = pricingBreakdown.reduce((acc, header) => 
      acc + header.services.reduce((sum, service) => 
        sum + (service.discountAmount || 0), 0), 0);
    
    const totalIndividualDiscountPercent = baseTotals.subtotal > 0 
      ? (totalIndividualDiscount / baseTotals.subtotal) * 100 
      : 0;

    return {
      totalIndividualDiscount,
      totalIndividualDiscountPercent
    };
  }, [pricingBreakdown, baseTotals.subtotal]);

  // Handle total discount amount change
  const handleTotalDiscountAmountChange = (value) => {
    const subtotal = baseTotals.subtotal;
    const maxAmount = (subtotal * 20) / 100;
    const amount = Math.max(0, Math.min(value, maxAmount));
    
    setDiscountAmount(amount);
    
    if (subtotal > 0) {
      const percent = (amount / subtotal) * 100;
      setDiscountPercent(Math.round(percent * 100) / 100);
    } else {
      setDiscountPercent(0);
    }
  };

  // Handle total discount percentage change
  const handleTotalDiscountPercentChange = (value) => {
    const subtotal = baseTotals.subtotal;
    const percent = Math.max(0, Math.min(value, 20));
    
    setDiscountPercent(percent);
    const amount = (percent / 100) * subtotal;
    setDiscountAmount(Math.round(amount));
  };

  // Calculate final totals with discount
  const finalTotals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;

    if (discountType === 'none') {
      // Calculate totals based on individual service discounts
      subtotal = pricingBreakdown.reduce((acc, header) => 
        acc + header.services.reduce((sum, service) => 
          sum + service.totalAmount, 0), 0);
      discount = pricingBreakdown.reduce((acc, header) => 
        acc + header.services.reduce((sum, service) => 
          sum + service.discountAmount, 0), 0);
    } else {
      // Calculate totals based on the global discount
      subtotal = baseTotals.subtotal;
      discount = discountAmount;
    }

    const subtotalAfterDiscount = subtotal - discount;
    const tax = Math.round(subtotalAfterDiscount * 0.18); // 18% GST
    const total = subtotalAfterDiscount + tax;

    return {
      subtotal,
      discount,
      subtotalAfterDiscount,
      tax,
      total,
      // Add a property to check if a global discount is applied for conditional rendering
      isGlobalDiscount: discountType !== 'none',
    };
  }, [pricingBreakdown, discountType, discountAmount, baseTotals.subtotal]);

const handleSavePricing = async () => {
  try {
    setLoading(true);
    
    const payload = {
      totalAmount: finalTotals.total,
      discountAmount: finalTotals.discount,
      discountType: discountType === 'none' ? 'individual' : 'global',
      pricingBreakdown: pricingBreakdown.map(header => ({
        ...header,
        services: header.services.map(service => ({
          ...service,
          discountType: discountType === 'none' ? service.discountType : 'none',
          discountAmount: discountType === 'none' ? service.discountAmount : 0,
          discountPercent: discountType === 'none' ? service.discountPercent : 0,
          finalAmount: discountType === 'none' ? service.finalAmount : service.totalAmount,
        }))
      })),
    };

    await fetch(`/api/quotations/${id}/pricing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Navigate to terms instead of summary
    navigate(`/quotations/${id}/terms`);
  } catch (err) {
    console.error('Error saving pricing:', err);
    setError('Failed to save pricing');
  } finally {
    setLoading(false);
  }
};

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="quotation-pricing">
      <h2>Project: {quotationData?.projectName || quotationData?.developerName}</h2>
      
      {/* Individual Service Discounts Section */}
      <div className="pricing-breakdown">
        <h3>Service Pricing</h3>
        
        {/* Show current individual discounts summary */}
        {individualDiscountTotals.totalIndividualDiscount > 0 && (
          <div className="individual-discount-summary">
            <p><strong>Current Individual Service Discounts Applied:</strong></p>
            <p>Total Discount: ₹{Math.round(individualDiscountTotals.totalIndividualDiscount)} 
               ({individualDiscountTotals.totalIndividualDiscountPercent.toFixed(2)}%)</p>
          </div>
        )}

        {pricingBreakdown.map((header, headerIndex) => (
          <div key={headerIndex} className="header-section">
            <h4>{header.header}</h4>
            {header.services.map((service, serviceIndex) => (
              <div key={serviceIndex} className="service-item">
                <div className="service-info">
                  <span className="service-name">{service.name}</span>
                  <span className="service-amount">₹{service.totalAmount}</span>
                </div>
                
                {/* Discount Selection Dropdown */}
                <div className="discount-controls">
                  <select
                    value={service.discountType}
                    onChange={(e) => handleServiceDiscountTypeChange(headerIndex, serviceIndex, e.target.value)}
                    disabled={discountType !== 'none'}
                    className="discount-type-dropdown"
                  >
                    <option value="none">No Discount</option>
                    <option value="percent">Percentage Discount</option>
                    <option value="amount">Amount Discount</option>
                  </select>

                  {/* Discount Value Input */}
                  {service.discountType !== 'none' && (
                    <div className="discount-input">
                      <input
                        type="text"
                        min="0"
                        max={service.discountType === 'percent' ? 20 : (service.totalAmount * 0.2)}
                        step={service.discountType === 'percent' ? "0.01" : "1"}
                        value={service.discountType === 'percent' ? service.discountPercent : service.discountAmount}
                        onChange={(e) => handleServiceDiscountChange(headerIndex, serviceIndex, parseFloat(e.target.value) || 0)}
                        disabled={discountType !== 'none'}
                        placeholder={service.discountType === 'percent' ? "0.00%" : "₹0"}
                      />
                      <span className="discount-unit">
                        {service.discountType === 'percent' ? '%' : '₹'}
                      </span>
                      <span className="max-discount-info">
                        (Max: {service.discountType === 'percent' ? '20%' : `₹${Math.round(service.totalAmount * 0.2)}`})
                      </span>
                    </div>
                  )}

                  {/* Show final amount */}
                  {service.discountType !== 'none' && (
                    <div className="final-amount">
                      Final Amount: ₹{service.finalAmount}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Global Discount Section */}
      <div className="global-discount-section">
        <h3>Global Discount (Optional)</h3>
        <p><em>Note: Applying a global discount will override all individual service discounts.</em></p>
        
        <div className="global-discount-controls">
          <div className="discount-type-selection">
            <label>
              <input
                type="radio"
                name="globalDiscountType"
                value="none"
                checked={discountType === 'none'}
                onChange={() => setDiscountType('none')}
              />
              No Global Discount
            </label>
            <label>
              <input
                type="radio"
                name="globalDiscountType"
                value="percent"
                checked={discountType === 'percent'}
                onChange={() => setDiscountType('percent')}
              />
              Percentage Discount
            </label>
            <label>
              <input
                type="radio"
                name="globalDiscountType"
                value="amount"
                checked={discountType === 'amount'}
                onChange={() => setDiscountType('amount')}
              />
              Amount Discount
            </label>
          </div>

          {discountType === 'percent' && (
            <div className="discount-input">
              <input
                type="text"
                min="0"
                max="20"
                step="0.01"
                value={discountPercent}
                onChange={(e) => handleTotalDiscountPercentChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00%"
              />
              <span className="discount-unit">%</span>
              <span className="max-discount-info">(Max: 20%)</span>
            </div>
          )}

          {discountType === 'amount' && (
            <div className="discount-input">
              <input
                type="number"
                min="0"
                max={baseTotals.subtotal * 0.2}
                step="1"
                value={discountAmount}
                onChange={(e) => handleTotalDiscountAmountChange(parseFloat(e.target.value) || 0)}
                placeholder="₹0"
              />
              <span className="discount-unit">₹</span>
              <span className="max-discount-info">(Max: ₹{Math.round(baseTotals.subtotal * 0.2)})</span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="pricing-summary">
        <h3>Pricing Summary</h3>
        <div className="summary-line">
          <span>Subtotal:</span>
          <span>₹{finalTotals.subtotal}</span>
        </div>
        {finalTotals.discount > 0 && (
          <div className="summary-line discount">
            <span>Discount ({finalTotals.isGlobalDiscount ? 'Global' : 'Individual Services'}):</span>
            <span>-₹{Math.round(finalTotals.discount)}</span>
          </div>
        )}
        <div className="summary-line">
          <span>Subtotal After Discount:</span>
          <span>₹{finalTotals.subtotalAfterDiscount}</span>
        </div>
        <div className="summary-line">
        </div>
        <div className="summary-line total">
          <span><strong>Total:</strong></span>
          <span><strong>₹{finalTotals.total}</strong></span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate(`/quotations/${id}/services`)}
        >
          Back
        </button>
        <button 
          className="btn btn-primary" 
          onClick={handleSavePricing}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>

      {/* Add some basic styles */}
      <style jsx>{`
        .quotation-pricing {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .individual-discount-summary {
          background-color: #e8f5e8;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }

        .header-section {
          margin-bottom: 30px;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 20px;
        }

        .service-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 0;
          border-bottom: 1px solid #eee;
        }

        .service-item:last-child {
          border-bottom: none;
        }

        .service-info {
          display: flex;
          justify-content: space-between;
          width: 40%;
        }

        .discount-controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 55%;
        }

        .discount-type-dropdown {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }

        .discount-input {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .discount-input input {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 100px;
        }

        .discount-unit {
          font-weight: bold;
        }

        .max-discount-info {
          font-size: 12px;
          color: #666;
        }

        .final-amount {
          font-weight: bold;
          color: #007bff;
        }

        .global-discount-section {
          margin: 30px 0;
          padding: 20px;
          border: 2px solid #007bff;
          border-radius: 5px;
          background-color: #f8f9ff;
        }

        .global-discount-controls {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .discount-type-selection {
          display: flex;
          gap: 20px;
        }

        .pricing-summary {
          margin-top: 30px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
          background-color: #f9f9f9;
        }

        .summary-line {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }

        .summary-line.discount {
          color: #dc3545;
        }

        .summary-line.total {
          border-top: 2px solid #333;
          border-bottom: none;
          font-size: 18px;
        }

        .action-buttons {
          display: flex;
          gap: 15px;
          justify-content: flex-end;
          margin-top: 30px;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading, .error {
          text-align: center;
          padding: 50px;
          font-size: 18px;
        }

        .error {
          color: #dc3545;
        }
      `}</style>
    </div>
  );
};

export default QuotationPricing;