import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchQuotations, createQuotation } from '../services/quotations';


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

	function refresh() {
		load();
	}

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

	function toggleSort(key) {
		if (sortKey === key) {
			setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortKey(key);
			setSortOrder('asc');
		}
	}

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

	return (
		<div style={{ maxWidth: 1080, margin: '24px auto', padding: 16, color: '#1f2937', background: '#ffffff' }}>
			<div style={pageHeader}>
				<div>
					<h1 style={{ margin: 0 }}>Quotations</h1>
					<p style={{ margin: '6px 0 0', color: '#6b7280' }}>Search, filter, sort, and create quotations.</p>
				</div>
				<div>
					<button onClick={() => window.location.assign('/quotations/new')} style={btnPrimary}>
						+ New Quotation
					</button>
				</div>
			</div>

			{/* Controls */}
			<div style={controlsBar}>
				<input
					value={globalSearch}
					onChange={(e) => setGlobalSearch(e.target.value)}
					placeholder="Search all fields..."
					style={{ flex: 2, minWidth: 220, padding: 10, borderRadius: 6, border: '1px solid #d1d5db', background: '#ffffff', color: '#1f2937' }}
				/>
				<input
					value={projectFilter}
					onChange={(e) => setProjectFilter(e.target.value)}
					placeholder="Filter by project name"
					style={{ flex: 1, minWidth: 180, padding: 10, borderRadius: 6, border: '1px solid #d1d5db', background: '#ffffff', color: '#1f2937' }}
				/>
				<input
					value={promoterFilter}
					onChange={(e) => setPromoterFilter(e.target.value)}
					placeholder="Filter by promoter name"
					style={{ flex: 1, minWidth: 180, padding: 10, borderRadius: 6, border: '1px solid #d1d5db', background: '#ffffff', color: '#1f2937' }}
				/>
				<div style={{ display: 'flex', gap: 8 }}>
					<button onClick={refresh} style={btnLight} disabled={loading}>
						Refresh
					</button>
					<button
						onClick={() => { setGlobalSearch(''); setProjectFilter(''); setPromoterFilter(''); }}
						style={btnLight}
						disabled={loading}
					>
						Clear Filters
					</button>
				</div>
			</div>

			{/* Status row */}
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0 12px' }}>
				<div style={{ color: '#6b7280' }}>
					{loading ? (
						<span><Spinner /> Loading…</span>
					) : (
						<span>{visibleCount} result(s)</span>
					)}
				</div>
				{error ? (
					<div style={errorBanner}>
						<span>{error}</span>
						<button onClick={() => setError('')} style={errorDismiss} aria-label="Dismiss error">✕</button>
					</div>
				) : null}
			</div>

			{/* Table or states */}
			<div style={cardSurface}>
				<div style={{ overflowX: 'auto' }}>
					<table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, color: '#1f2937' }}>
						<thead style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1 }}>
							<tr>
								<th style={thStyle} onClick={() => toggleSort('id')}>ID {sortChevron('id', sortKey, sortOrder)}</th>
								<th style={thStyle} onClick={() => toggleSort('projectName')}>Project {sortChevron('projectName', sortKey, sortOrder)}</th>
								<th style={thStyle} onClick={() => toggleSort('promoterName')}>Promoter {sortChevron('promoterName', sortKey, sortOrder)}</th>
								<th style={thStyle} onClick={() => toggleSort('amount')}>Amount {sortChevron('amount', sortKey, sortOrder)}</th>
								<th style={thStyle} onClick={() => toggleSort('createdAt')}>Created {sortChevron('createdAt', sortKey, sortOrder)}</th>
								<th style={thStyle}>Created By</th>
								<th style={thStyle}>Services</th>
								<th style={{ ...thStyle, cursor: 'default' }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								[...Array(5)].map((_, i) => (
									<tr key={`skeleton-${i}`} style={{ borderTop: '1px solid #e5e7eb' }}>
										<td style={tdStyle}><SkeletonBar /></td>
										<td style={tdStyle}><SkeletonBar /></td>
										<td style={tdStyle}><SkeletonBar /></td>
										<td style={tdStyle}><SkeletonBar width={80} /></td>
										<td style={tdStyle}><SkeletonBar width={140} /></td>
										<td style={tdStyle}><SkeletonBar width={120} /></td>
										<td style={tdStyle}><SkeletonBar width={160} /></td>
										<td style={tdStyle}><div style={{ display: 'flex', gap: 8 }}><SkeletonBar width={60} /><SkeletonBar width={60} /><SkeletonBar width={90} /></div></td>
									</tr>
								))
							) : items.length === 0 ? (
								<tr>
									<td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
										<div style={{ display: 'grid', placeItems: 'center', gap: 8 }}>
											<div style={{ fontSize: 18, color: '#374151' }}>No quotations found</div>
											<div>Try adjusting filters or create a new quotation.</div>
											<div>
												<button onClick={() => setIsCreating(true)} style={btnPrimary}>+ New Quotation</button>
											</div>
										</div>
									</td>
								</tr>
							) : (
								items.map((q, idx) => (
									<tr
										key={q.id}
										style={{ borderTop: '1px solid #e5e7eb', background: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}
										onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
										onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#f9fafb')}
									>
										<td style={tdStyle}>{q.id}</td>
										<td style={tdStyle}>{q.projectName}</td>
										<td style={tdStyle}>{q.promoterName}</td>
										<td style={tdStyle}>₹ {Number(q.amount).toLocaleString()}</td>
										<td style={tdStyle}>{new Date(q.createdAt).toLocaleString()}</td>
										<td style={tdStyle}>{q.createdBy || '—'}</td>
										<td style={tdStyle}>{q.serviceSummary || '—'}</td>
										<td style={{ ...tdStyle }}>
											<div style={{ display: 'flex', gap: 8 }}>
												<button style={btnLight} onClick={() => onView(q)}>View</button>
												<button style={btnLight} onClick={() => onEdit(q)}>Edit</button>
												<button style={btnPrimary} onClick={() => onDownload(q)}>Download</button>
											</div>
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
				<div style={modalOverlay} onClick={() => setIsCreating(false)}>
					<div style={modalCard} onClick={(e) => e.stopPropagation()}>
						<h3 style={{ marginTop: 0 }}>Create Quotation</h3>
						<form onSubmit={handleCreate}>
							<div style={{ display: 'grid', gap: 12 }}>
								<input
									value={form.projectName}
									onChange={(e) => setForm({ ...form, projectName: e.target.value })}
									placeholder="Project name"
									style={inputStyle}
									required
								/>
								<input
									value={form.promoterName}
									onChange={(e) => setForm({ ...form, promoterName: e.target.value })}
									placeholder="Promoter name"
									style={inputStyle}
									required
								/>
								<input
									value={form.amount}
									onChange={(e) => setForm({ ...form, amount: e.target.value })}
									placeholder="Amount"
									style={inputStyle}
									type="number"
									min="0"
									required
								/>
							</div>
							<div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
								<button type="button" onClick={() => setIsCreating(false)} style={btnSecondary}>
									Cancel
								</button>
								<button type="submit" style={btnPrimary} disabled={loading}>
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

const thStyle = {
	textAlign: 'left',
	padding: '10px 8px',
	cursor: 'pointer',
	userSelect: 'none',
	borderBottom: '2px solid #e5e7eb',
	color: '#374151',
	fontWeight: '600'
};

const tdStyle = {
	padding: '10px 8px',
};

function sortChevron(key, activeKey, order) {
	if (key !== activeKey) return null;
	return <span style={{ color: '#9ca3af' }}>{order === 'asc' ? '▲' : '▼'}</span>;
}

function Spinner() {
	return (
		<span style={{ display: 'inline-block', width: 14, height: 14, marginRight: 6, border: '2px solid #d1d5db', borderTopColor: '#1e40af', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
	);
}

function SkeletonBar({ width = 120 }) {
	return (
		<div style={{ height: 10, width, background: 'linear-gradient(90deg,#f3f4f6,#e5e7eb,#f3f4f6)', borderRadius: 4 }} />
	);
}

const modalOverlay = {
	position: 'fixed',
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	background: 'rgba(0,0,0,0.35)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center'
};

const modalCard = {
	background: '#ffffff',
	minWidth: 360,
	maxWidth: 480,
	width: '90%',
	borderRadius: 8,
	padding: 16,
	boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
	border: '1px solid #e5e7eb',
	color: '#1f2937'
};

const inputStyle = {
	padding: 10,
	borderRadius: 6,
	border: '1px solid #d1d5db',
	background: '#ffffff',
	color: '#1f2937'
};

const btnPrimary = {
	padding: '10px 14px',
	background: '#1e40af',
	color: '#ffffff',
	border: 0,
	borderRadius: 6,
	cursor: 'pointer',
	fontWeight: '500'
};

const btnSecondary = {
	padding: '10px 14px',
	background: '#6b7280',
	color: '#ffffff',
	border: 0,
	borderRadius: 6,
	cursor: 'pointer',
	fontWeight: '500'
};

const btnLight = {
	padding: '10px 14px',
	background: '#ffffff',
	color: '#374151',
	border: '1px solid #d1d5db',
	borderRadius: 6,
	cursor: 'pointer',
	fontWeight: '500'
};

const pageHeader = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	marginBottom: 12
};

const controlsBar = {
	display: 'flex',
	gap: 12,
	flexWrap: 'wrap',
	alignItems: 'center',
	margin: '12px 0 16px'
};

const errorBanner = {
	display: 'flex',
	alignItems: 'center',
	gap: 12,
	padding: '8px 12px',
	background: '#fef2f2',
	border: '1px solid #fecaca',
	color: '#dc2626',
	borderRadius: 6
};

const errorDismiss = {
	background: 'transparent',
	border: 0,
	cursor: 'pointer',
	color: '#dc2626',
	fontSize: 14
};

const cardSurface = {
	background: '#ffffff',
	border: '1px solid #e5e7eb',
	borderRadius: 8,
	boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

// Keyframes for spinner (inline style fallback)
const styleTag = document.createElement('style');
styleTag.innerHTML = '@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }';
if (typeof document !== 'undefined' && !document.getElementById('inline-spin-kf')) {
	styleTag.id = 'inline-spin-kf';
	document.head.appendChild(styleTag);
}


