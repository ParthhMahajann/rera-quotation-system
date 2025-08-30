import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchQuotations, createQuotation } from '../services/quotations';
import './Dashboard.css';

const Spinner = () => <div className="spinner"></div>;

const ErrorBanner = ({ error, onDismiss }) => (
  <div className="error-banner">
    <span>⚠️ {error}</span>
    <button className="error-dismiss" onClick={onDismiss}>×</button>
  </div>
);

const NoResults = ({ onCreateNew }) => (
  <div className="no-results">
    <div className="no-results-content">
      <h3>No quotations found</h3>
      <p>Try adjusting your filters or create a new quotation.</p>
      <button className="btn btn-primary" onClick={onCreateNew}>
        Create New Quotation
      </button>
    </div>
  </div>
);

export default function Dashboard() {
  const [quotations, setQuotations] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [projectNameFilter, setProjectNameFilter] = useState('');
  const [promoterNameFilter, setPromoterNameFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuotationName, setNewQuotationName] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all | pending

  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/quotations?search=${search}&projectName=${projectNameFilter}&promoterName=${promoterNameFilter}&sort=${sortField}&order=${sortOrder}`
      );
      const data = await res.json();
      setQuotations(data.data || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch quotations:', err);
      setError('Failed to load quotations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, projectNameFilter, promoterNameFilter, sortField, sortOrder]);

  const fetchPending = useCallback(async () => {
    if (role !== 'admin') return;
    try {
      const res = await fetch('/api/quotations/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setPending(data.data || []);
      } else {
        console.error('Failed to fetch pending quotations:', data.error);
      }
    } catch (err) {
      console.error('Failed to fetch pending quotations:', err);
    }
  }, [role, token]);

  useEffect(() => {
    fetchData();
    fetchPending();
  }, [fetchData, fetchPending]);

  const toggleSort = useCallback(
    (field) => {
      if (sortField === field) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortOrder('asc');
      }
    },
    [sortField]
  );

  const handleView = (id) => (window.location.href = `/quotations/${id}/summary`);
  const handleEdit = (id) => (window.location.href = `/quotations/${id}/services`);

  const handleDownload = useCallback(
    (id) => {
      const quotation = quotations.find((q) => q.id === id) || pending.find((q) => q.id === id);
      if (!quotation) return;
      const quotationData = { ...quotation };
      const blob = new Blob([JSON.stringify(quotationData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotation-${quotation.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [quotations, pending]
  );

  const handleApprove = async (id, action) => {
    try {
      const res = await fetch(`/api/quotations/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchPending();
        fetchData();
      } else {
        alert(data.error || 'Failed to update approval');
      }
    } catch (err) {
      console.error('Approval error:', err);
    }
  };

  const handleCreateNew = () => (window.location.href = '/quotations/new');

  const handleQuickCreate = useCallback(async () => {
    if (!newQuotationName.trim()) return;
    try {
      await createQuotation({
        developerType: 'cat1',
        developerName: newQuotationName.trim(),
        projectRegion: 'Mumbai City',
        plotArea: 1000,
        createdBy: 'Dashboard User',
      });
      setShowCreateModal(false);
      setNewQuotationName('');
      fetchData();
    } catch (err) {
      console.error('Failed to create quotation:', err);
      setError('Failed to create quotation. Please try again.');
    }
  }, [newQuotationName, fetchData]);

  const filteredAndSortedQuotations = useMemo(() => {
    return quotations.slice().sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'totalAmount') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (sortField === 'createdAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [quotations, sortField, sortOrder]);

  const getSortIcon = (field) => {
    if (sortField !== field) return <span className="sort-chevron">↕️</span>;
    return <span className="sort-chevron">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1>Quotations Dashboard</h1>
          <p>Manage and track your quotations</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleCreateNew}>
            Create New Quotation
          </button>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Tabs for All vs Pending */}
      {role === 'admin' && (
        <div className="tabs-bar">
          <button
            className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => setActiveTab('all')}
          >
            All Quotations
          </button>
          <button
            className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => setActiveTab('pending')}
          >
            Approval Queue ({pending.length})
          </button>
        </div>
      )}

      {error && <ErrorBanner error={error} onDismiss={() => setError('')} />}

      {/* All quotations table */}
      {activeTab === 'all' && (
        <>
          <div className="controls-bar">
            <input
              type="text"
              placeholder="Search quotations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <input
              type="text"
              placeholder="Filter by project name..."
              value={projectNameFilter}
              onChange={(e) => setProjectNameFilter(e.target.value)}
              className="filter-input"
            />
            <input
              type="text"
              placeholder="Filter by promoter name..."
              value={promoterNameFilter}
              onChange={(e) => setPromoterNameFilter(e.target.value)}
              className="filter-input"
            />
            <div className="button-group">
              <button className="btn btn-light" onClick={fetchData}>
                Refresh
              </button>
            </div>
          </div>

          <div className="status-row">
            <span>{filteredAndSortedQuotations.length} quotations found</span>
            {loading && <Spinner />}
          </div>

          <div className="card-surface">
            <div className="table-responsive">
              <table className="quotations-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('id')}>ID {getSortIcon('id')}</th>
                    <th onClick={() => toggleSort('projectName')}>Project {getSortIcon('projectName')}</th>
                    <th onClick={() => toggleSort('developerName')}>Promoter {getSortIcon('developerName')}</th>
                    <th onClick={() => toggleSort('totalAmount')}>Amount {getSortIcon('totalAmount')}</th>
                    <th onClick={() => toggleSort('createdAt')}>Created {getSortIcon('createdAt')}</th>
                    <th className="no-sort">Status</th>
                    <th className="no-sort">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedQuotations.map((q) => (
                    <tr key={q.id}>
                      <td>{q.id}</td>
                      <td>{q.projectName || '—'}</td>
                      <td>{q.developerName || '—'}</td>
                      <td>₹ {Number(q.totalAmount || 0).toLocaleString()}</td>
                      <td>{new Date(q.createdAt).toLocaleString()}</td>
                      <td>{q.status}</td>
                      <td>
                        <button className="btn btn-light" onClick={() => handleView(q.id)}>View</button>
                        <button className="btn btn-light" onClick={() => handleEdit(q.id)}>Edit</button>
                        <button className="btn btn-primary" onClick={() => handleDownload(q.id)}>Download</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pending approvals table */}
      {activeTab === 'pending' && role === 'admin' && (
        <div className="card-surface">
          <div className="table-responsive">
            <table className="quotations-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Project</th>
                  <th>Promoter</th>
                  <th>Discount %</th>
                  <th>Total</th>
                  <th>Requested By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '1rem' }}>
                      No pending approvals
                    </td>
                  </tr>
                ) : (
                  pending.map((q) => (
                    <tr key={q.id}>
                      <td>{q.id}</td>
                      <td>{q.projectName || '—'}</td>
                      <td>{q.developerName || '—'}</td>
                      <td>{q.discountPercent}%</td>
                      <td>₹ {Number(q.totalAmount || 0).toLocaleString()}</td>
                      <td>{q.createdBy || '—'}</td>
                      <td>
                        <button className="btn btn-primary" onClick={() => handleApprove(q.id, 'approve')}>
                          Approve
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleApprove(q.id, 'reject')}>
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
