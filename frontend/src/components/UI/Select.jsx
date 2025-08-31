import React from 'react';
import { cn } from '../utils/cn';

const Select = React.forwardRef(({ 
  className, 
  children,
  error,
  label,
  placeholder = 'Select option...',
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      <select
        className={cn(
          'w-full px-4 py-3 border rounded-lg bg-slate-50 text-slate-900',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
            : 'border-slate-200',
          className
        )}
        ref={ref}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {children}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export { Select };