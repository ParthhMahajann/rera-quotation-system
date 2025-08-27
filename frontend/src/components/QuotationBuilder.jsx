import React, { useState, useMemo, useEffect } from "react";
import { useQuotation } from "../context/QuotationContext";
import {
  HEADERS as ALL_HEADERS,
  SERVICES,
  isPackageHeader as checkIsPackageHeader,
  expandPackageServices as expandPackage,
} from "../lib/servicesData";

// ============================================================================
// 1. DATA & LOGIC HOOK
// ============================================================================
const useQuotationLogic = ({ onComplete }) => {
  const { selectedHeaders, addHeader, removeHeader, duplicateChecker } =
    useQuotation();

  const [currentStep, setCurrentStep] = useState("header_selection");
  const [currentHeader, setCurrentHeader] = useState("");
  const [currentServices, setCurrentServices] = useState([]);
  const [customHeaderName, setCustomHeaderName] = useState("");

  const servicesMap = useMemo(() => {
    const map = new Map();
    Object.values(SERVICES).flat().forEach((service) => {
      if (service.name) map.set(service.name, service);
    });
    return map;
  }, [SERVICES]);

  const allAvailableServices = useMemo(() => {
    return Object.values(SERVICES).flat();
  }, [SERVICES]);

  const getServicesForHeader = (headerName) => {
    if (headerName === "Customized Header") {
      return allAvailableServices;
    }
    const specificServices = SERVICES[headerName] || [];
    const addOnServices = SERVICES["Add ons"] || [];
    return [...specificServices, ...addOnServices];
  };

  const isPackageHeader = (headerName) => checkIsPackageHeader(headerName);

  const expandPackageServices = (headerName) => {
    const packageServiceNames = expandPackage(headerName);
    return packageServiceNames
      .map((name) => servicesMap.get(name))
      .filter(Boolean);
  };

  const availableHeaders = useMemo(() => {
    const chosen = new Set(selectedHeaders.map((h) => h.type || h.name));
    return (ALL_HEADERS || []).filter(
      (h) => h === "Customized Header" || !chosen.has(h)
    );
  }, [selectedHeaders]);

  const servicesForUI = useMemo(() => {
    if (!currentHeader) return [];

    const all = getServicesForHeader(currentHeader);

    return all.map((s) => {
      const isChecked = currentServices.some((cs) => cs.name === s.name);
      return {
        ...s,
        isChecked,
        subServices: s.subServices.map((ss) => {
          const isSelectedInCurrent = currentServices
            .find((cs) => cs.name === s.name)
            ?.subServices?.includes(ss);

          const isTakenElsewhere =
            duplicateChecker?.isSubServiceSelected(ss) && !isSelectedInCurrent;

          return {
            name: ss,
            isChecked: isSelectedInCurrent,
            isTakenElsewhere,
          };
        }),
      };
    });
  }, [currentHeader, currentServices, allAvailableServices, duplicateChecker, servicesMap]);

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

  useEffect(() => {
    if (!currentHeader) {
      setCurrentServices([]);
      return;
    }

    if (isPackageHeader(currentHeader)) {
      const servicesForHeader = getServicesForHeader(currentHeader);
      const initialServices = servicesForHeader.map((service) => {
        const isPartOfPackage = expandPackage(currentHeader).includes(
          service.name
        );
        return {
          ...service,
          isChecked: isPartOfPackage,
          subServices: isPartOfPackage ? [...(service.subServices || [])] : [],
        };
      });
      setCurrentServices(initialServices);
    } else {
      const servicesForHeader = getServicesForHeader(currentHeader);
      const initialServices = servicesForHeader.map((service) => ({
        ...service,
        isChecked: false,
        subServices: [],
      }));
      setCurrentServices(initialServices);
    }
  }, [currentHeader]);

  const handleHeaderSelection = (headerType) => {
    setCurrentHeader(headerType);
    setCurrentStep("service_selection");
    setCustomHeaderName(headerType !== "Customized Header" ? headerType : "");
  };

  const handleGoToStep = (step) => {
    setCurrentStep(step);
  };

  const handleServiceToggle = (serviceName, checked) => {
    const serviceTemplate = servicesMap.get(serviceName);
    if (!serviceTemplate) return;

    setCurrentServices((prev) => {
      if (checked) {
        if (!prev.some((s) => s.name === serviceName)) {
          return [
            ...prev,
            {
              ...serviceTemplate,
              subServices: [...(serviceTemplate.subServices || [])],
            },
          ];
        }
      } else {
        return prev.filter((s) => s.name !== serviceName);
      }
      return prev;
    });
  };

  const handleSubServiceToggle = (serviceName, subService, checked) => {
    if (checked && duplicateChecker?.isSubServiceSelected(subService)) return;

    setCurrentServices((prev) =>
      prev.map((s) => {
        if (s.name !== serviceName) return s;
        const currentSubServices = s.subServices || [];
        if (checked) {
          return { ...s, subServices: [...currentSubServices, subService] };
        } else {
          return {
            ...s,
            subServices: currentSubServices.filter((ss) => ss !== subService),
          };
        }
      })
    );
  };

  const handleAddCurrentHeader = () => {
    const headerName =
      currentHeader === "Customized Header"
        ? customHeaderName.trim()
        : currentHeader;
    if (!headerName) return;

    const servicesToAdd = currentServices
      .map((s) => ({
        name: s.name,
        subServices: s.subServices || [],
      }))
      .filter((s) => s.subServices.length > 0);

    if (servicesToAdd.length === 0) return;

    let finalHeaderName = headerName;

    if (isPackageHeader(currentHeader)) {
      const defaultServiceNames = expandPackage(currentHeader);
      const userServiceNames = servicesToAdd.map((s) => s.name);

      const isCustomized =
        defaultServiceNames.length !== userServiceNames.length ||
        !defaultServiceNames.every((d) => userServiceNames.includes(d));

      if (isCustomized) {
        finalHeaderName = `${headerName} (Customized)`;
      }
    }

    addHeader({
      name: finalHeaderName,
      type: currentHeader,
      services: servicesToAdd,
    });

    setCurrentHeader("");
    setCurrentServices([]);
    setCustomHeaderName("");
    setCurrentStep("header_selection");
  };

  return {
    currentStep,
    currentHeader,
    currentServices,
    customHeaderName,
    selectedHeaders,
    availableHeaders,
    servicesForUI,
    totalSelectedSubServices,
    duplicateChecker,
    setCustomHeaderName,
    handleHeaderSelection,
    handleServiceToggle,
    handleSubServiceToggle,
    handleAddCurrentHeader,
    handleGoToStep,
    removeHeader,
    handleComplete: () => onComplete(selectedHeaders),
  };
};

