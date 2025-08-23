import React from 'react';
import QuotationBuilder from '../components/QuotationBuilder';

export default function TestQuotation() {
  const handleComplete = (selections) => {
    console.log('Quotation completed:', selections);
    alert(`Quotation completed with ${selections.length} headers!`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Test Quotation System</h1>
      <p>This is a test page to verify the quotation system is working correctly.</p>
      
      <QuotationBuilder onComplete={handleComplete} />
    </div>
  );
}
