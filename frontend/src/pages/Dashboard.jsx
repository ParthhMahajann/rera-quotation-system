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
      try {
        const res = await fetch("http://localhost:3001/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data);
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        handleLogout();
      }
    }
  };

  const fetchQuotations = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/quotations");
      const data = await res.json();
      if (res.ok) setQuotations(data.data);
    } catch (error) {
      console.error("Failed to fetch quotations:", error);
    }
  };

  const fetchPending = async () => {
    if (role === "admin" || role === "manager") {
      try {
        const res = await fetch("http://localhost:3001/api/quotations/pending", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setPending(data.data);
        } else if (res.status === 403) {
          setPending([]);
        }
      } catch (error) {
        console.error("Failed to fetch pending quotations:", error);
      }
    }
  };

  const handleApprovalClick = (quotation, action) => {
    if (role === "manager" && quotation.effectiveDiscountPercent > user?.threshold) {
      alert(`Cannot ${action} - discount ${quotation.effectiveDiscountPercent}% exceeds your limit of ${user.threshold}%`);
      return;
    }
    setSelectedQuotation(quotation);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const handleConfirmApproval = async () => {
    if (!selectedQuotation) return;

    try {
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
        alert(`Quotation ${approvalAction}d successfully!`);
      } else {
        alert(data.error || `Failed to ${approvalAction} quotation`);
      }
    } catch (error) {
      console.error("Approval failed:", error);
      alert(`Failed to ${approvalAction} quotation`);
    }
  };

  const handleEditQuotation = (quotationId) => {
    navigate(`/quotations/${quotationId}/services`);
  };

  const handleDownloadQuotation = async (quotation) => {
    try {
      const pdfContent = generateQuotationPDF(quotation);
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
  `\n${header.header}:\n${header.services?.map(service => 
    `  - ${service.label || service.name}`
  ).join('\n') || '  No services'}`
).join('\n') || 'No services selected'}

PRICING DETAILS:
Total Amount: ₹${quotation.totalAmount?.toLocaleString() || '0'}
Discount Amount: ₹${quotation.discountAmount?.toLocaleString() || '0'}
Discount Percentage: ${quotation.effectiveDiscountPercent || 0}%

CUSTOM TERMS:
${quotation.customTerms?.map((term, index) => 
  `${index + 1}. ${term}`
).join('\n') || 'No custom terms'}

Status: ${quotation.status}
Created: ${quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString() : 'N/A'}
${quotation.approvedBy ? `Approved by: ${quotation.approvedBy}` : ''}
${quotation.approvedAt ? `Approved on: ${new Date(quotation.approvedAt).toLocaleDateString()}` : ''}

