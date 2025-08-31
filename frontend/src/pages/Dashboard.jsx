import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchQuotations, createQuotation } from '../services/quotations';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';

const Dashboard = () => {
  // State management
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);

  // Load quotations on component mount
  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchQuotations();
      setQuotations(data || []);
      
      // Filter pending approvals
      const pending = (data || []).filter(q => q.status === 'pending');
      setPendingApprovals(pending);
    } catch (err) {
      setError('Failed to load quotations. Please try again.');
      console.error('Error loading quotations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter and sort quotations
  const filteredQuotations = useMemo(() => {
    let filtered = quotations.filter(q => {
      const matchesSearch = !searchTerm || 
        (q.projectName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (q.developerName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (q.id?.toString().includes(searchTerm));
      
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'totalAmount') {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
        }
        
        if (sortConfig.key === 'createdAt') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [quotations, searchTerm, statusFilter, sortConfig]);

  // Sorting functionality
  const toggleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return (
        <svg className="w-4 h-4 ml-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }
    
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { variant: 'secondary', label: 'Draft' },
      pending: { variant: 'warning', label: 'Pending' },
      approved: { variant: 'success', label: 'Approved' },
      rejected: { variant: 'danger', label: 'Rejected' }
    };
    
    const config = statusConfig[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const ErrorBanner = ({ error, onDismiss }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 animate-slide-down">
      <div className="flex items-center">
        <svg className="w-5 h-5 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-800 font-medium flex-1">{error}</p>
        <button
          onClick={onDismiss}
          className="ml-auto text-red-600 hover:text-red-800 transition-colors p-1 rounded hover:bg-red-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Quotation Management</h1>
              <p className="text-slate-600 mt-1">Manage and track your quotations</p>
            </div>
            <div className="flex gap-2 items-center">
              <Button variant="outline" onClick={loadQuotations} disabled={loading}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Quotation
              </Button>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search quotations by ID, project, or developer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="sm:w-48">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                placeholder="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <ErrorBanner 
            error={error} 
            onDismiss={() => setError('')} 
          />
        )}

        {/* Pending Approvals Section */}
        {pendingApprovals.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-amber-900 mb-4">
              Pending Approvals ({pendingApprovals.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-200">
                    <th className="text-left py-3 px-4 font-semibold text-amber-900">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-900">Project</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-900">Promoter</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-900">Discount %</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-900">Total</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-900">Requested By</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApprovals.map((q) => (
                    <tr key={q.id} className="border-b border-amber-100 hover:bg-amber-25 transition-colors">
                      <td className="py-3 px-4 text-amber-900 font-medium">#{q.id}</td>
                      <td className="py-3 px-4 text-amber-900">{q.projectName || '—'}</td>
                      <td className="py-3 px-4 text-amber-900">{q.developerName || '—'}</td>
                      <td className="py-3 px-4 text-amber-900 font-semibold">{q.discountPercent || 0}%</td>
                      <td className="py-3 px-4 text-amber-900 font-semibold">₹ {Number(q.totalAmount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-amber-900">{q.createdBy || '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Approve</Button>
                          <Button variant="danger" size="sm">Reject</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Main Quotations Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Spinner size="lg" className="mb-4" />
              <p className="text-slate-600 text-lg">Loading quotations...</p>
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">No quotations found</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters or create a new quotation.'
                  : 'Get started by creating your first quotation.'
                }
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Create New Quotation
              </Button>
            </div>
          ) : (
            <>
              {/* Status Row */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex justify-between items-center text-sm text-slate-600">
                  <span>
                    Showing {filteredQuotations.length} of {quotations.length} quotations
                  </span>
                  {pendingApprovals.length > 0 && (
                    <span className="text-amber-700 font-medium">
                      {pendingApprovals.length} pending approval{pendingApprovals.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold text-slate-900 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                        onClick={() => toggleSort('id')}
                      >
                        <div className="flex items-center">
                          ID
                          {getSortIcon('id')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold text-slate-900 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                        onClick={() => toggleSort('projectName')}
                      >
                        <div className="flex items-center">
                          Project
                          {getSortIcon('projectName')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold text-slate-900 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                        onClick={() => toggleSort('developerName')}
                      >
                        <div className="flex items-center">
                          Promoter
                          {getSortIcon('developerName')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold text-slate-900 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                        onClick={() => toggleSort('totalAmount')}
                      >
                        <div className="flex items-center">
                          Amount
                          {getSortIcon('totalAmount')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold text-slate-900 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                        onClick={() => toggleSort('createdAt')}
                      >
                        <div className="flex items-center">
                          Created
                          {getSortIcon('createdAt')}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredQuotations.map((quotation, index) => (
                      <tr 
                        key={quotation.id} 
                        className={`hover:bg-slate-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          #{quotation.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          <div className="font-medium">{quotation.projectName || '—'}</div>
                          {quotation.projectLocation && (
                            <div className="text-slate-500 text-xs mt-1">{quotation.projectLocation}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {quotation.developerName || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          ₹ {Number(quotation.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <div>{new Date(quotation.createdAt).toLocaleDateString()}</div>
                          <div className="text-xs text-slate-400">
                            {new Date(quotation.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(quotation.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </Button>
                            <Button variant="ghost" size="sm">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <ModalHeader onClose={() => setIsCreateModalOpen(false)}>
          Quick Create Quotation
        </ModalHeader>
        <ModalBody>
          <p className="text-slate-600 mb-4">
            Choose how you'd like to create a new quotation:
          </p>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4"
              onClick={() => {
                setIsCreateModalOpen(false);
                // Navigate to full form
                window.location.href = '/quotations/new';
              }}
            >
              <div className="text-left">
                <div className="font-semibold">Full Quotation Form</div>
                <div className="text-sm text-slate-500 mt-1">Complete form with all project details</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4"
              onClick={() => {
                setIsCreateModalOpen(false);
                // Navigate to template selection
                window.location.href = '/quotations/templates';
              }}
            >
              <div className="text-left">
                <div className="font-semibold">Use Template</div>
                <div className="text-sm text-slate-500 mt-1">Start from existing quotation template</div>
              </div>
            </Button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsCreateModalOpen(false)}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Dashboard;