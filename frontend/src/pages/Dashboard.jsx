import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [pending, setPending] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [user, setUser] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [approvalAction, setApprovalAction] = useState("approve");
  
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const fetchProfile = async () => {
    if (token) {
      const res = await fetch("http://localhost:3001/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setUser(data);
    }
  };

  const fetchQuotations = async () => {
    const res = await fetch("http://localhost:3001/api/quotations");
    const data = await res.json();
    if (res.ok) setQuotations(data.data);
  };

  const fetchPending = async () => {
    if (role === "admin" || role === "manager") {
      const res = await fetch("http://localhost:3001/api/quotations/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setPending(data.data);
    }
  };

  const handleApprovalClick = (quotation, action) => {
    setSelectedQuotation(quotation);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const handleConfirmApproval = async () => {
    if (!selectedQuotation) return;

    const res = await fetch(
      `http://localhost:3001/api/quotations/${selectedQuotation.id}/approve`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: approvalAction }),
      }
    );
    const data = await res.json();
    
    if (res.ok) {
      fetchPending();
      fetchQuotations();
      setShowApprovalModal(false);
      setSelectedQuotation(null);
    } else {
      alert(data.error);
    }
  };

  // ✅ Handle Edit Quotation
  const handleEditQuotation = (quotationId) => {
    navigate(`/quotations/${quotationId}/services`);
  };

  // ✅ Handle Download Quotation
  const handleDownloadQuotation = async (quotation) => {
    try {
      // Generate PDF content
      const pdfContent = generateQuotationPDF(quotation);
      
      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quotation_${quotation.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download quotation');
    }
  };

  // ✅ Generate PDF content (you can replace this with actual PDF generation)
  const generateQuotationPDF = (quotation) => {
    return `
QUOTATION DOCUMENT
==================

Quotation ID: ${quotation.id}
Developer: ${quotation.developerName}
Project: ${quotation.projectName || 'N/A'}
Region: ${quotation.projectRegion}
Plot Area: ${quotation.plotArea} sq ft
Contact: ${quotation.contactMobile || quotation.contactEmail || 'N/A'}

SELECTED SERVICES:
${quotation.headers?.map(header => 
  `\n${header.header}:\n${header.services?.map(service => `  - ${service.label || service.name}`).join('\n') || '  No services'}`
).join('\n') || 'No services selected'}

PRICING DETAILS:
Total Amount: ₹${quotation.totalAmount?.toLocaleString() || '0'}
Discount Amount: ₹${quotation.discountAmount?.toLocaleString() || '0'}
Discount Percentage: ${quotation.effectiveDiscountPercent || 0}%

CUSTOM TERMS:
${quotation.customTerms?.map((term, index) => `${index + 1}. ${term}`).join('\n') || 'No custom terms'}

Status: ${quotation.status}
Created: ${quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString() : 'N/A'}
${quotation.approvedBy ? `Approved by: ${quotation.approvedBy}` : ''}
${quotation.approvedAt ? `Approved on: ${new Date(quotation.approvedAt).toLocaleDateString()}` : ''}

Generated on: ${new Date().toLocaleDateString()}
    `;
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  useEffect(() => {
    fetchProfile();
    fetchQuotations();
    fetchPending();
  }, []);

  const list = activeTab === "pending" ? pending : quotations;

  // ✅ Helper function to check for packages and customized headers
  const getApprovalReasons = (quotation) => {
    const reasons = [];
    
    // Check for packages
    const hasPackages = quotation.headers?.some(header => 
      header.header && header.header.toLowerCase().includes('package') && 
      header.services && header.services.length > 0
    );
    
    // Check for customized header
    const hasCustomizedHeader = quotation.headers?.some(header => 
      header.header && header.header.toLowerCase().includes('customized') && 
      header.services && header.services.length > 0
    );
    
    // Check for discount
    if (quotation.effectiveDiscountPercent > (user?.threshold || 0)) {
      reasons.push(`High discount (${quotation.effectiveDiscountPercent}%)`);
    }
    
    // Check for packages
    if (hasPackages) {
      reasons.push("Package services selected");
    }
    
    // Check for customized header
    if (hasCustomizedHeader) {
      reasons.push("Customized header with services");
    }
    
    // Check for custom terms
    if (quotation.customTerms && quotation.customTerms.length > 0) {
      reasons.push("Custom terms added");
    }
    
    return reasons;
  };

  const statusBadge = (status) => {
    const base = {
      padding: "6px 12px",
      borderRadius: "4px",
      fontWeight: "600",
      fontSize: "0.85rem",
      display: "inline-block",
      minWidth: "80px",
      textAlign: "center"
    };
    
    if (status === "completed") {
      return (
        <span style={{ ...base, backgroundColor: "#d4edda", color: "#155724" }}>
          Completed ✅
        </span>
      );
    }
    
    if (status === "approved") {
      return (
        <span style={{ ...base, backgroundColor: "#d4edda", color: "#155724" }}>
          Approved ✅
        </span>
      );
    }
    
    if (status === "rejected") {
      return (
        <span style={{ ...base, backgroundColor: "#f8d7da", color: "#721c24" }}>
          Rejected ❌
        </span>
      );
    }
    
    if (status === "pending_approval") {
      return (
        <span style={{ ...base, backgroundColor: "#fff3cd", color: "#856404" }}>
          Pending ⏳
        </span>
      );
    }
    
    return (
      <span style={{ ...base, backgroundColor: "#e2e3e5", color: "#495057" }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "30px",
        padding: "20px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ margin: 0, color: "#333" }}>Dashboard</h1>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ marginBottom: "10px" }}>
                <strong>Welcome, {user.fname} {user.lname}</strong>
                <br />
                <span style={{ 
                  color: "#666", 
                  fontSize: "0.9rem",
                  backgroundColor: "#e9ecef",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  display: "inline-block",
                  marginTop: "4px"
                }}>
                  {user.role} • Threshold: {user.threshold}%
                </span>
              </div>
            </div>
            
            {/* Create Quotation Button */}
            <button 
              onClick={() => navigate("/quotations/new")}
              style={{
                padding: "10px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span>➕</span> Create Quotation
            </button>
            
            {/* Admin Create User Button */}
            {role === "admin" && (
              <button 
                onClick={() => navigate("/signup")}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <span>👤</span> Create User
              </button>
            )}
            
            <button 
              onClick={handleLogout}
              style={{
                padding: "10px 16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, color: "#333" }}>Manage Quotations & Approvals</h2>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={() => navigate("/quotations/new")}
              style={{
                padding: "10px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span>📄</span> New Quotation
            </button>
            
            {role === "admin" && (
              <button 
                onClick={() => navigate("/signup")}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#17a2b8",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500"
                }}
              >
                + User
              </button>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={() => setActiveTab("all")}
            style={{
              padding: "10px 20px",
              marginRight: "10px",
              backgroundColor: activeTab === "all" ? "#007bff" : "#f8f9fa",
              color: activeTab === "all" ? "white" : "#495057",
              border: "1px solid #dee2e6",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: activeTab === "all" ? "600" : "400"
            }}
          >
            All Quotations ({quotations.length})
          </button>
          
          {(role === "admin" || role === "manager") && (
            <button
              onClick={() => setActiveTab("pending")}
              style={{
                padding: "10px 20px",
                backgroundColor: activeTab === "pending" ? "#ffc107" : "#f8f9fa",
                color: activeTab === "pending" ? "#212529" : "#495057",
                border: "1px solid #dee2e6",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: activeTab === "pending" ? "600" : "400"
              }}
            >
              Pending Approval ({pending.length})
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse", 
            backgroundColor: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f3f4" }}>
                <th style={{ 
                  padding: "12px 15px", 
                  border: "1px solid #e0e0e0", 
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#333"
                }}>ID</th>
                <th style={{ 
                  padding: "12px 15px", 
                  border: "1px solid #e0e0e0", 
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#333"
                }}>Developer</th>
                <th style={{ 
                  padding: "12px 15px", 
                  border: "1px solid #e0e0e0", 
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#333"
                }}>Project</th>
                <th style={{ 
                  padding: "12px 15px", 
                  border: "1px solid #e0e0e0", 
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#333"
                }}>Status</th>
                <th style={{ 
                  padding: "12px 15px", 
                  border: "1px solid #e0e0e0", 
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#333"
                }}>Discount %</th>
                <th style={{ 
                  padding: "12px 15px", 
                  border: "1px solid #e0e0e0", 
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#333"
                }}>Actions</th>
                {(role === "admin" || role === "manager") && activeTab === "pending" && (
                  <th style={{ 
                    padding: "12px 15px", 
                    border: "1px solid #e0e0e0", 
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#333"
                  }}>Approval</th>
                )}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td 
                    colSpan={(role === "admin" || role === "manager") && activeTab === "pending" ? 7 : 6}
                    style={{ 
                      padding: "30px", 
                      textAlign: "center", 
                      color: "#666",
                      fontStyle: "italic"
                    }}
                  >
                    No {activeTab === "pending" ? "pending" : ""} quotations found
                    {list.length === 0 && activeTab === "all" && (
                      <div style={{ marginTop: "15px" }}>
                        <button 
                          onClick={() => navigate("/quotations/new")}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          Create Your First Quotation
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                list.map((q, index) => (
                  <tr key={q.id} style={{ 
                    backgroundColor: index % 2 === 0 ? "white" : "#f9f9f9"
                  }}>
                    <td style={{ 
                      padding: "12px 15px", 
                      border: "1px solid #e0e0e0",
                      fontFamily: "monospace",
                      fontSize: "0.85rem"
                    }}>{q.id}</td>
                    <td style={{ 
                      padding: "12px 15px", 
                      border: "1px solid #e0e0e0"
                    }}>{q.developerName}</td>
                    <td style={{ 
                      padding: "12px 15px", 
                      border: "1px solid #e0e0e0"
                    }}>{q.projectName || "N/A"}</td>
                    <td style={{ 
                      padding: "12px 15px", 
                      border: "1px solid #e0e0e0"
                    }}>{statusBadge(q.status)}</td>
                    <td style={{ 
                      padding: "12px 15px", 
                      border: "1px solid #e0e0e0",
                      fontWeight: q.effectiveDiscountPercent > 0 ? "600" : "normal"
                    }}>{q.effectiveDiscountPercent}%</td>
                    
                    {/* ✅ Actions Column */}
                    <td style={{ 
                      padding: "12px 15px", 
                      border: "1px solid #e0e0e0"
                    }}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditQuotation(q.id)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#17a2b8",
                            color: "white",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                          title="Edit Quotation"
                        >
                          <span>✏️</span>Edit
                        </button>
                        
                        {/* Download Button */}
                        <button
                          onClick={() => handleDownloadQuotation(q)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#6c757d",
                            color: "white",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                          title="Download Quotation"
                        >
                          <span>📥</span>Download
                        </button>
                      </div>
                    </td>

                    {/* Approval Actions Column */}
                    {(role === "admin" || role === "manager") && activeTab === "pending" && (
                      <td style={{ 
                        padding: "12px 15px", 
                        border: "1px solid #e0e0e0"
                      }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => handleApprovalClick(q, "approve")}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#28a745",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              fontWeight: "500"
                            }}
                          >
                            ✅Approve
                          </button>
                          <button
                            onClick={() => handleApprovalClick(q, "reject")}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              fontWeight: "500"
                            }}
                          >
                            ❌Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ Enhanced Approval Modal */}
      {showApprovalModal && selectedQuotation && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "30px",
            maxWidth: "700px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
          }}>
            {/* Modal Header */}
            <div style={{ borderBottom: "2px solid #f1f3f4", paddingBottom: "20px", marginBottom: "20px" }}>
              <h2 style={{ 
                margin: 0, 
                color: approvalAction === "approve" ? "#28a745" : "#dc3545",
                fontSize: "24px",
                fontWeight: "700"
              }}>
                {approvalAction === "approve" ? "✅ Approve Quotation" : "❌ Reject Quotation"}
              </h2>
              <p style={{ margin: "8px 0 0 0", color: "#666" }}>
                Review the quotation details before {approvalAction === "approve" ? "approving" : "rejecting"}
              </p>
            </div>

            {/* Quotation Details */}
            <div style={{ marginBottom: "25px" }}>
              <h3 style={{ color: "#333", marginBottom: "15px", fontSize: "18px" }}>Quotation Details</h3>
              
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1fr", 
                gap: "15px",
                backgroundColor: "#f8f9fa",
                padding: "20px",
                borderRadius: "8px"
              }}>
                <div>
                  <strong style={{ color: "#495057" }}>ID:</strong>
                  <div style={{ fontFamily: "monospace", fontSize: "14px", color: "#007bff" }}>
                    {selectedQuotation.id}
                  </div>
                </div>
                
                <div>
                  <strong style={{ color: "#495057" }}>Developer:</strong>
                  <div>{selectedQuotation.developerName}</div>
                </div>
                
                <div>
                  <strong style={{ color: "#495057" }}>Project:</strong>
                  <div>{selectedQuotation.projectName || "N/A"}</div>
                </div>
                
                <div>
                  <strong style={{ color: "#495057" }}>Region:</strong>
                  <div>{selectedQuotation.projectRegion}</div>
                </div>
                
                <div>
                  <strong style={{ color: "#495057" }}>Plot Area:</strong>
                  <div>{selectedQuotation.plotArea} sq ft</div>
                </div>
                
                <div>
                  <strong style={{ color: "#495057" }}>Contact:</strong>
                  <div>{selectedQuotation.contactMobile || selectedQuotation.contactEmail || "N/A"}</div>
                </div>
              </div>
            </div>

            {/* ✅ Selected Headers & Services */}
            {selectedQuotation.headers && selectedQuotation.headers.length > 0 && (
              <div style={{ marginBottom: "25px" }}>
                <h3 style={{ color: "#333", marginBottom: "15px", fontSize: "18px" }}>Selected Services</h3>
                
                <div style={{ 
                  backgroundColor: "#f0f8ff",
                  border: "1px solid #b3d9ff",
                  padding: "20px",
                  borderRadius: "8px"
                }}>
                  {selectedQuotation.headers.map((header, index) => (
                    <div key={index} style={{ marginBottom: "15px" }}>
                      <strong style={{ 
                        color: header.header && (header.header.toLowerCase().includes('package') || header.header.toLowerCase().includes('customized')) ? "#dc3545" : "#495057"
                      }}>
                        {header.header}:
                        {(header.header && (header.header.toLowerCase().includes('package') || header.header.toLowerCase().includes('customized'))) && (
                          <span style={{ color: "#dc3545", marginLeft: "10px", fontSize: "0.8rem" }}>⚠️ Requires Approval</span>
                        )}
                      </strong>
                      {header.services && header.services.length > 0 && (
                        <div style={{ marginLeft: "20px", marginTop: "5px" }}>
                          {header.services.map((service, sIndex) => (
                            <span key={sIndex} style={{
                              display: "inline-block",
                              backgroundColor: "#e9ecef",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "0.8rem",
                              margin: "2px 5px 2px 0"
                            }}>
                              {service.label || service.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Information */}
            <div style={{ marginBottom: "25px" }}>
              <h3 style={{ color: "#333", marginBottom: "15px", fontSize: "18px" }}>Pricing & Discount Details</h3>
              
              <div style={{ 
                backgroundColor: "#fff3cd",
                border: "1px solid #ffeaa7",
                padding: "20px",
                borderRadius: "8px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <strong>Total Amount:</strong>
                  <span style={{ fontSize: "18px", fontWeight: "600" }}>
                    ₹{selectedQuotation.totalAmount?.toLocaleString()}
                  </span>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <strong>Discount Amount:</strong>
                  <span style={{ color: "#dc3545", fontWeight: "600" }}>
                    -₹{selectedQuotation.discountAmount?.toLocaleString()}
                  </span>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px solid #ffeaa7" }}>
                  <strong style={{ fontSize: "18px" }}>Discount Percentage:</strong>
                  <span style={{ 
                    fontSize: "20px", 
                    fontWeight: "700",
                    color: selectedQuotation.effectiveDiscountPercent > (user?.threshold || 0) ? "#dc3545" : "#28a745"
                  }}>
                    {selectedQuotation.effectiveDiscountPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* ✅ Custom Terms Information */}
            {selectedQuotation.customTerms && selectedQuotation.customTerms.length > 0 && (
              <div style={{ marginBottom: "25px" }}>
                <h3 style={{ color: "#333", marginBottom: "15px", fontSize: "18px" }}>Custom Terms</h3>
                
                <div style={{ 
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffeaa7",
                  padding: "20px",
                  borderRadius: "8px"
                }}>
                  {selectedQuotation.customTerms.map((term, index) => (
                    <div key={index} style={{ marginBottom: "10px" }}>
                      <strong>{index + 1}.</strong> {term}
                    </div>
                  ))}
                  
                  <div style={{ 
                    marginTop: "15px", 
                    paddingTop: "15px", 
                    borderTop: "1px solid #ffeaa7",
                    color: "#856404" 
                  }}>
                    <strong>⚠️ Custom terms require approval</strong>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ Approval Reasons */}
            <div style={{ marginBottom: "30px" }}>
              <h3 style={{ color: "#333", marginBottom: "15px", fontSize: "18px" }}>Approval Requirements</h3>
              
              <div style={{ 
                backgroundColor: "#f8d7da",
                border: "1px solid #f5c6cb",
                padding: "15px",
                borderRadius: "8px"
              }}>
                <div style={{ marginBottom: "10px" }}>
                  <strong>Your Threshold:</strong> {user?.threshold}%
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <strong>Approval Required Due To:</strong>
                </div>
                <ul style={{ marginLeft: "20px", color: "#721c24" }}>
                  {getApprovalReasons(selectedQuotation).map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
                <div style={{ marginTop: "10px", fontSize: "0.9rem", fontWeight: "600" }}>
                  Status: {user?.role === "admin" ? "✅ You can approve this quotation" : "⚠️ Review required"}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "15px" }}>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedQuotation(null);
                }}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproval}
                style={{
                  padding: "12px 24px",
                  backgroundColor: approvalAction === "approve" ? "#28a745" : "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "16px"
                }}
              >
                {approvalAction === "approve" ? "✅ Confirm Approval" : "❌ Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
