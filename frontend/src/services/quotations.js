import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export async function fetchQuotations(params = {}) {
  const response = await api.get('/quotations', { params });
  return response.data?.data || [];
}

export async function createQuotation(payload) {
  const response = await api.post('/quotations', payload);
  return response.data?.data;
}


export async function updateQuotation(id, data) {
  const response = await fetch(`/api/quotations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update quotation');
  }
  return response.json();
}

