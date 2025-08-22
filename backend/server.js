const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;
// Optional Supabase client (used if env vars provided)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;


app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// In-memory quotations store (replace with DB in production)
/**
 * A quotation shape:
 * { id: string, projectName: string, promoterName: string, amount: number, createdAt: string, createdBy?: string, serviceSummary?: string }
 */
const quotations = [
  {
    id: 'Q-1001',
    projectName: 'Sunrise Residency',
    promoterName: 'Apex Builders',
    amount: 1250000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    createdBy: 'parth@company.com',
    serviceSummary: 'Structural audit, soil test, legal vetting'
  },
  {
    id: 'Q-1002',
    projectName: 'Green Meadows',
    promoterName: 'Everest Constructions',
    amount: 980000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    createdBy: 'admin@company.com',
    serviceSummary: 'RERA filing, compliance review'
  },
  {
    id: 'Q-1003',
    projectName: 'Ocean View',
    promoterName: 'BlueSky Developers',
    amount: 2100000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    createdBy: 'ops@company.com',
    serviceSummary: 'Cost estimation, environmental clearance support'
  }
];

function toLower(value) {
  return String(value || '').toLowerCase();
}

// GET /api/quotations with search, filters and sorting
app.get('/api/quotations', async (req, res) => {
  const { search = '', projectName = '', promoterName = '', sort = 'createdAt', order = 'desc' } = req.query;

  if (supabase) {
    // Fetch from Supabase table 'quotations'
    let query = supabase.from('quotations').select('*');
    if (search) {
      // Basic ilike across key fields
      const like = `%${search}%`;
      query = query.or(
        `id.ilike.${like},projectName.ilike.${like},promoterName.ilike.${like},developerName.ilike.${like}`
      );
    }
    if (projectName) query = query.ilike('projectName', `%${projectName}%`);
    if (promoterName) query = query.ilike('promoterName', `%${promoterName}%`);
    const orderCol = ['id', 'projectName', 'promoterName', 'amount', 'createdAt'].includes(sort) ? sort : 'createdAt';
    query = query.order(orderCol, { ascending: order === 'asc' });
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ data: data || [] });
  }

  // Fallback to in-memory
  const searchLc = toLower(search);
  const projectLc = toLower(projectName);
  const promoterLc = toLower(promoterName);
  let results = quotations.filter((q) => {
    const matchesSearch = !searchLc ||
      toLower(q.id).includes(searchLc) ||
      toLower(q.projectName).includes(searchLc) ||
      toLower(q.promoterName).includes(searchLc) ||
      String(q.amount).includes(searchLc);
    const matchesProject = !projectLc || toLower(q.projectName).includes(projectLc);
    const matchesPromoter = !promoterLc || toLower(q.promoterName).includes(promoterLc);
    return matchesSearch && matchesProject && matchesPromoter;
  });
  const sortKey = ['id', 'projectName', 'promoterName', 'amount', 'createdAt'].includes(sort) ? sort : 'createdAt';
  const sortDir = order === 'asc' ? 1 : -1;
  results.sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    if (sortKey === 'amount') return (va - vb) * sortDir;
    return va > vb ? 1 * sortDir : va < vb ? -1 * sortDir : 0;
  });
  res.json({ data: results });
});

// POST /api/quotations to create a new quotation
app.post('/api/quotations', async (req, res) => {
  const payload = req.body || {};
  const { developerName, projectName, promoterName, amount } = payload;
  // Keep amount optional for new flow; we store extended fields
  if (!developerName) {
    return res.status(400).json({ error: 'developerName is required' });
  }

  if (supabase) {
    const toInsert = {
      id: payload.id || undefined,
      developerType: payload.developerType || null,
      projectRegion: payload.projectRegion || null,
      projectLocation: payload.projectLocation || null,
      plotArea: typeof payload.plotArea === 'number' ? payload.plotArea : null,
      developerName,
      projectName: projectName || null,
      promoterName: promoterName || null,
      amount: typeof payload.amount === 'number' ? payload.amount : null,
      validity: payload.validity || null,
      paymentSchedule: payload.paymentSchedule || null,
      reraNumber: payload.reraNumber || null,
      serviceSummary: payload.serviceSummary || null,
      createdBy: payload.createdBy || null,
      createdAt: new Date().toISOString()
    };
    const { data, error } = await supabase.from('quotations').insert(toInsert).select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ data });
  }

  const nextId = `Q-${1000 + quotations.length + 1}`;
  const quotation = {
    id: nextId,
    developerType: payload.developerType || null,
    projectRegion: payload.projectRegion || null,
    projectLocation: payload.projectLocation || null,
    plotArea: typeof payload.plotArea === 'number' ? payload.plotArea : null,
    developerName,
    projectName: projectName || null,
    promoterName: promoterName || null,
    amount: typeof payload.amount === 'number' ? payload.amount : null,
    validity: payload.validity || null,
    paymentSchedule: payload.paymentSchedule || null,
    reraNumber: payload.reraNumber || null,
    serviceSummary: payload.serviceSummary || null,
    createdBy: payload.createdBy || null,
    createdAt: new Date().toISOString()
  };
  quotations.push(quotation);
  res.status(201).json({ data: quotation });
});

// Update quotation (e.g., add headers/services)
app.put('/api/quotations/:id', async (req, res) => {
  const { id } = req.params;
  const payload = req.body || {};

  if (supabase) {
    const { data, error } = await supabase
      .from('quotations')
      .update({ headers: payload.headers || null })
      .eq('id', id)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ data });
  }

  const idx = quotations.findIndex((q) => q.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  quotations[idx] = { ...quotations[idx], headers: payload.headers || null };
  res.json({ data: quotations[idx] });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});