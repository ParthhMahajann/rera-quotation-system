// src/components/QuotationBuilder.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useQuotation } from '../context/QuotationContext';
import { HEADERS as ALL_HEADERS, SERVICES, PACKAGES } from '../lib/servicesData';

export default function QuotationBuilder({ onComplete }) {
  const {
    selectedHeaders,
    addHeader,
    removeHeader,
    duplicateChecker
  } = useQuotation();

  const [currentStep, setCurrentStep] = useState('header_selection');
  const [currentHeader, setCurrentHeader] = useState('');
  const [currentServices, setCurrentServices] = useState([]);
  const [customHeaderName, setCustomHeaderName] = useState('');

  // Build a flat map of services by id (works whether PACKAGES stores ids or full objects)
  const servicesById = useMemo(() => {
    const map = new Map();
    Object.values(SERVICES || {}).forEach(arr => {
      (arr || []).forEach(s => {
        if (s?.id) map.set(s.id, s);
      });
    });
    return map;
  }, []);

  const isPackageHeader = (headerName) => !!(PACKAGES && PACKAGES[headerName]);

  const expandPackageServices = (headerName) => {
    const pkg = (PACKAGES && PACKAGES[headerName]) || [];
    if (!Array.isArray(pkg)) return [];
    // If items are strings, treat as ids and look up
    if (pkg.length && typeof pkg[0] === 'string') {
      return pkg.map(id => servicesById.get(id)).filter(Boolean);
    }
    // If items are objects, return as-is
    if (pkg.length && typeof pkg[0] === 'object') {
      return pkg;
    }
    return [];
  };

  const getServicesForHeader = (headerName) => {
    if (!headerName) return [];
    if (isPackageHeader(headerName)) return expandPackageServices(headerName);
    return (SERVICES && SERVICES[headerName]) || [];
  };

  // Available headers (exclude previously selected; allow multiple "Customized Header")
  const availableHeaders = useMemo(() => {
    const chosen = new Set(selectedHeaders.map(h => h.type || h.name));
    return (ALL_HEADERS || []).filter(h => h === 'Customized Header' || !chosen.has(h));
  }, [selectedHeaders]);

  // When header changes, (re)load services
  useEffect(() => {
    if (!currentHeader) {
      setCurrentServices([]);
      return;
    }
    const base = getServicesForHeader(currentHeader);
    // For package headers, preselect all services and all their sub-services
    if (isPackageHeader(currentHeader)) {
      setCurrentServices(base.map(s => ({
        ...s,
        subServices: [...(s.subServices || [])]
      })));
    } else {
      // For normal headers, no service or sub-service preselected
      setCurrentServices(base.map(s => ({ ...s, subServices: [] })));
    }
  }, [currentHeader]);

  // Header selection
  const handleHeaderSelection = (headerType) => {
    setCurrentHeader(headerType);
    setCurrentStep('service_selection');
    setCustomHeaderName('');
  };

  // Service checkbox toggle (for non-package or to deselect inside package)
  const handleServiceToggle = (serviceId, checked) => {
    if (!currentHeader || currentHeader === 'Customized Header') return;

    const all = getServicesForHeader(currentHeader);
    const svc = all.find(s => s.id === serviceId);
    if (!svc) return;

    if (checked) {
      if (!currentServices.some(s => s.id === serviceId)) {
        setCurrentServices(prev => [...prev, { ...svc, subServices: [] }]);
      }
    } else {
      setCurrentServices(prev => prev.filter(s => s.id !== serviceId));
    }
  };

  // Sub-service toggle with duplicate prevention (disable if already chosen elsewhere)
  const handleSubServiceToggle = (serviceId, subService, checked) => {
    const takenElsewhere = duplicateChecker?.isSubServiceSelected(subService.id);

    // Block selecting if already selected in another header/service
    if (checked && takenElsewhere) return;

    setCurrentServices(prev =>
      prev.map(s => {
        if (s.id !== serviceId) return s;
        const list = s.subServices || [];
        const exists = list.some(x => x.id === subService.id);
        if (checked && !exists) return { ...s, subServices: [...list, subService] };
        if (!checked && exists) return { ...s, subServices: list.filter(x => x.id !== subService.id) };
        return s;
      })
    );
  };

  // Add current header to context
  const handleAddCurrentHeader = () => {
    if (!currentHeader) return;
    const headerName =
      currentHeader === 'Customized Header' ? customHeaderName.trim() : currentHeader;
    if (!headerName) return;

    // keep services that have at least one sub-service chosen
    const servicesToAdd = currentServices
      .map(s => ({
        id: s.id,
        label: s.label,
        subServices: (s.subServices || [])
      }))
      .filter(s => s.subServices.length > 0);

    if (servicesToAdd.length === 0) return;

    addHeader({
      name: headerName,
      type: currentHeader,
      services: servicesToAdd
    });

    // reset
    setCurrentHeader('');
    setCurrentServices([]);
    setCustomHeaderName('');
    setCurrentStep('header_selection');
  };

  // Build services list for the UI
  const servicesForUI = useMemo(() => {
    if (!currentHeader || currentHeader === 'Customized Header') return [];
    const all = getServicesForHeader(currentHeader);
    return all.map(s => ({
      ...s,
      isChecked: currentServices.some(x => x.id === s.id)
    }));
  }, [currentHeader, currentServices]);

  // Stats
  const totalSelectedSubServices = useMemo(() => {
    return selectedHeaders.reduce(
      (sum, h) =>
        sum +
        (h.services || []).reduce(
          (a, s) => a + (s.subServices?.length || 0),
          0
        ),
      0
    );
  }, [selectedHeaders]);

  const handleComplete = () => onComplete(selectedHeaders);

  return (
    <div style={builderContainer}>
      {/* Stepper */}
      <div style={stepNavigation}>
        <div style={stepItem}>
          <div style={{ ...stepCircle, ...(currentStep === 'header_selection' ? stepCircleActive : {}) }}>1</div>
          <span style={stepLabel}>Select Header</span>
        </div>
        <div style={stepConnector} />
        <div style={stepItem}>
          <div style={{ ...stepCircle, ...(currentStep === 'service_selection' ? stepCircleActive : {}) }}>2</div>
          <span style={stepLabel}>Choose Services</span>
        </div>
        <div style={stepConnector} />
        <div style={stepItem}>
          <div style={{ ...stepCircle, ...(selectedHeaders.length > 0 ? stepCircleActive : {}) }}>3</div>
          <span style={stepLabel}>Review & Complete</span>
        </div>
      </div>

      {/* Step: Headers */}
      {currentStep === 'header_selection' && (
        <div style={stepContent}>
          <h3 style={stepTitle}>Step 1: Select a Header</h3>
          <p style={stepDescription}>
            Choose a header category. You can add multiple headers.
            Once used, a header can’t be selected again (you can add multiple “Customized Header” entries).
          </p>

          <div style={headerSelectionGrid}>
            {availableHeaders.map(header => (
              <button key={header} onClick={() => handleHeaderSelection(header)} style={headerButton}>
                {header}
              </button>
            ))}
          </div>

          {selectedHeaders.length > 0 && (
            <div style={selectedHeadersSection}>
              <h4 style={sectionTitle}>Selected Headers ({selectedHeaders.length})</h4>
              {selectedHeaders.map((header, idx) => (
                <div key={idx} style={selectedHeaderItem}>
                  <span style={headerName}>{header.name}</span>
                  <span style={headerServices}>
                    {(header.services || []).length} service{(header.services || []).length !== 1 ? 's' : ''}
                  </span>
                  <button onClick={() => removeHeader(idx)} style={removeButton}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step: Services */}
      {currentStep === 'service_selection' && (
        <div style={stepContent}>
          <div style={stepHeader}>
            <button onClick={() => setCurrentStep('header_selection')} style={backButton}>← Back to Headers</button>
            <h3 style={stepTitle}>
              Step 2: Select Services for "{currentHeader === 'Customized Header' ? customHeaderName : currentHeader}"
            </h3>
          </div>

          {/* Custom header input */}
          {currentHeader === 'Customized Header' && (
            <div style={customHeaderInput}>
              <label style={inputLabel}>Custom Header Name</label>
              <input
                type="text"
                value={customHeaderName}
                onChange={(e) => setCustomHeaderName(e.target.value)}
                placeholder="Enter custom header name"
                style={textInput}
              />
            </div>
          )}

          {/* Services list */}
          {currentHeader !== 'Customized Header' && (
            <div style={servicesSection}>
              <h4 style={sectionTitle}>Available Services</h4>
              <div style={servicesGrid}>
                {servicesForUI.map(service => (
                  <div key={service.id} style={serviceCard}>
                    <label style={serviceLabel}>
                      <input
                        type="checkbox"
                        checked={!!service.isChecked}
                        onChange={(e) => handleServiceToggle(service.id, e.target.checked)}
                        style={checkboxStyle}
                      />
                      <div style={serviceContent}>
                        <span style={serviceTitle}>{service.label}</span>
                      </div>
                    </label>

                    {/* Sub-services */}
                    {service.subServices && service.isChecked && (
                      <div style={{ marginTop: 12, paddingLeft: 24 }}>
                        <h5 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>Sub-services:</h5>
                        {service.subServices.map((sub) => {
                          const selectedInThisService = currentServices
                            .find(s => s.id === service.id)?.subServices?.some(x => x.id === sub.id);
                          const takenElsewhere = duplicateChecker?.isSubServiceSelected(sub.id);
                          const isDisabled = takenElsewhere && !selectedInThisService; // show but disable if taken elsewhere
                          return (
                            <label key={sub.id} style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>
                              <input
                                type="checkbox"
                                checked={!!selectedInThisService}
                                disabled={isDisabled}
                                onChange={(e) => handleSubServiceToggle(service.id, sub, e.target.checked)}
                                style={{ marginRight: 8 }}
                              />
                              {sub.text}
                              {isDisabled && <span style={{ color: '#ef4444', marginLeft: 8 }}>(Already selected)</span>}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={actionButtons}>
            <button
              onClick={handleAddCurrentHeader}
              disabled={
                !currentHeader ||
                (currentHeader === 'Customized Header' && !customHeaderName.trim()) ||
                currentServices.every(s => (s.subServices || []).length === 0)
              }
              style={{
                ...btnPrimary,
                ...(!currentHeader ||
                (currentHeader === 'Customized Header' && !customHeaderName.trim()) ||
                currentServices.every(s => (s.subServices || []).length === 0)
                  ? btnDisabled
                  : {})
              }}
            >
              Add Services to Header
            </button>
            <button onClick={() => setCurrentStep('header_selection')} style={btnSecondary}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      {selectedHeaders.length > 0 && (
        <div style={summarySection}>
          <h3 style={sectionTitle}>Quotation Summary</h3>
          <div style={summaryStats}>
            <div style={summaryStat}>
              <span style={statNumber}>{selectedHeaders.length}</span>
              <span style={statLabel}>Headers</span>
            </div>
            <div style={summaryStat}>
              <span style={statNumber}>
                {selectedHeaders.reduce((t, h) => t + ((h.services && h.services.length) || 0), 0)}
              </span>
              <span style={statLabel}>Services</span>
            </div>
            <div style={summaryStat}>
              <span style={statNumber}>{totalSelectedSubServices}</span>
              <span style={statLabel}>Sub-Services</span>
            </div>
          </div>

          {selectedHeaders.map((header, hi) => (
            <div key={hi} style={headerSummary}>
              <div style={headerSummaryHeader}>
                <h4 style={headerSummaryTitle}>{header.name}</h4>
                <button onClick={() => removeHeader(hi)} style={removeButton}>Remove Header</button>
              </div>
              {(header.services || []).map((service, si) => (
                <div key={si} style={serviceSummary}>
                  <div style={serviceSummaryHeader}>
                    <span style={serviceSummaryName}>{service.label}</span>
                  </div>
                  {service.subServices?.length > 0 && (
                    <div style={subServicesSummary}>
                      {service.subServices.map((ss) => (
                        <div key={ss.id} style={subServiceSummaryItem}>• {ss.text}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          <div style={completionActions}>
            <button onClick={() => setCurrentStep('header_selection')} style={btnSecondary}>Add More Headers</button>
            <button
              onClick={handleComplete}
              disabled={selectedHeaders.length === 0}
              style={{ ...btnPrimary, ...(selectedHeaders.length === 0 ? btnDisabled : {}) }}
            >
              Complete Quotation ({totalSelectedSubServices} items)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles (same as before)
const builderContainer = { maxWidth: 1200, margin: '0 auto', padding: '24px' };
const stepNavigation = { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', gap: '16px' };
const stepItem = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' };
const stepCircle = { width: 40, height: 40, borderRadius: '50%', background: '#e5e7eb', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16 };
const stepCircleActive = { background: '#1e40af', color: '#ffffff' };
const stepConnector = { width: 60, height: 2, background: '#e5e7eb' };
const stepLabel = { fontSize: 14, color: '#6b7280', fontWeight: 500 };
const stepContent = { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const stepHeader = { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 };
const stepTitle = { margin: '0 0 16px 0', fontSize: 20, fontWeight: 600, color: '#111827' };
const stepDescription = { margin: '0 0 24px 0', color: '#6b7280', lineHeight: 1.5 };
const backButton = { background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontSize: 14, fontWeight: 500, padding: '8px 12px', borderRadius: 4, transition: 'background-color 0.2s ease' };
const headerSelectionGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 };
const headerButton = { padding: '16px 20px', background: '#ffffff', border: '2px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 500, color: '#374151', transition: 'all 0.2s ease', textAlign: 'left' };
const customHeaderInput = { marginBottom: 24 };
const inputLabel = { display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' };
const textInput = { width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, color: '#374151'};
const servicesSection = { marginBottom: 24 };
const sectionTitle = { margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#111827' };
const servicesGrid = { display: 'grid', gap: 16 };
const serviceCard = { border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#ffffff' };
const serviceLabel = { display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 12 };
const serviceContent = { flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const serviceTitle = { fontWeight: 500, color: '#111827', fontSize: 16 };
const checkboxStyle = { margin: 0, marginTop: 2 };
const actionButtons = { display: 'flex', gap: 12, justifyContent: 'flex-end' };
const btnPrimary = { padding: '12px 24px', background: '#1e40af', color: '#ffffff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: 14, transition: 'background-color 0.2s ease' };
const btnSecondary = { padding: '12px 24px', background: '#6b7280', color: '#ffffff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: 14 };
const btnDisabled = { background: '#9ca3af', cursor: 'not-allowed' };
const selectedHeadersSection = { marginTop: 24, padding: 16, background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' };
const selectedHeaderItem = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e5e7eb' };
const headerName = { fontWeight: 500, color: '#111827' };
const headerServices = { fontSize: 14, color: '#6b7280' };
const removeButton = { padding: '6px 12px', background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 };
const summarySection = { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const summaryStats = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 };
const summaryStat = { textAlign: 'center', padding: 20, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' };
const statNumber = { display: 'block', fontSize: 32, fontWeight: 700, color: '#1e40af', marginBottom: 8 };
const statLabel = { fontSize: 14, color: '#6b7280', fontWeight: 500 };
const headerSummary = { marginBottom: 24, padding: 16, background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' };
const headerSummaryHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 };
const headerSummaryTitle = { margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' };
const serviceSummary = { marginBottom: 16, padding: 12, background: '#ffffff', borderRadius: 4, border: '1px solid #e5e7eb' };
const serviceSummaryHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 };
const serviceSummaryName = { fontWeight: 500, color: '#374151' };
const subServicesSummary = { marginLeft: 16 };
const subServiceSummaryItem = { fontSize: 13, color: '#6b7280', marginBottom: 4 };
const completionActions = { display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 32, paddingTop: 24, borderTop: '1px solid #e5e7eb' };
