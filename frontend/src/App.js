import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import CreateQuotation from './pages/CreateQuotation';
import CreateAgentQuotation from './pages/CreateAgentQuotation';
import QuotationServices from './pages/QuotationServices';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/quotations/new" element={<CreateQuotation />} />
        <Route path="/quotations/new/agent" element={<CreateAgentQuotation />} />
        <Route path="/quotations/:id/services" element={<QuotationServices />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;