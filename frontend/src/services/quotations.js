import axios from 'axios';

const api = axios.create({ 
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function fetchQuotations(params = {}) {
  const response = await api.get('/quotations', { params });
  return response.data?.data || [];
}

export async function createQuotation(payload) {
  const response = await api.post('/quotations', payload);
  return response.data?.data;
}

// ✅ FIXED: Added authentication token
export async function updateQuotation(id, data) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/quotations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ✅ Added token
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update quotation');
  }
  
  return response.json();
}
