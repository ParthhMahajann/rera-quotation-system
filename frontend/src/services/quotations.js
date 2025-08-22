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

export async function updateQuotation(id, payload) {
	const response = await api.put(`/quotations/${encodeURIComponent(id)}` , payload);
	return response.data?.data;
}


