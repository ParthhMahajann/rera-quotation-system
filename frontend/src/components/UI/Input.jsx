import React from 'react';
import { cn } from '../utils/cn';

const Input = React.forwardRef(({ 
  className, 
  type = 'text',
  error,
  label,
  placeholder,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          'w-full px-4 py-3 border rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
            : 'border-slate-200',
          className
        )}
        ref={ref}
        placeholder={placeholder}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };