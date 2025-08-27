import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchQuotations, createQuotation } from '../services/quotations';
import './Dashboard.css'; 

// Small, reusable components for better readability
const Spinner = () => (
    <div className="spinner" role="status">
        <span className="visually-hidden">Loading...</span>
    </div>
);

const SkeletonBar = ({ width = '100%' }) => (
    <div className="skeleton-bar" style={{ width }} />
);

const SortChevron = ({ key, activeKey, order }) => {
    if (key !== activeKey) return null;
    return <span className="sort-chevron">{order === 'asc' ? '▲' : '▼'}</span>;
};

export default function Dashboard() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [globalSearch, setGlobalSearch] = useState('');
    const [projectFilter, setProjectFilter] = useState('');
    const [promoterFilter, setPromoterFilter] = useState('');
    const [sortKey, setSortKey] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState({ projectName: '', promoterName: '', amount: '' });

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchQuotations({
                search: globalSearch,
                projectName: projectFilter,
                promoterName: promoterFilter,
                sort: sortKey,
                order: sortOrder
            });
            setItems(data);
        } catch (e) {
            setError('Failed to load quotations');
        } finally {
            setLoading(false);
        }
    }, [globalSearch, projectFilter, promoterFilter, sortKey, sortOrder]);

    useEffect(() => {
        load();
    }, [load]);

    const refresh = () => load();

    const clearFilters = () => {
        setGlobalSearch('');
        setProjectFilter('');
        setPromoterFilter('');
    };

    const toggleSort = (key) => {
        if (sortKey === key) {
            setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const visibleCount = useMemo(() => items.length, [items]);

    async function handleCreate(e) {
        e.preventDefault();
        const amountNum = Number(form.amount);
        if (!form.projectName || !form.promoterName || !Number.isFinite(amountNum)) return;
        setLoading(true);
        setError('');
        try {
            await createQuotation({
                projectName: form.projectName,
                promoterName: form.promoterName,
                amount: amountNum
            });
            setIsCreating(false);
            setForm({ projectName: '', promoterName: '', amount: '' });
            await load();
        } catch (e) {
            setError('Failed to create quotation');
        } finally {
            setLoading(false);
        }
    }

    // Actions
    function onView(q) {
        alert(`View quotation ${q.id}`);
    }

    function onEdit(q) {
        alert(`Edit quotation ${q.id}`);
    }

    function onDownload(q) {
        const blob = new Blob([JSON.stringify(q, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${q.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return (
        <div className="dashboard-container">
            {/* Page Header */}
            <header className="page-header">
                <div>
                    <h1>Quotations</h1>
                    <p>Search, filter, sort, and create quotations.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => window.location.assign('/quotations/new')}
                >
                    + New Quotation
                </button>
            </header>
            
            {/* Controls */}
            <div className="controls-bar">
                <input
                    className="search-input"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Search all fields..."
                />
                <input
                    className="filter-input"
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    placeholder="Filter by project name"
                />
                <input
                    className="filter-input"
                    value={promoterFilter}
                    onChange={(e) => setPromoterFilter(e.target.value)}
                    placeholder="Filter by promoter name"
                />
                <div className="button-group">
                    <button onClick={refresh} className="btn btn-light" disabled={loading}>
                        Refresh
                    </button>
                    <button onClick={clearFilters} className="btn btn-light" disabled={loading}>
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Status row */}
            <div className="status-row">
                <div className="status-info">
                    {loading ? (
                        <span><Spinner /> Loading…</span>
                    ) : (
                        <span>{visibleCount} result(s)</span>
                    )}
                </div>
                {error && (
                    <div className="error-banner">
                        <span>{error}</span>
                        <button onClick={() => setError('')} className="error-dismiss" aria-label="Dismiss error">✕</button>
                    </div>
                )}
            </div>

            {/* Table or states */}
            <div className="card-surface">
                <div className="table-responsive">
                    <table className="quotations-table">
                        <thead>
                            <tr>
                                <th onClick={() => toggleSort('id')}>ID <SortChevron key="id" activeKey={sortKey} order={sortOrder} /></th>
                                <th onClick={() => toggleSort('projectName')}>Project <SortChevron key="projectName" activeKey={sortKey} order={sortOrder} /></th>
                                <th onClick={() => toggleSort('promoterName')}>Promoter <SortChevron key="promoterName" activeKey={sortKey} order={sortOrder} /></th>
                                <th onClick={() => toggleSort('amount')}>Amount <SortChevron key="amount" activeKey={sortKey} order={sortOrder} /></th>
                                <th onClick={() => toggleSort('createdAt')}>Created <SortChevron key="createdAt" activeKey={sortKey} order={sortOrder} /></th>
                                <th>Created By</th>
                                <th>Services</th>
                                <th className="no-sort">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`skeleton-${i}`}>
                                        <td><SkeletonBar width="50px" /></td>
                                        <td><SkeletonBar width="120px" /></td>
                                        <td><SkeletonBar width="120px" /></td>
                                        <td><SkeletonBar width="80px" /></td>
                                        <td><SkeletonBar width="140px" /></td>
                                        <td><SkeletonBar width="100px" /></td>
                                        <td><SkeletonBar width="160px" /></td>
                                        <td><div className="action-buttons"><SkeletonBar width="60px" /><SkeletonBar width="60px" /><SkeletonBar width="90px" /></div></td>
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="no-results">
                                        <div className="no-results-content">
                                            <h3>No quotations found</h3>
                                            <p>Try adjusting your filters or create a new quotation.</p>
                                            <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
                                                + New Quotation
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((q, idx) => (
                                    <tr key={q.id}>
                                        <td>{q.id}</td>
                                        <td>{q.projectName}</td>
                                        <td>{q.promoterName}</td>
                                        <td>₹ {Number(q.amount).toLocaleString()}</td>
                                        <td>{new Date(q.createdAt).toLocaleString()}</td>
                                        <td>{q.createdBy || '—'}</td>
                                        <td>{q.serviceSummary || '—'}</td>
                                        <td className="action-buttons">
                                            <button className="btn btn-light" onClick={() => onView(q)}>View</button>
                                            <button className="btn btn-light" onClick={() => onEdit(q)}>Edit</button>
                                            <button className="btn btn-primary" onClick={() => onDownload(q)}>Download</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create modal */}
            {isCreating && (
                <div className="modal-overlay" onClick={() => setIsCreating(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3>Create Quotation</h3>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <input
                                    className="form-input"
                                    value={form.projectName}
                                    onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                                    placeholder="Project name"
                                    required
                                />
                                <input
                                    className="form-input"
                                    value={form.promoterName}
                                    onChange={(e) => setForm({ ...form, promoterName: e.target.value })}
                                    placeholder="Promoter name"
                                    required
                                />
                                <input
                                    className="form-input"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    placeholder="Amount"
                                    type="number"
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsCreating(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}