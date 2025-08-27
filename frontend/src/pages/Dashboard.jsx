import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchQuotations, createQuotation } from '../services/quotations';
import './Dashboard.css';

// Small, reusable components for better readability
const Spinner = () => (
  <div className="spinner"></div>
);

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [projectNameFilter, setProjectNameFilter] = useState('');
  const [promoterNameFilter, setPromoterNameFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuotationName, setNewQuotationName] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchQuotations({
        search,
        projectName: projectNameFilter,
        promoterName: promoterNameFilter,
        sort: sortField,
        order: sortOrder,
      });
      setQuotations(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch quotations:', err);
      setError('Failed to load quotations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, projectNameFilter, promoterNameFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSort = useCallback((field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField]);

  const handleView = useCallback((id) => {
    window.location.href = `/quotations/${id}/summary`;
  }, []);

  const handleEdit = useCallback((id) => {
    window.location.href = `/quotations/${id}/services`;
  }, []);

  const handleDownload = useCallback((id) => {
    // Find the quotation
    const quotation = quotations.find(q => q.id === id);
    if (!quotation) return;

    const quotationData = {
      id: quotation.id,
      projectDetails: {
        developerName: quotation.developerName,
        projectName: quotation.projectName,
        developerType: quotation.developerType,
        projectRegion: quotation.projectRegion,
        plotArea: quotation.plotArea,
        validity: quotation.validity,
        paymentSchedule: quotation.paymentSchedule,
        reraNumber: quotation.reraNumber
      },
      services: quotation.headers || [],
      pricing: quotation.pricingBreakdown || [],
      totalAmount: quotation.totalAmount || 0,
      createdAt: quotation.createdAt
    };

    const blob = new Blob([JSON.stringify(quotationData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotation-${quotation.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [quotations]);

  const handleCreateNew = useCallback(() => {
    window.location.href = '/quotations/new';
  }, []);

  const handleQuickCreate = useCallback(async () => {
    if (!newQuotationName.trim()) return;
    
    try {
      await createQuotation({
        developerType: 'cat1',
        developerName: newQuotationName.trim(),
        projectRegion: 'Mumbai City',
        plotArea: 1000,
        createdBy: 'Dashboard User'
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
      
      // Handle different data types
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

  const getSortIcon = useCallback((field) => {
    if (sortField !== field) return <span className="sort-chevron">↕️</span>;
    return <span className="sort-chevron">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  }, [sortField, sortOrder]);

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1>Quotations Dashboard</h1>
          <p>Manage and track your quotations</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateNew}>
          Create New Quotation
        </button>
      </div>

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
          <button className="btn btn-secondary" onClick={() => setShowCreateModal(true)}>
            Quick Create
          </button>
          <button className="btn btn-light" onClick={fetchData}>
            Refresh
          </button>
        </div>
      </div>

      {error && <ErrorBanner error={error} onDismiss={() => setError('')} />}

      <div className="status-row">
        <span>{filteredAndSortedQuotations.length} quotations found</span>
        {loading && <Spinner />}
      </div>

      <div className="card-surface">
        <div className="table-responsive">
          <table className="quotations-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('id')}>
                  ID {getSortIcon('id')}
                </th>
                <th onClick={() => toggleSort('projectName')}>
                  Project {getSortIcon('projectName')}
                </th>
                <th onClick={() => toggleSort('developerName')}>
                  Promoter {getSortIcon('developerName')}
                </th>
                <th onClick={() => toggleSort('totalAmount')}>
                  Amount {getSortIcon('totalAmount')}
                </th>
                <th onClick={() => toggleSort('createdAt')}>
                  Created {getSortIcon('createdAt')}
                </th>
                <th className="no-sort">Created By</th>
                <th className="no-sort">Services</th>
                <th className="no-sort">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <Spinner /> Loading quotations...
                    </div>
                  </td>
                </tr>
              ) : filteredAndSortedQuotations.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <NoResults onCreateNew={handleCreateNew} />
                  </td>
                </tr>
              ) : (
                filteredAndSortedQuotations.map((q) => (
                  <tr key={q.id}>
                    <td>{q.id}</td>
                    <td>{q.projectName || '—'}</td>
                    <td>{q.developerName || '—'}</td>
                    <td>₹ {Number(q.totalAmount || 0).toLocaleString()}</td>
                    <td>{new Date(q.createdAt).toLocaleString()}</td>
                    <td>{q.createdBy || '—'}</td>
                    <td>{q.serviceSummary || '—'}</td>
                    <td>
                      <button className="btn btn-light" onClick={() => handleView(q.id)}>
                        View
                      </button>
                      <button className="btn btn-light" onClick={() => handleEdit(q.id)}>
                        Edit
                      </button>
                      <button className="btn btn-primary" onClick={() => handleDownload(q.id)}>
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Quick Create Quotation</h3>
            <div className="form-group">
              <input
                type="text"
                placeholder="Enter developer/company name"
                value={newQuotationName}
                onChange={(e) => setNewQuotationName(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleQuickCreate}
                disabled={!newQuotationName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
