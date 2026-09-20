import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StatusChip from './common/StatusChip.jsx';
import Button from './common/Button.jsx';
import { formatDate } from '../utils/formatters.js';

export function SchemeCard({ scheme }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const currentLang = i18n.language?.startsWith('gu') ? 'gu' : 'en';

  const status = scheme.eligibility?.status || 'eligible';
  const isNotEligible = status === 'not_eligible';
  const isCheckNeeded = status === 'maybe';

  // Support _gu and _en multilingual fields if present, fallback to default
  const title = currentLang === 'gu' && scheme.name_gu ? scheme.name_gu : scheme.name;
  const description = currentLang === 'gu' && scheme.description_gu ? scheme.description_gu : scheme.description;
  const departmentName = scheme.department_name || '';

  const getStatusDetails = () => {
    if (status === 'eligible') {
      return { status: 'qualify', label: t('schemes.qualify') };
    }
    if (isCheckNeeded) {
      return { status: 'checkNeeded', label: t('schemes.checkNeeded') };
    }
    return { status: 'notEligible', label: t('schemes.notEligible') };
  };

  const statusDetails = getStatusDetails();

  // First failed rule if not eligible
  const firstFailedRule = isNotEligible && scheme.eligibility?.failed?.[0]?.message;

  return (
    <div
      className={`bg-surface border border-line rounded-[12px] p-5 text-left transition-colors ${
        isNotEligible ? 'opacity-70 bg-salt/50' : 'hover:border-indigo/40'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-3 flex-wrap gap-y-1">
          <h2 className="text-base font-bold text-ink hover:text-indigo transition-colors cursor-pointer" onClick={() => navigate(`/schemes/${scheme.id}`)}>
            {title}
          </h2>
          <StatusChip status={statusDetails.status} label={statusDetails.label} />
        </div>

        {scheme.deadline && (
          <span className="text-xs text-muted whitespace-nowrap">
            {t('schemes.applyBy', { date: formatDate(scheme.deadline, currentLang) })}
          </span>
        )}
      </div>

      <p className="text-xs text-muted mb-2">
        {scheme.category} · {departmentName}
      </p>

      <p className="text-sm text-ink line-clamp-2 mb-3 leading-relaxed">
        {description}
      </p>

      {/* Marigold hint for check needed */}
      {isCheckNeeded && (
        <p className="text-xs font-medium text-marigold mb-3">
          {t('schemes.addIncomeToCheck')}
        </p>
      )}

      {/* Greyed out failed rule hint for not eligible */}
      {isNotEligible && firstFailedRule && (
        <p className="text-xs font-medium text-madder mb-3">
          {t('schemes.failedReason', { reason: firstFailedRule })}
        </p>
      )}

      <div className="flex justify-end pt-2 border-t border-line/60">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/schemes/${scheme.id}`)}
        >
          {t('schemes.viewDetails')}
        </Button>
      </div>
    </div>
  );
}

export default SchemeCard;
