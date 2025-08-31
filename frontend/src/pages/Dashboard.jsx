import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [quotations, setQuotations] = useState([]);
  const [pending, setPending] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [user, setUser] = useState(null);

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

  const handleApprove = async (id, action = "approve") => {
    const res = await fetch(
      `http://localhost:3001/api/quotations/${id}/approve`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      }
    );
    const data = await res.json();
    if (res.ok) {
      fetchPending();
      fetchQuotations();
    } else {
      alert(data.error);
    }
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

  const statusBadge = (status) => {
    const base = {
      padding: "4px 8px",
      borderRadius: "6px",
      fontWeight: "600",
      fontSize: "0.85rem",
    };
    if (status === "approved")
      return (
        <span style={{ ...base, background: "#dcfce7", color: "#166534" }}>
          Approved ✅
        </span>
      );
    if (status === "rejected")
      return (
        <span style={{ ...base, background: "#fee2e2", color: "#991b1b" }}>
          Rejected ❌
        </span>
      );
    if (status === "pending_approval")
      return (
        <span style={{ ...base, background: "#fef9c3", color: "#854d0e" }}>
          Pending ⏳
        </span>
      );
    return (
      <span style={{ ...base, background: "#e2e8f0", color: "#1a202c" }}>
        {status}
      </span>
    );
  };

  return (
    <div className="dashboard-container">
      <style>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: #f7f9fc;
          color: #1a202c;
        }
        .dashboard-container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 1.5rem;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .header-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .btn {
          padding: 0.6rem 1rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          transition: all 0.2s ease-in-out;
        }
        .btn-primary { background: #1e40af; color: #ffffff; }
        .btn-primary:hover { background: #1a365d; }
        .btn-secondary { background: #718096; color: #ffffff; }
        .btn-secondary:hover { background: #5c6273; }
        .btn-success { background: #16a34a; color: #fff; }
        .btn-danger { background: #dc2626; color: #fff; }
        .tabs-bar { margin-bottom: 15px; }
        .card-surface {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .quotations-table {
          width: 100%;
          border-collapse: collapse;
        }
        .quotations-table th, .quotations-table td {
          padding: 0.9rem 1rem;
          border-bottom: 1px solid #e2e8f0;
          text-align: left;
        }
        .quotations-table th {
          background: #f7f9fc;
          font-weight: 600;
          color: #4a5568;
        }
        .quotations-table tr:hover { background-color: #f1f5f9; }
        .status-row {
          margin-bottom: 15px;
          padding: 10px;
          background: #f7f9fc;
          border-radius: 8px;
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1>Quotations Dashboard</h1>
          <p>Manage quotations & approvals</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => (window.location.href = "/quotations/new")}
          >
            Create Quotation
          </button>
          {role === "admin" && (
            <button
              className="btn btn-primary"
              onClick={() => (window.location.href = "/signup")}
            >
              Create User
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {user && (
        <div className="status-row">
          Logged in as <b>{user.fname} {user.lname}</b> ({user.username}) | Role: <b>{user.role}</b> {user.role === "manager" && `(Threshold ${user.threshold}%)`}
        </div>
      )}

      {(role === "admin" || role === "manager") && (
        <div className="tabs-bar">
          <button
            className={`btn ${activeTab === "all" ? "btn-primary" : "btn-light"}`}
            onClick={() => setActiveTab("all")}
          >
            All Quotations
          </button>
          <button
            className={`btn ${activeTab === "pending" ? "btn-primary" : "btn-light"}`}
            onClick={() => setActiveTab("pending")}
          >
            Approval Queue ({pending.length})
          </button>
        </div>
      )}

      <div className="card-surface">
        <table className="quotations-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Developer</th>
              <th>Project</th>
              <th>Status</th>
              <th>Discount %</th>
              {(role === "admin" || role === "manager") &&
                activeTab === "pending" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {list.map((q) => (
              <tr key={q.id}>
                <td>{q.id}</td>
                <td>{q.developerName}</td>
                <td>{q.projectName}</td>
                <td>{statusBadge(q.status)}</td>
                <td>{q.discountPercent}</td>
                {(role === "admin" || role === "manager") &&
                  activeTab === "pending" && (
                    <td>
                      <button
                        onClick={() => handleApprove(q.id, "approve")}
                        className="btn btn-success"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprove(q.id, "reject")}
                        className="btn btn-danger"
                      >
                        Reject
                      </button>
                    </td>
                  )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
