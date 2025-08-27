// src/components/QuotationBuilder.jsx
import React, { useState } from "react";
import {
  getAvailableHeaders,
  getServicesForHeader,
  expandPackageServices,
  isPackageHeader,
} from "../lib/servicesData";

export default function QuotationBuilder({ onComplete }) {
  const [selectedHeaders, setSelectedHeaders] = useState([]);
  const [selectedServices, setSelectedServices] = useState({});
  const [currentHeader, setCurrentHeader] = useState(null);
  const [summary, setSummary] = useState({}); // store header -> services summary

  // Add a header
  const addHeader = (header) => {
    if (selectedHeaders.includes(header)) return;
    setSelectedHeaders([...selectedHeaders, header]);

    if (isPackageHeader(header)) {
  const packageServices = expandPackageServices(header);
  setSelectedServices((prev) => {
    const newState = { ...prev };
    packageServices.forEach((service) => {
      const subServices = {};
      if (service.subServices) {
        service.subServices.forEach((sub) => {
          subServices[sub.name || sub] = true; // ✅ pre-check all subs
        });
      }
      newState[service.name] = {
        checked: true,
        subServices,
      };
    });
    return newState;
  });
}
    setCurrentHeader(header);
  };

  // Toggle parent service (auto-select/unselect all sub-services)
  const onServiceToggle = (serviceName, isChecked, serviceData = {}) => {
    setSelectedServices((prev) => {
      const subServices = {};
      if (serviceData.subServices) {
        serviceData.subServices.forEach((sub) => {
          subServices[sub.name || sub] = isChecked;
        });
      }
      return {
        ...prev,
        [serviceName]: {
          ...(prev[serviceName] || { subServices: {} }),
          checked: isChecked,
          subServices: {
            ...(prev[serviceName]?.subServices || {}),
            ...subServices,
          },
        },
      };
    });
  };

  // Toggle sub-service
  const onSubServiceToggle = (
    parentName,
    subServiceName,
    isChecked,
    parentData = {}
  ) => {
    setSelectedServices((prev) => {
      const updatedSubServices = {
        ...(prev[parentName]?.subServices || {}),
        [subServiceName]: isChecked,
      };
      const subServiceList =
        parentData.subServices || Object.keys(updatedSubServices);
      const allUnchecked = subServiceList.every(
        (sub) => !updatedSubServices[sub.name || sub]
      );
      return {
        ...prev,
        [parentName]: {
          ...(prev[parentName] || {}),
          checked: !allUnchecked,
          subServices: updatedSubServices,
        },
      };
    });
  };

  // Save current header selection into summary
  const saveCurrentHeader = () => {
    if (!currentHeader) return;
    const servicesForHeader = getServicesForHeader(currentHeader).map(
      (service) => {
        const selected = selectedServices[service.name] || {
          checked: false,
          subServices: {},
        };
        return {
          ...service,
          isChecked: selected.checked,
          subServices: service.subServices
            ? service.subServices.map((sub) => ({
                name: sub.name || sub,
                isChecked: selected.subServices[sub.name || sub] || false,
              }))
            : [],
        };
      }
    );
    setSummary((prev) => ({
      ...prev,
      [currentHeader]: servicesForHeader,
    }));
    setCurrentHeader(null);
  };

  // Edit a header from summary
  const editHeader = (header) => {
    setCurrentHeader(header);
  };

  // Build services for UI
  const servicesForUI = currentHeader
    ? getServicesForHeader(currentHeader).map((service) => {
        const selected = selectedServices[service.name] || {
          checked: false,
          subServices: {},
        };
        return {
          ...service,
          isChecked: selected.checked,
          subServices: service.subServices
            ? service.subServices.map((sub) => ({
                name: sub.name || sub,
                isChecked: selected.subServices[sub.name || sub] || false,
              }))
            : [],
        };
      })
    : [];

  // Reusable Service Card
  const ServiceCard = ({ service }) => (
    <div
      key={service.name}
      style={{
        padding: "0.75rem",
        border: "1px solid #ddd",
        borderRadius: "0.5rem",
      }}
    >
      <label style={{ fontWeight: 500 }}>
        <input
          type="checkbox"
          checked={service.isChecked}
          onChange={(e) =>
            onServiceToggle(service.name, e.target.checked, service)
          }
          style={{ marginRight: "0.5rem" }}
        />
        {service.name}{" "}
        {service.category === "addon" && (
          <span style={{ color: "#6b7280" }}>(Add-on)</span>
        )}
      </label>

      {service.isChecked && service.subServices.length > 0 && (
        <div style={{ marginTop: "0.5rem", paddingLeft: "1rem" }}>
          <h5 style={{ marginBottom: "0.25rem" }}>Sub-services:</h5>
          {service.subServices.map((sub) => (
            <label
              key={sub.name}
              style={{
                display: "block",
                fontSize: "0.9rem",
                marginBottom: "0.25rem",
              }}
            >
              <input
                type="checkbox"
                checked={sub.isChecked}
                onChange={(e) =>
                  onSubServiceToggle(service.name, sub.name, e.target.checked, service)
                }
                style={{ marginRight: "0.5rem" }}
              />
              {sub.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Quotation Builder</h2>

      {/* Header selection */}
      {!currentHeader && (
        <div style={{ marginBottom: "2rem" }}>
          <h3>Select Header:</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            {getAvailableHeaders(selectedHeaders).map((header) => (
              <div
                key={header}
                onClick={() => addHeader(header)}
                style={{
                  padding: "1rem",
                  border: "1px solid #ccc",
                  borderRadius: "0.75rem",
                  cursor: "pointer",
                  background: currentHeader === header ? "#eef6ff" : "transparent",
                }}
              >
                <strong>{header}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {currentHeader && (
        <div style={{ marginTop: "2rem" }}>
          <h3>{currentHeader}</h3>
          <div style={{ marginTop: "1rem" }}>
            {/* Main Services */}
            {servicesForUI.some((s) => s.category === "main") && (
              <>
                <h4>Available Services</h4>
                <div style={{ display: "grid", gap: "1rem" }}>
                  {servicesForUI
                    .filter((s) => s.category === "main")
                    .map((service) => (
                      <ServiceCard key={service.name} service={service} />
                    ))}
                </div>
              </>
            )}
            {/* Add-ons */}
            {servicesForUI.some((s) => s.category === "addon") && (
              <>
                <h4 style={{ marginTop: "1.5rem" }}>Additional Services</h4>
                <div style={{ display: "grid", gap: "1rem" }}>
                  {servicesForUI
                    .filter((s) => s.category === "addon")
                    .map((service) => (
                      <ServiceCard key={service.name} service={service} />
                    ))}
                </div>
              </>
            )}
          </div>
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={() => setCurrentHeader(null)}
              style={{
                padding: "0.75rem 1.5rem",
                border: "1px solid #ccc",
                borderRadius: "0.5rem",
                background: "#f9f9f9",
                cursor: "pointer",
              }}
            >
              ← Back
            </button>
            <button
              onClick={saveCurrentHeader}
              style={{
                padding: "0.75rem 1.5rem",
                border: "none",
                borderRadius: "0.5rem",
                background: "#10b981",
                color: "#fff",
                cursor: "pointer",
                marginRight: "1rem",
              }}
            >
              Save & Add Another Header
            </button>
          </div>
        </div>
      )}

      {/* Summary Box */}
      {Object.keys(summary).length > 0 && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            border: "1px solid #ddd",
            borderRadius: "0.75rem",
            background: "#f9fafb",
          }}
        >
          <h3>Summary</h3>
          {Object.entries(summary).map(([header, services]) => (
            <div key={header} style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{header}</strong>
                <button
                  onClick={() => editHeader(header)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#2563eb",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
              </div>
              <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem" }}>
                {services
                  .filter((s) => s.isChecked)
                  .map((s) => (
                    <li key={s.name} style={{ marginBottom: "0.25rem" }}>
                      {s.name}
                      {s.subServices?.some((sub) => sub.isChecked) && (
                        <ul style={{ paddingLeft: "1.25rem", marginTop: "0.25rem" }}>
                          {s.subServices
                            .filter((sub) => sub.isChecked)
                            .map((sub) => (
                              <li
                                key={sub.name}
                                style={{ fontSize: "0.9rem", color: "#4b5563" }}
                              >
                                {sub.name}
                              </li>
                            ))}
                        </ul>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          <div style={{ textAlign: "right" }}>
            <button
              onClick={() =>
                onComplete(
                  Object.entries(summary).map(([header, services]) => ({
                    name: header,
                    services,
                  }))
                )
              }
              style={{
                padding: "0.75rem 1.5rem",
                border: "none",
                borderRadius: "0.5rem",
                background: "#2563eb",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
