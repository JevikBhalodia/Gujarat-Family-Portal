import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

export function StatusBadge({ status, reason, size = 'sm' }) {
  const { t } = useLanguage();

  let badgeClass = 'badge-active';
  let label = status;

  switch (status) {
    case 'eligible':
      badgeClass = 'badge-eligible';
      label = t('eligible');
      break;
    case 'maybe':
      badgeClass = 'badge-maybe';
      label = t('maybe');
      break;
    case 'not_eligible':
      badgeClass = 'badge-not-eligible';
      label = t('notEligible');
      break;
    case 'active':
      badgeClass = 'badge-active';
      label = t('activeApplications');
      break;
    case 'expired':
      if (reason === 'revoked') {
        badgeClass = 'badge-revoked';
        label = t('revoked');
      } else {
        badgeClass = 'badge-expired';
        label = reason ? reason.replace('_', ' ') : 'Expired';
      }
      break;
    case 'revoked':
      badgeClass = 'badge-revoked';
      label = t('revoked');
      break;
    default:
      badgeClass = 'badge-expired';
      label = status;
  }

  const paddingClass = size === 'lg' ? 'px-3 py-1 text-sm font-semibold' : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span className={`inline-flex items-center rounded-full capitalize ${paddingClass} ${badgeClass}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </span>
  );
}

export default StatusBadge;
