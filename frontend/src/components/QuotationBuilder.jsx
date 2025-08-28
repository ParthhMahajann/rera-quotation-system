// src/components/QuotationBuilder.jsx
import React, { useState, useEffect } from "react";
import {
  getAvailableHeaders,
  getServicesForHeader,
  expandPackageServices,
  isPackageHeader,
  getAllServices as getAllServicesData
} from "../lib/servicesData";

export default function QuotationBuilder({ onComplete }) {
  const [selectedHeaders, setSelectedHeaders] = useState([]);
  const [selectedServices, setSelectedServices] = useState({});
  const [currentHeader, setCurrentHeader] = useState(null);
  const [summary, setSummary] = useState({});
  const [allSelectedServices, setAllSelectedServices] = useState([]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customHeaderName, setCustomHeaderName] = useState("");
  const [selectedYears, setSelectedYears] = useState({});
  const [selectedQuarters, setSelectedQuarters] = useState({});

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
      <label style={{ fontWeight: 500, color: service.isDisabled ? '#999' : 'inherit' }}>
        <input
          type="checkbox"
          checked={service.isChecked || service.isDisabled}
          onChange={(e) =>
            onServiceToggle(service.name, e.target.checked, service)
          }
          style={{ marginRight: "0.5rem" }}
          disabled={service.isDisabled}
        />
        {service.name}{" "}
        {service.isDisabled && (
          <span style={{ color: "#6b7280" }}>
            (Already selected)
          </span>
        )}
      </label>

      {/* Year Dropdown */}
      {service.hasYear && service.isChecked && (
        <div style={{ marginTop: "0.5rem" }}>
          <label htmlFor={`year-select-${service.name}`}>Year: </label>
          <select
            id={`year-select-${service.name}`}
            value={selectedYears[service.name] || new Date().getFullYear()}
            onChange={(e) =>
              setSelectedYears(prev => ({ ...prev, [service.name]: e.target.value }))
            }
            style={{ marginLeft: '0.5rem' }}
          >
            {getYears().map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quarter Dropdown */}
      {service.hasQuarter && service.isChecked && (
        <div style={{ marginTop: "0.5rem" }}>
          <label htmlFor={`quarter-select-${service.name}`}>Quarter: </label>
          <select
            id={`quarter-select-${service.name}`}
            value={selectedQuarters[service.name] || getQuarter()}
            onChange={(e) =>
              setSelectedQuarters(prev => ({ ...prev, [service.name]: e.target.value }))
            }
            style={{ marginLeft: '0.5rem' }}
          >
            <option value="Jan-Mar">Jan - Mar</option>
            <option value="Apr-Jun">Apr - Jun</option>
            <option value="Jul-Sep">Jul - Sep</option>
            <option value="Oct-Dec">Oct - Dec</option>
          </select>
        </div>
      )}

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
                color: sub.isDisabled ? '#999' : 'inherit'
              }}
            >
              <input
                type="checkbox"
                checked={sub.isChecked || sub.isDisabled}
                onChange={(e) =>
                  onSubServiceToggle(service.name, sub.name, e.target.checked, service)
                }
                style={{ marginRight: "0.5rem" }}
                disabled={sub.isDisabled}
              />
              {sub.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );

  // Function to get all services (main and add-ons)
  const getAllServices = () => {
    return getAllServicesData();
  };

  // Function to generate years from 2017 to the current year
  const getYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2017; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  };

  // Function to get the current quarter
  const getQuarter = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 1 && month <= 3) {
      return "Jan-Mar";
    } else if (month >= 4 && month <= 6) {
      return "Apr-Jun";
    } else if (month >= 7 && month <= 9) {
      return "Jul-Sep";
    } else {
      return "Oct-Dec";
    }
  };

  // Add a header
  const addHeader = (header) => {
    if (header === "Customized Header") {
      setIsCustomizing(true);
      setCustomHeaderName("");
      setSelectedServices({});
      return;
    }

    if (selectedHeaders.includes(header)) {
      const headerServicesFromSummary = summary[header];
      const addOnServicesFromSummary = summary["Add ons"];
      if (headerServicesFromSummary || addOnServicesFromSummary) {
        const initialState = {};
        const initialYears = {};
        const initialQuarters = {};
        
        // Load main services
        if (headerServicesFromSummary) {
          headerServicesFromSummary.forEach(service => {
            initialState[service.name] = {
              checked: service.isChecked,
              subServices: service.subServices.reduce((acc, sub) => {
                acc[sub.name] = sub.isChecked;
                return acc;
              }, {})
            };
            if (service.hasYear) {
              initialYears[service.name] = service.selectedYear;
            }
            if (service.hasQuarter) {
              initialQuarters[service.name] = service.selectedQuarter;
            }
          });
        }
        // Load add-on services
        if (addOnServicesFromSummary) {
          addOnServicesFromSummary.forEach(service => {
            initialState[service.name] = {
              checked: service.isChecked,
              subServices: service.subServices.reduce((acc, sub) => {
                acc[sub.name] = sub.isChecked;
                return acc;
              }, {})
            };
            if (service.hasYear) {
              initialYears[service.name] = service.selectedYear;
            }
            if (service.hasQuarter) {
              initialQuarters[service.name] = service.selectedQuarter;
            }
          });
        }
        setSelectedServices(initialState);
        setSelectedYears(initialYears);
        setSelectedQuarters(initialQuarters);
      }
    } else {
      setSelectedHeaders([...selectedHeaders, header]);
      setSelectedServices({});
      setSelectedYears({});
      setSelectedQuarters({});
    }

    if (isPackageHeader(header)) {
      const packageServices = expandPackageServices(header);
      setSelectedServices((prev) => {
        const newState = { ...prev };
        packageServices.forEach((service) => {
          const subServices = {};
          if (service.subServices) {
            service.subServices.forEach((sub) => {
              subServices[sub.name || sub] = true;
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

  const saveCustomHeaderName = () => {
    if (customHeaderName.trim() === "") {
      alert("Please enter a name for the custom header.");
      return;
    }
    if (selectedHeaders.includes(customHeaderName)) {
      alert("A header with this name already exists. Please choose a different name.");
      return;
    }
    setSelectedHeaders([...selectedHeaders, customHeaderName]);
    setCurrentHeader(customHeaderName);
    setIsCustomizing(false);
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

    if (serviceData.hasYear && !isChecked) {
      setSelectedYears((prev) => {
        const newState = { ...prev };
        delete newState[serviceName];
        return newState;
      });
    }

    if (serviceData.hasQuarter && !isChecked) {
      setSelectedQuarters((prev) => {
        const newState = { ...prev };
        delete newState[serviceName];
        return newState;
      });
    }
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
    
    // Get all services for the current header, including add-ons
    const servicesForHeader = getServicesForHeader(currentHeader).map(
      (service) => {
        const selected = selectedServices[service.name] || {
          checked: false,
          subServices: {},
        };
        const selectedYear = service.hasYear && selected.checked ? selectedYears[service.name] || new Date().getFullYear() : undefined;
        const selectedQuarter = service.hasQuarter && selected.checked ? selectedQuarters[service.name] || getQuarter() : undefined;
        return {
          ...service,
          isChecked: selected.checked,
          selectedYear: selectedYear,
          selectedQuarter: selectedQuarter,
          subServices: service.subServices
            ? service.subServices.map((sub) => ({
                name: sub.name || sub,
                isChecked: selected.subServices[sub.name || sub] || false,
              }))
            : [],
        };
      }
    );

    // Filter services into main and add-ons based on category
    const mainServices = servicesForHeader.filter(service => service.category === 'main');
    const addOnServices = servicesForHeader.filter(service => service.category === 'addon');

    // Update the list of all selected services, including add-ons
    const newlySelectedServices = servicesForHeader
      .filter(s => s.isChecked)
      .map(s => s.name);

    const oldServices = summary[currentHeader]?.filter(s => s.isChecked).map(s => s.name) || [];
    const updatedServicesSet = new Set(allSelectedServices);
    oldServices.forEach(service => updatedServicesSet.delete(service));
    newlySelectedServices.forEach(service => updatedServicesSet.add(service));
    setAllSelectedServices(Array.from(updatedServicesSet));

    setSummary((prev) => {
      const newSummary = { ...prev };
      
      // Update the main services for the current header
      newSummary[currentHeader] = mainServices;

      // Handle Add-ons: They are a single, shared list. We need to merge them.
      let existingAddOns = newSummary["Add ons"] || [];
      
      // Merge selected add-ons from the current header with the existing ones
      const updatedAddOns = addOnServices.map(newAddOn => {
          const existing = existingAddOns.find(e => e.name === newAddOn.name);
          return existing ? { ...existing, ...newAddOn } : newAddOn;
      });

      // Filter out add-ons that were deselected from the global list.
      const finalAddOns = existingAddOns.filter(existing => updatedAddOns.some(u => u.name === existing.name));
      updatedAddOns.forEach(u => {
          if (!finalAddOns.some(f => f.name === u.name)) {
              finalAddOns.push(u);
          }
      });
      
      newSummary["Add ons"] = finalAddOns;

      return newSummary;
    });
    
    // Update the service and year selections after summary is saved
    const newSelectedServices = {};
    const newSelectedYears = {};
    const newSelectedQuarters = {};
    
    Object.values(summary).flat().forEach(service => {
        if (service.isChecked) {
            newSelectedServices[service.name] = {
                checked: true,
                subServices: service.subServices.reduce((acc, sub) => {
                    if (sub.isChecked) {
                        acc[sub.name] = true;
                    }
                    return acc;
                }, {})
            };
            if (service.hasYear && service.selectedYear) {
                newSelectedYears[service.name] = service.selectedYear;
            }
            if (service.hasQuarter && service.selectedQuarter) {
                newSelectedQuarters[service.name] = service.selectedQuarter;
            }
        }
    });

    servicesForHeader.forEach(service => {
        if (service.isChecked) {
            newSelectedServices[service.name] = {
                checked: true,
                subServices: service.subServices.reduce((acc, sub) => {
                    if (sub.isChecked) {
                        acc[sub.name] = true;
                    }
                    return acc;
                }, {})
            };
            if (service.hasYear && service.selectedYear) {
                newSelectedYears[service.name] = service.selectedYear;
            }
            if (service.hasQuarter && service.selectedQuarter) {
                newSelectedQuarters[service.name] = service.selectedQuarter;
            }
        }
    });
    
    setSelectedServices(newSelectedServices);
    setSelectedYears(newSelectedYears);
    setSelectedQuarters(newSelectedQuarters);

    setCurrentHeader(null);
  };

  // Edit a header from summary
  const editHeader = (header) => {
    setCurrentHeader(header);
    const headerServicesFromSummary = summary[header] || [];
    const addOnServicesFromSummary = summary["Add ons"] || [];
    const allServicesToEdit = [...headerServicesFromSummary, ...addOnServicesFromSummary];

    const initialState = {};
    const initialYears = {};
    const initialQuarters = {};

    allServicesToEdit.forEach(service => {
        initialState[service.name] = {
          checked: service.isChecked,
          subServices: service.subServices.reduce((acc, sub) => {
            if (sub.isChecked) {
              acc[sub.name] = true;
            }
            return acc;
          }, {})
        };
        if (service.hasYear && service.selectedYear) {
          initialYears[service.name] = service.selectedYear;
        }
        if (service.hasQuarter && service.selectedQuarter) {
          initialQuarters[service.name] = service.selectedQuarter;
        }
    });
    setSelectedServices(initialState);
    setSelectedYears(initialYears);
    setSelectedQuarters(initialQuarters);
  };

  // Build services for UI
  const servicesForUI = currentHeader === "Customized Header" 
    ? getAllServices()
    : getServicesForHeader(currentHeader);

  const mainServicesForUI = servicesForUI.filter(s => s.category === 'main').map((service) => {
      const selected = selectedServices[service.name] || { checked: false, subServices: {} };
      const isDisabled = allSelectedServices.includes(service.name) && !selected.checked;
      return {
        ...service,
        isChecked: selected.checked,
        isDisabled: isDisabled,
        subServices: service.subServices
          ? service.subServices.map((sub) => ({
              name: sub.name || sub,
              isChecked: selected.subServices[sub.name || sub] || false,
              isDisabled: isDisabled,
            }))
          : [],
      };
    });

  const addOnServicesForUI = servicesForUI.filter(s => s.category === 'addon').map((service) => {
      const selected = selectedServices[service.name] || { checked: false, subServices: {} };
      const isDisabled = allSelectedServices.includes(service.name) && !selected.checked;
      return {
        ...service,
        isChecked: selected.checked,
        isDisabled: isDisabled,
        subServices: service.subServices
          ? service.subServices.map((sub) => ({
              name: sub.name || sub,
              isChecked: selected.subServices[sub.name || sub] || false,
              isDisabled: isDisabled,
            }))
          : [],
      };
  });

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Quotation Builder</h2>

      {/* Header selection */}
      {!currentHeader && !isCustomizing && (
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

      {/* Custom Header Input */}
      {isCustomizing && (
        <div style={{ marginBottom: "2rem" }}>
          <h3>Name Your Custom Header:</h3>
          <input
            type="text"
            value={customHeaderName}
            onChange={(e) => setCustomHeaderName(e.target.value)}
            placeholder="Enter header name..."
            style={{
              width: "100%",
              padding: "0.75rem",
              fontSize: "1rem",
              border: "1px solid #ccc",
              borderRadius: "0.5rem",
              marginBottom: "1rem",
            }}
          />
          <button
            onClick={saveCustomHeaderName}
            style={{
              padding: "0.75rem 1.5rem",
              border: "none",
              borderRadius: "0.5rem",
              background: "#10b981",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Save & Continue
          </button>
        </div>
      )}

      {/* Services */}
      {currentHeader && (
        <div style={{ marginTop: "2rem" }}>
          <h3>{currentHeader}</h3>
          <div style={{ marginTop: "1rem" }}>
            {/* Main Services */}
            <h4 style={{ marginTop: "1.5rem" }}>Main Services</h4>
            <div style={{ display: "grid", gap: "1rem" }}>
              {mainServicesForUI.map((service) => (
                <ServiceCard key={service.name} service={service} />
              ))}
            </div>
             {/* Add-on Services */}
            <h4 style={{ marginTop: "1.5rem" }}>Add-on Services</h4>
            <div style={{ display: "grid", gap: "1rem" }}>
              {addOnServicesForUI.map((service) => (
                <ServiceCard key={service.name} service={service} />
              ))}
            </div>
          </div>
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={() => {
                setCurrentHeader(null);
                setSelectedServices({});
              }}
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
                      {s.name} {s.hasYear && s.selectedYear && `(${s.selectedYear})`}
                      {s.hasQuarter && s.selectedQuarter && ` (${s.selectedQuarter})`}
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
              onClick={() => {
                const finalHeaders = Object.keys(summary).map(header => {
                  const services = summary[header].filter(s => s.isChecked);
                  return {
                    name: header,
                    services
                  };
                }).filter(h => h.services.length > 0);

                onComplete(finalHeaders);
              }}
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