// ============================================================================
// 2. PRESENTATIONAL SUB-COMPONENTS
// ============================================================================

const QuotationStepper = ({ currentStep, hasSelection }) => (
  <div style={stepNavigation}>
    {[
      { step: "header_selection", label: "Select Header" },
      { step: "service_selection", label: "Choose Services" },
      { step: "review", label: "Review & Complete" },
    ].map(({ step, label }, index) => (
      <React.Fragment key={step}>
        {index > 0 && <div style={stepConnector} />}
        <div style={stepItem}>
          <div
            style={{
              ...stepCircle,
              ...(currentStep === step || (step === "review" && hasSelection)
                ? stepCircleActive
                : {}),
            }}
          >
            {index + 1}
          </div>
          <span style={stepLabel}>{label}</span>
        </div>
      </React.Fragment>
    ))}
  </div>
);

const HeaderSelectionStep = ({
  availableHeaders,
  selectedHeaders,
  onHeaderSelect,
  onRemoveHeader,
}) => (
  <div style={stepContent}>
    <h3 style={stepTitle}>Step 1: Select a Header</h3>
    <p style={stepDescription}>
      Choose a header category. You can add multiple headers, but each standard
      header can only be used once.
    </p>
    <div style={headerSelectionGrid}>
      {availableHeaders.map((header) => (
        <button
          key={header}
          onClick={() => onHeaderSelect(header)}
          style={headerButton}
        >
          {header}
        </button>
      ))}
    </div>
    {selectedHeaders.length > 0 && (
      <div style={selectedHeadersSection}>
        <h4 style={sectionTitle}>
          Selected Headers ({selectedHeaders.length})
        </h4>
        {selectedHeaders.map((header, idx) => (
          <div
            key={idx}
            style={{
              ...selectedHeaderItem,
              ...(idx === selectedHeaders.length - 1 ? { borderBottom: 'none' } : {})
            }}
          >
            <span style={headerName}>{header.name}</span>
            <span style={headerServices}>
              {header.services?.length || 0} service(s)
            </span>
            <button onClick={() => onRemoveHeader(idx)} style={removeButton}>
              Remove
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

const ServiceSelectionStep = ({
  currentHeader,
  customHeaderName,
  setCustomHeaderName,
  servicesForUI,
  duplicateChecker,
  onGoBack,
  onServiceToggle,
  onSubServiceToggle,
  onAddHeader,
}) => {
  const isCustom = currentHeader === "Customized Header";
  const canAdd = isCustom ? customHeaderName.trim() : currentHeader;
  const hasSubServices = servicesForUI.some((s) => s.isChecked && s.subServices.some(ss => ss.isChecked));
  
  return (
    <div style={stepContent}>
      <div style={stepHeader}>
        <button onClick={onGoBack} style={backButton}>
          ← Back to Headers
        </button>
        <h3 style={stepTitle}>
          Step 2: Select Services for "
          {isCustom ? customHeaderName || "New Header" : currentHeader}"
        </h3>
      </div>
      {isCustom && (
        <div style={customHeaderInput}>
          <label style={inputLabel}>Custom Header Name</label>
          <input
            type="text"
            value={customHeaderName}
            onChange={(e) => setCustomHeaderName(e.target.value)}
            placeholder="E.g., Phase 1 Services"
            style={textInput}
          />
        </div>
      )}
      <div style={servicesSection}>
        <h4 style={sectionTitle}>Available Services</h4>
        <div style={servicesGrid}>
          {servicesForUI.map((service) => (
            <div key={service.name} style={serviceCard}>
              <label style={serviceLabel}>
                <input
                  type="checkbox"
                  checked={service.isChecked}
                  onChange={(e) =>
                    onServiceToggle(service.name, e.target.checked)
                  }
                  style={checkboxStyle}
                />
                <span style={serviceTitle}>{service.name}</span>
              </label>
              {service.isChecked && service.subServices?.length > 0 && (
                <div style={{ marginTop: 12, paddingLeft: 24 }}>
                  <h5
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Sub-services:
                  </h5>
                  {service.subServices.map((sub) => (
                    <label
                      key={sub.name}
                      style={{
                        display: "block",
                        marginBottom: 6,
                        fontSize: 13,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={sub.isChecked}
                        disabled={sub.isTakenElsewhere}
                        onChange={(e) =>
                          onSubServiceToggle(
                            service.name,
                            sub.name,
                            e.target.checked
                          )
                        }
                        style={{ marginRight: 8 }}
                      />
                      {sub.name}
                      {sub.isTakenElsewhere && (
                        <span style={{ color: "#ef4444", marginLeft: 8 }}>
                          (Already selected)
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={actionButtons}>
        <button
          onClick={onAddHeader}
          disabled={!canAdd || !hasSubServices}
          style={{
            ...btnPrimary,
            ...((!canAdd || !hasSubServices) && btnDisabled),
          }}
        >
          Add Services to Header
        </button>
        <button onClick={onGoBack} style={btnSecondary}>
          Cancel
        </button>
      </div>
    </div>
  );
};

const QuotationSummary = ({
  selectedHeaders,
  totalSelectedSubServices,
  onRemoveHeader,
  onAddMore,
  onComplete,
}) => (
  <div style={summarySection}>
    <h3 style={sectionTitle}>Quotation Summary</h3>
    <div style={summaryStats}>
      <div style={summaryStat}>
        <span style={statNumber}>{selectedHeaders.length}</span>
        <span style={statLabel}>Headers</span>
      </div>
      <div style={summaryStat}>
        <span style={statNumber}>
          {selectedHeaders.reduce((t, h) => t + (h.services?.length || 0), 0)}
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
          <button onClick={() => onRemoveHeader(hi)} style={removeButton}>
            Remove Header
          </button>
        </div>
        {(header.services || []).map((service, si) => (
          <div key={si} style={serviceSummary}>
            <span style={serviceSummaryName}>{service.name}</span>
            {service.subServices?.length > 0 && (
              <div style={subServicesSummary}>
                {service.subServices.map((ss) => (
                  <div key={ss} style={subServiceSummaryItem}>
                    • {ss}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    ))}
    <div style={completionActions}>
      <button
        onClick={onComplete}
        disabled={selectedHeaders.length === 0}
        style={{
          ...btnPrimary,
          ...(selectedHeaders.length === 0 && btnDisabled),
        }}
      >
        Next Step ({totalSelectedSubServices} items)
      </button>
    </div>
  </div>
);

// ============================================================================
// 3. MAIN BUILDER COMPONENT
// ============================================================================
export default function QuotationBuilder({ onComplete }) {
  const logic = useQuotationLogic({ onComplete });

  return (
    <div>
      <QuotationStepper
        currentStep={logic.currentStep}
        hasSelection={logic.selectedHeaders.length > 0}
      />

      {logic.currentStep === "header_selection" && (
        <HeaderSelectionStep
          availableHeaders={logic.availableHeaders}
          selectedHeaders={logic.selectedHeaders}
          onHeaderSelect={logic.handleHeaderSelection}
          onRemoveHeader={logic.removeHeader}
        />
      )}

      {logic.currentStep === "service_selection" && (
        <ServiceSelectionStep
          currentHeader={logic.currentHeader}
          customHeaderName={logic.customHeaderName}
          setCustomHeaderName={logic.setCustomHeaderName}
          servicesForUI={logic.servicesForUI}
          duplicateChecker={logic.duplicateChecker}
          onGoBack={() => logic.handleGoToStep("header_selection")}
          onServiceToggle={logic.handleServiceToggle}
          onSubServiceToggle={logic.handleSubServiceToggle}
          onAddHeader={logic.handleAddCurrentHeader}
        />
      )}

      {logic.selectedHeaders.length > 0 && (
        <QuotationSummary
          selectedHeaders={logic.selectedHeaders}
          totalSelectedSubServices={logic.totalSelectedSubServices}
          onRemoveHeader={logic.removeHeader}
          onAddMore={() => logic.handleGoToStep("header_selection")}
          onComplete={logic.handleComplete}
        />
      )}
    </div>
  );
}

// ============================================================================
// 4. STYLES (unchanged)
// ============================================================================
const builderContainer = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "24px",
  fontFamily: "sans-serif",
};
const stepNavigation = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "32px",
  gap: "16px",
};
const stepItem = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
};
const stepCircle = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  background: "#e5e7eb",
  color: "#6b7280",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 600,
  fontSize: 16,
  transition: "background-color 0.3s",
};
const stepCircleActive = { background: "#1e40af", color: "#ffffff" };
const stepConnector = {
  flex: "1",
  maxWidth: 60,
  height: 2,
  background: "#e5e7eb",
};
const stepLabel = { fontSize: 14, color: "#6b7280", fontWeight: 500 };
const stepContent = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 24,
  marginBottom: 24,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};
const stepHeader = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  marginBottom: 24,
};
const stepTitle = {
  margin: "0 0 8px 0",
  fontSize: 20,
  fontWeight: 600,
  color: "#111827",
};
const stepDescription = {
  margin: "0 0 24px 0",
  color: "#6b7280",
  lineHeight: 1.5,
  fontSize: 14,
};
const backButton = {
  background: "none",
  border: "none",
  color: "#1e40af",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
  padding: "8px 0",
  borderRadius: 4,
};
const headerSelectionGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: 16,
  marginBottom: 32,
};
const headerButton = {
  padding: "16px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 16,
  fontWeight: 500,
  color: "#374151",
  transition: "all 0.2s ease",
  textAlign: "left",
  "&:hover": { borderColor: "#1e40af", color: "#1e40af" },
};
const customHeaderInput = { marginBottom: 24 };
const inputLabel = {
  display: "block",
  marginBottom: 8,
  fontWeight: 500,
  color: "#374151",
  fontSize: 14,
};
const textInput = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  color: "#374151",
  boxSizing: "border-box",
};
const servicesSection = { marginBottom: 24 };
const sectionTitle = {
  margin: "0 0 16px 0",
  fontSize: 18,
  fontWeight: 600,
  color: "#111827",
};
const servicesGrid = { display: "grid", gap: 16 };
const serviceCard = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 16,
  background: "#ffffff",
};
const serviceLabel = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  cursor: "pointer",
};
const serviceTitle = { fontWeight: 600, color: "#111827", fontSize: 15 };
const checkboxStyle = { margin: 0, marginTop: 4, width: 16, height: 16 };
const actionButtons = {
  display: "flex",
  gap: 12,
  justifyContent: "flex-end",
  marginTop: 24,
};
const btnPrimary = {
  padding: "12px 24px",
  background: "#1e40af",
  color: "#ffffff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 500,
  fontSize: 14,
  transition: "background-color 0.2s ease",
};
const btnSecondary = {
  padding: "12px 24px",
  background: "#f3f4f6",
  color: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 500,
  fontSize: 14,
};
const btnDisabled = {
  background: "#9ca3af",
  cursor: "not-allowed",
  color: "#e5e7eb",
  border: "none",
};
const selectedHeadersSection = {
  marginTop: 24,
  padding: 16,
  background: "#f9fafb",
  borderRadius: 6,
  border: "1px solid #e5e7eb",
};
const selectedHeaderItem = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 0",
  borderBottom: "1px solid #e5e7eb",
};
const headerName = { fontWeight: 500, color: "#111827" };
const headerServices = { fontSize: 14, color: "#6b7280" };
const removeButton = {
  padding: "6px 12px",
  background: "#fee2e2",
  color: "#b91c1c",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 500,
};
const summarySection = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 24,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  marginTop: 24,
};
const summaryStats = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 16,
  marginBottom: 32,
};
const summaryStat = {
  textAlign: "center",
  padding: 16,
  background: "#f9fafb",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
};
const statNumber = {
  display: "block",
  fontSize: 28,
  fontWeight: 700,
  color: "#1e40af",
};
const statLabel = {
  fontSize: 14,
  color: "#6b7280",
  fontWeight: 500,
  marginTop: 4,
};
const headerSummary = {
  marginBottom: 16,
  paddingBottom: 16,
  borderBottom: "1px solid #e5e7eb",
  ":last-child": { borderBottom: "none", marginBottom: 0, paddingBottom: 0 },
};
const headerSummaryHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};
const headerSummaryTitle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: "#111827",
};
const serviceSummary = { marginBottom: 12, paddingLeft: 16 };
const serviceSummaryName = { fontWeight: 600, color: "#374151" };
const subServicesSummary = { marginLeft: 16, marginTop: 8 };
const subServiceSummaryItem = {
  fontSize: 14,
  color: "#6b7280",
  padding: "2px 0",
};
const completionActions = {
  display: "flex",
  gap: 16,
  justifyContent: "flex-end",
  marginTop: 24,
  paddingTop: 24,
  borderTop: "1px solid #e5e7eb",
};