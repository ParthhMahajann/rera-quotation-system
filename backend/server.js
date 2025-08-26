const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parse/sync');

const app = express();
const PORT = process.env.PORT || 3001;

// Optional Supabase client (used if env vars provided)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

app.use(cors());
app.use(express.json());

// In-memory quotations store (replace with DB in production)
/**
 * Quotation shape:
 * { id: string, projectName, promoterName, amount, createdAt, createdBy, serviceSummary, etc. }
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

// Existing API endpoints

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// GET /api/quotations with filters and sorting
app.get('/api/quotations', async (req, res) => {
  const { search = '', projectName = '', promoterName = '', sort = 'createdAt', order = 'desc' } = req.query;

  if (supabase) {
    let query = supabase.from('quotations').select('*');
    if (search) {
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

  // Fallback: in-memory filtering
  const searchLc = toLower(search);
  const projectLc = toLower(projectName);
  const promoterLc = toLower(promoterName);
  let results = quotations.filter(q => {
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

// POST /api/quotations to create new quotation
app.post('/api/quotations', async (req, res) => {
  const payload = req.body || {};
  const { developerName, projectName, promoterName, amount } = payload;

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

  // Fallback in-memory create
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

// Update quotation headers/services
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

  // Fallback in-memory
  const idx = quotations.findIndex(q => q.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  quotations[idx] = { ...quotations[idx], headers: payload.headers || null };
  res.json({ data: quotations[idx] });
});

// Load pricing data from CSV
let pricingData = [];

function loadPricingData() {
  try {
    const csvContent = fs.readFileSync('./pricing_data.csv', 'utf-8');
    pricingData = csv.parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    }).map(row => ({
      developerType: row['Developer Type'],
      projectLocation: row['Project location'],
      rating: parseFloat(row['Rating']) || 0,
      plotArea: row['Plot Area'],
      service: row['Service'],
      amount: row['Amount'] === '-' ? 0 : parseInt(row['Amount']) || 0
    }));
    console.log(`Loaded ${pricingData.length} pricing records`);
  } catch (error) {
    console.error('Error loading pricing data:', error);
  }
}

// Initialize pricing data
loadPricingData();

// Helper: find service price
function findServicePrice(developerType, location, plotArea, serviceName) {
  const match = pricingData.find(item =>
    item.developerType === developerType &&
    item.projectLocation === location &&
    item.plotArea === plotArea &&
    item.service.trim() === serviceName.trim()
  );
  return match ? match.amount : null;
}

// Helper: Map plot area to band
function getPlotAreaBand(plotArea) {
  const area = parseInt(plotArea);
  if (area <= 500) return '0-500';
  if (area <= 1000) return '500-1000';
  if (area <= 1500) return '1001-1500';
  if (area <= 2000) return '1501-2000';
  if (area <= 2500) return '2001-2500';
  if (area <= 4000) return '2501-4000';
  if (area <= 6500) return '4001-6500';
  return '6500 and above';
}

// Helper: Map frontend region to pricing location
function mapRegionToLocation(region) {
  const mapping = {
    'Mumbai Suburban': 'Mumbai Suburban',
    'Mumbai City': 'Mumbai City',
    'Thane': 'Mumbai Suburban',
    'Palghar': 'Mumbai Suburban',
    'KDMC': 'Navi Mumbai',
    'Navi Mumbai': 'Navi Mumbai',
    'Raigad': 'Raigad',
    'Pune - City': 'ROM',
    'Pune - PCMC': 'ROM',
    'Pune - PMRDA': 'ROM',
    'Pune - Rural': 'ROM',
    'ROM (Rest of Maharashtra)': 'ROM'
  };
  return mapping[region] || 'ROM';
}

// POST /api/quotations/calculate-pricing with optional discount
app.post('/api/quotations/calculate-pricing', (req, res) => {
  try {
    const {
      developerType,
      projectRegion,
      plotArea,
      headers = [],
      discountAmount = 0,
      discountPercent = 0
    } = req.body;

    if (!developerType || !projectRegion || !plotArea) {
      return res.status(400).json({
        error: 'Missing required fields: developerType, projectRegion, plotArea'
      });
    }

    const location = mapRegionToLocation(projectRegion);
    const plotBand = getPlotAreaBand(plotArea);
    console.log(`Calculating pricing for: ${developerType}, ${location}, ${plotBand}`);

    const breakdown = headers.map(header => {
      const headerServices = header.services.map(service => {
        const basePrice = findServicePrice(developerType, location, plotBand, service.name);
        if (basePrice === null) {
          console.warn(`Price not found for service: ${service.name}`);
        }
        const subServiceCount = service.subServices ? service.subServices.length : 0;
        const subServiceRate = Math.round(basePrice * 0.1);
        const subServiceAmount = subServiceCount * subServiceRate;

        const totalAmount = (basePrice || 0) + subServiceAmount;

        return {
          serviceName: service.name,
          subServices: service.subServices || [],
          subServiceCount,
          baseAmount: basePrice || 0,
          subServiceRate,
          subServiceAmount,
          totalAmount
        };
      });
      return {
        headerName: header.name,
        services: headerServices
      };
    });

    const subtotal = breakdown.reduce((sum, header) =>
      sum + header.services.reduce((headerSum, service) => headerSum + service.totalAmount, 0),
      0);

    // Apply discount if provided
    const discountValue = discountAmount || (subtotal * discountPercent / 100);
    const subtotalAfterDiscount = Math.max(0, subtotal - discountValue);
    const tax = Math.round(subtotalAfterDiscount * 0.18);
    const total = subtotalAfterDiscount + tax;

    res.json({
      breakdown,
      subtotal,
      discount: Math.round(discountValue),
      subtotalAfterDiscount,
      tax,
      total,
      discountPercent: subtotal > 0 ? (discountValue / subtotal) * 100 : 0
    });

  } catch (error) {
    console.error('Pricing calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate pricing' });
  }
});

// GET /api/quotations/:id - get quotation including discount info if any
app.get('/api/quotations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return res.status(404).json({ error: 'Quotation not found' });
      return res.json({ data });
    }

    const quotation = quotations.find(q => q.id === id);
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    res.json({ data: quotation });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    res.status(500).json({ error: 'Failed to fetch quotation' });
  }
});

// PUT /api/quotations/:id/pricing - save pricing + discount data
app.put('/api/quotations/:id/pricing', async (req, res) => {
  const { id } = req.params;
  const {
    pricingBreakdown,
    totalAmount,
    discountAmount = 0,
    discountPercent = 0,
    discountType = 'amount'
  } = req.body;
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('quotations')
        .update({
          pricing_breakdown: pricingBreakdown,
          total_amount: totalAmount,
          amount: totalAmount,
          discount_amount: discountAmount,
          discount_percent: discountPercent,
          discount_type: discountType
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ data });
    }

    const quotationIndex = quotations.findIndex(q => q.id === id);
    if (quotationIndex === -1) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    quotations[quotationIndex] = {
      ...quotations[quotationIndex],
      pricingBreakdown,
      totalAmount,
      amount: totalAmount,
      discountAmount,
      discountPercent,
      discountType
    };

    res.json({ data: quotations[quotationIndex] });
  } catch (error) {
    console.error('Error saving pricing:', error);
    res.status(500).json({ error: 'Failed to save pricing' });
  }
});

// GET /api/pricing/services - get services available for pricing based on filters
app.get('/api/pricing/services', (req, res) => {
  const { developerType, location, plotArea } = req.query;

  if (!developerType || !location || !plotArea) {
    return res.status(400).json({
      error: 'Missing required parameters: developerType, location, plotArea'
    });
  }

  const mappedLocation = mapRegionToLocation(location);
  const plotBand = getPlotAreaBand(parseInt(plotArea));

  const services = pricingData
    .filter(item =>
      item.developerType === developerType &&
      item.projectLocation === mappedLocation &&
      item.plotArea === plotBand
    )
    .map(item => ({
      name: item.service,
      amount: item.amount
    }));

  res.json({ services });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
