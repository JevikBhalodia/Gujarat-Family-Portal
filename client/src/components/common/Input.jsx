import React from 'react';
import { AlertCircle } from 'lucide-react';

export function Input({
  id,
  label,
  helperText,
  error,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  prefix,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;
  const helperId = inputId ? `${inputId}-helper` : undefined;

  return (
    <div className="w-full flex flex-col space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink flex items-center">
          <span>{label}</span>
          {required && <span className="text-madder ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-3 flex items-center pointer-events-none text-muted text-sm font-medium">
            {prefix}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full min-h-[44px] px-3 py-2 text-base text-ink bg-surface border rounded-[8px] transition-colors focus:outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20 disabled:bg-salt disabled:cursor-not-allowed ${
            prefix ? 'pl-12' : ''
          } ${error ? 'border-madder' : 'border-line'} ${className}`}
          {...props}
        />
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

export default Input;
