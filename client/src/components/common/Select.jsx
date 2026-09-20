import React from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

export function Select({
  id,
  label,
  helperText,
  error,
  value,
  onChange,
  children,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errorId = selectId ? `${selectId}-error` : undefined;
  const helperId = selectId ? `${selectId}-helper` : undefined;

  return (
    <div className="w-full flex flex-col space-y-1.5 text-left">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink flex items-center">
          <span>{label}</span>
          {required && <span className="text-madder ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full min-h-[44px] pl-3 pr-10 py-2 text-base text-ink bg-surface border rounded-[8px] appearance-none transition-colors focus:outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20 disabled:bg-salt disabled:cursor-not-allowed ${
            error ? 'border-madder' : 'border-line'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="w-5 h-5 text-muted absolute right-3 pointer-events-none" />
      </div>

      {helperText && !error && (
        <p id={helperId} className="text-xs text-muted">
          {helperText}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-xs text-madder flex items-center space-x-1" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mr-1" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export default Select;