Generated on: ${new Date().toLocaleDateString()}
    `;
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleCreateUser = () => {
    navigate("/signup");
  };

  const handleCreateQuotation = () => {
    navigate("/quotations/new");
  };

  const handleCreateAgentQuotation = () => {
    navigate("/quotations/new/agent");
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchProfile();
    fetchQuotations();
    fetchPending();
  }, [token, navigate]);

  const list = activeTab === "pending" ? pending : quotations;

  const getApprovalReasons = (quotation) => {
    const reasons = [];

    const hasPackages = quotation.headers?.some(header =>
      header.header && header.header.toLowerCase().includes('package') &&
      header.services && header.services.length > 0
    );

    const hasCustomizedHeader = quotation.headers?.some(header =>
      header.header && header.header.toLowerCase().includes('customized') &&
      header.services && header.services.length > 0
    );

    if (quotation.effectiveDiscountPercent > (user?.threshold || 0)) {
      reasons.push(`High discount (${quotation.effectiveDiscountPercent}%)`);
    }

    if (hasPackages) {
      reasons.push("Package services selected");
    }

    if (hasCustomizedHeader) {
      reasons.push("Customized header with services");
    }

    if (quotation.customTerms && quotation.customTerms.length > 0) {
      reasons.push("Custom terms added");
    }

    return reasons;
  };

  const statusBadge = (status) => {
    const baseStyle = {
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
        <span style={{ ...baseStyle, backgroundColor: "#d4edda", color: "#155724", border: "1px solid #c3e6cb" }}>
          Completed ✅
        </span>
      );
    }
    if (status === "approved") {
      return (
        <span style={{ ...baseStyle, backgroundColor: "#d4edda", color: "#155724", border: "1px solid #c3e6cb" }}>
          Approved ✅
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span style={{ ...baseStyle, backgroundColor: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb" }}>
          Rejected ❌
        </span>
      );
    }
    if (status === "pending_approval") {
      return (
        <span style={{ ...baseStyle, backgroundColor: "#fff3cd", color: "#856404", border: "1px solid #ffeaa7" }}>
          Pending ⏳
        </span>
      );
    }
    return (
      <span style={{ ...baseStyle, backgroundColor: "#e9ecef", color: "#495057", border: "1px solid #dee2e6" }}>
        {status}
      </span>
    );
  };

  return (
    <div
      style={{
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 8px 24px rgba(99, 99, 99, 0.2)",
          padding: "30px 40px",
          boxSizing: "border-box",
          overflowX: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
          }}
        >
          <div>
            <h1 style={{ margin: 0, color: "#333" }}>Dashboard</h1>
            {user && (
              <p style={{ margin: "5px 0 0 0", color: "#666" }}>
                Welcome, {user.fname} {user.lname} ({user.role})
                {user.role !== "user" && ` - Threshold: ${user.threshold}%`}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleCreateQuotation}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              + New Quotation
            </button>
            <button
              onClick={handleCreateAgentQuotation}
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              + Agent Registration
            </button>
            {(role === "admin" || role === "manager") && (
              <button
                onClick={handleCreateUser}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#17a2b8",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                + Create User
              </button>
            )}
            <button
              onClick={handleLogout}
              style={{
                padding: "10px 20px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
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
              color: activeTab === "all" ? "white" : "#333",
              border: "1px solid #dee2e6",
              borderRadius: "5px",
              cursor: "pointer",
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
                color: activeTab === "pending" ? "black" : "#333",
                border: "1px solid #dee2e6",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Pending Approval ({pending.length})
            </button>
          )}
        </div>

        {/* Quotations Table */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#f8f9fa" }}>
              <tr>
                <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>ID</th>
                <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Developer</th>
                <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Project</th>
                <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Status</th>
                <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Discount %</th>
                <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Actions</th>
                {(role === "admin" || role === "manager") && activeTab === "pending" && (
                  <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Approval</th>
                )}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                    No {activeTab === "pending" ? "pending" : ""} quotations found
                    {list.length === 0 && activeTab === "all" && (
                      <div style={{ marginTop: "10px" }}>
                        <button
                          onClick={handleCreateQuotation}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            marginRight: "10px",
                          }}
                        >
                          Create Your First Quotation
                        </button>
                        <button
                          onClick={handleCreateAgentQuotation}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Or Register an Agent
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                list.map((q) => (
                  <tr key={q.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                    <td style={{ padding: "15px", fontWeight: "600" }}>{q.id}</td>
                    <td style={{ padding: "15px" }}>{q.developerName}</td>
                    <td style={{ padding: "15px" }}>{q.projectName || "N/A"}</td>
                    <td style={{ padding: "15px" }}>{statusBadge(q.status)}</td>
                    <td
                      style={{
                        padding: "15px",
                        fontWeight: q.effectiveDiscountPercent > 0 ? "600" : "normal",
                      }}
                    >
                      {q.effectiveDiscountPercent}%
                    </td>
                    <td style={{ padding: "15px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleEditQuotation(q.id)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#17a2b8",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDownloadQuotation(q)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                          }}
                        >
                          Download
                        </button>
                      </div>
                    </td>
                    {(role === "admin" || role === "manager") && activeTab === "pending" && (
                      <td style={{ padding: "15px" }}>
                        <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                          <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: "8px" }}>
                            Reasons: {getApprovalReasons(q).join(", ") || "Standard approval"}
                          </div>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              onClick={() => handleApprovalClick(q, "approve")}
                              disabled={role === "manager" && q.effectiveDiscountPercent > user?.threshold}
                              style={{
                                padding: "4px 8px",
                                backgroundColor: role === "manager" && q.effectiveDiscountPercent > user?.threshold ? "#ccc" : "#28a745",
                                color: "white",
                                border: "none",
                                borderRadius: "3px",
                                cursor: role === "manager" && q.effectiveDiscountPercent > user?.threshold ? "not-allowed" : "pointer",
                                fontSize: "0.8rem",
                              }}
                              title={role === "manager" && q.effectiveDiscountPercent > user?.threshold
                                ? `Requires admin approval (${q.effectiveDiscountPercent}% > ${user?.threshold}%)`
                                : "Approve quotation"}
                            >
                              ✓ Approve
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
                                fontSize: "0.8rem",
                              }}
                            >
                              ✗ Reject
                            </button>
                          </div>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Approval Modal */}
        {showApprovalModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "8px",
                maxWidth: "500px",
                width: "90%",
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {approvalAction === "approve" ? "Approve" : "Reject"} Quotation
              </h3>
              <p>
                <strong>Quotation ID:</strong> {selectedQuotation?.id}
                <br />
                <strong>Developer:</strong> {selectedQuotation?.developerName}
                <br />
                <strong>Discount:</strong> {selectedQuotation?.effectiveDiscountPercent}%
                <br />
                <strong>Total Amount:</strong>{" "}
                ₹{selectedQuotation?.totalAmount?.toLocaleString()}
              </p>
              <div style={{ marginBottom: "20px" }}>
                <strong>Approval Reasons:</strong>
                <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                  {getApprovalReasons(selectedQuotation).map((reason, index) => (
                    <li key={index} style={{ fontSize: "0.9rem", color: "#666" }}>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
              <p style={{ color: "#666" }}>
                Review the quotation details before{" "}
                {approvalAction === "approve" ? "approving" : "rejecting"}.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => setShowApprovalModal(false)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmApproval}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: approvalAction === "approve" ? "#28a745" : "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {approvalAction === "approve" ? "✓ Approve" : "✗ Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
