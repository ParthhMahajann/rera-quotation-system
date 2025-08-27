import React, { useState } from "react";
import {
  getAvailableHeaders,
  getServicesForHeader,
  expandPackageServices,
  isPackageHeader,
} from "../lib/servicesData";

export default function QuotationBuilder() {
  const [selectedHeaders, setSelectedHeaders] = useState([]);
  const [selectedServices, setSelectedServices] = useState({});
  const [currentHeader, setCurrentHeader] = useState(null);

  // Add a header
  const addHeader = (header) => {
    if (selectedHeaders.includes(header)) return;

    setSelectedHeaders([...selectedHeaders, header]);

    if (isPackageHeader(header)) {
      const packageServices = expandPackageServices(header);
      setSelectedServices((prev) => {
        const newState = { ...prev };
        packageServices.forEach((s) => {
          newState[s] = { checked: true, subServices: {} };
        });
        return newState;
      });
    }
    setCurrentHeader(header);
  };

  // Toggle service
  const onServiceToggle = (serviceName, isChecked) => {
    setSelectedServices((prev) => ({
      ...prev,
      [serviceName]: {
        ...(prev[serviceName] || { subServices: {} }),
        checked: isChecked,
      },
    }));
  };

  // Toggle sub-service
  const onSubServiceToggle = (serviceName, subServiceName, isChecked) => {
    setSelectedServices((prev) => {
      const service = prev[serviceName] || { checked: false, subServices: {} };
      return {
        ...prev,
        [serviceName]: {
          ...service,
          subServices: {
            ...service.subServices,
            [subServiceName]: isChecked,
          },
        },
      };
    });
  };

  // Services for UI
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
          onChange={(e) => onServiceToggle(service.name, e.target.checked)}
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
                  onSubServiceToggle(service.name, sub.name, e.target.checked)
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

      {/* Header selection as cards instead of dropdown */}
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
                background:
                  currentHeader === header ? "#eef6ff" : "transparent",
              }}
            >
              <strong>{header}</strong>
            </div>
          ))}
        </div>
      </div>

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

            {/* Add-on Services */}
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
        </div>
      )}
    </div>
  );
}
