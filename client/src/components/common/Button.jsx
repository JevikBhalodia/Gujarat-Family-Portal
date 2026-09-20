import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'text'
  size = 'md', // 'md' (min-h-[44px]) | 'sm' (min-h-[36px])
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-[8px] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--indigo)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeClasses = size === 'sm' ? 'min-h-[36px] px-3 py-1.5 text-sm' : 'min-h-[44px] px-4 py-2 text-base';

  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses = 'bg-indigo text-white hover:opacity-95 active:opacity-90';
      break;
    case 'secondary':
      variantClasses = 'bg-surface text-indigo border border-line hover:bg-indigo-50 active:bg-indigo-50/80';
      break;
    case 'danger':
      variantClasses = 'bg-madder text-white hover:opacity-95 active:opacity-90';
      break;
    case 'text':
      variantClasses = 'bg-transparent text-indigo hover:bg-indigo-50 active:bg-indigo-50/80';
      break;
    default:
      variantClasses = 'bg-indigo text-white';
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

export default Button;
