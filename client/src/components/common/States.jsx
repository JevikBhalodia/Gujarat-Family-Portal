import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';

export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-line/50 rounded-[8px] ${className}`}
      aria-hidden="true"
    />
  );
}

export function SchemeSkeleton() {
  return (
    <div className="bg-surface border border-line rounded-[12px] p-5 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-full" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}

export function EmptyState({ message, actionText, onAction, icon: Icon = Inbox }) {
  return (
    <div className="bg-surface border border-line rounded-[12px] p-10 text-center flex flex-col items-center justify-center space-y-3">
      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo">
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <p className="text-sm text-ink max-w-sm">{message}</p>
      {actionText && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-surface border border-line rounded-[12px] p-8 text-center flex flex-col items-center justify-center space-y-3">
      <div className="w-10 h-10 rounded-full bg-[var(--madder-fill)] flex items-center justify-center text-madder">
        <AlertCircle className="w-5 h-5" aria-hidden="true" />
      </div>
      <p className="text-sm text-ink max-w-md">
        {message || "We couldn't load schemes. Check your connection and try again."}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
