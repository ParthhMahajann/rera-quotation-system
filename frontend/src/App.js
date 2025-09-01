import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import CreateQuotation from './pages/CreateQuotation';
import CreateAgentQuotation from './pages/CreateAgentQuotation';
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
        {/*
          If a token exists, the user is authenticated, so they are redirected to the dashboard.
          Otherwise, they are taken to the login page.
        */}
        <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
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
        <Route
          path="/quotations/new/agent"
          element={
            <ProtectedRoute>
              <CreateAgentQuotation />
            </ProtectedRoute>
          }
        />
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

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;