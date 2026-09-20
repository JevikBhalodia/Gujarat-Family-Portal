import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';

export function StatusChip({ status, label, className = '' }) {
  let colorClasses = '';
  let Icon = CheckCircle2;

  switch (status) {
    case 'qualify':
    case 'eligible':
    case 'active':
      colorClasses = 'text-green bg-[#EBF5F0] border-[#B2D8C3]';
      Icon = CheckCircle2;
      break;
    case 'checkNeeded':
    case 'maybe':
      colorClasses = 'text-marigold bg-[var(--marigold-fill)] border-[#F5DCAB]';
      Icon = Clock;
      break;
    case 'revoked':
    case 'danger':
    case 'error':
      colorClasses = 'text-madder bg-[var(--madder-fill)] border-[#F5BDB8]';
      Icon = AlertCircle;
      break;
    case 'notEligible':
    case 'not_eligible':
    case 'expired':
    default:
      colorClasses = 'text-muted bg-salt border-line';
      Icon = XCircle;
      break;
  }

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-3 py-0.5 text-xs font-medium rounded-full border ${colorClasses} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export default StatusChip;
