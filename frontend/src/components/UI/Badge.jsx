import React from 'react';

export const Spinner = ({ size = 'default', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`inline-block ${sizes[size]} ${className}`}>
      <div className="animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></div>
    </div>
  );
};