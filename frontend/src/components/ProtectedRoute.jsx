import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // If user is not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }
  
  // Otherwise render children components
  return children;
}

export default ProtectedRoute;
