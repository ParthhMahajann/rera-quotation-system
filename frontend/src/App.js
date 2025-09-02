import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import CreateQuotation from './pages/CreateQuotation';
import CreateAgentQuotation from './pages/CreateAgentQuotation';
// ✅ FIXED: Import from pages folder instead of components
import AgentServiceSummary from './pages/AgentServiceSummary';
import QuotationServices from './pages/QuotationServices';
import QuotationPricing from './components/QuotationPricing';
import QuotationTerms from './components/QuotationTerms';
import QuotationSummary from './components/QuotationSummary';

function App() {
  const token = localStorage.getItem('token');
  
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Root route - redirect based on auth status */}
        <Route 
          path="/" 
          element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
        />

        {/* Public routes (accessible without authentication) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes - require authentication */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Quotations routes */}
        <Route
          path="/quotations"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/quotations/new"
          element={
            <ProtectedRoute>
              <CreateQuotation />
            </ProtectedRoute>
          }
        />
        
        {/* Agent registration routes */}
        <Route
          path="/quotations/new/agent"
          element={
            <ProtectedRoute>
              <CreateAgentQuotation />
            </ProtectedRoute>
          }
        />
        
        {/* ✅ FIXED: Route for agent summary page */}
        <Route
          path="/agent-summary"
          element={
            <ProtectedRoute>
              <AgentServiceSummary />
            </ProtectedRoute>
          }
        />

        {/* Regular quotation workflow routes */}
        <Route
          path="/quotations/:id/services"
          element={
            <ProtectedRoute>
              <QuotationServices />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/quotations/:id/pricing"
          element={
            <ProtectedRoute>
              <QuotationPricing />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/quotations/:id/terms"
          element={
            <ProtectedRoute>
              <QuotationTerms />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/quotations/:id/summary"
          element={
            <ProtectedRoute>
              <QuotationSummary />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route - redirect based on auth status */}
        <Route 
          path="*" 
          element={<Navigate to={token ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
