import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-surface border border-line rounded-[12px] p-5 text-ink transition-colors ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
