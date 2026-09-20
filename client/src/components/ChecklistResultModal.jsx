import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Modal from './common/Modal.jsx';
import Button from './common/Button.jsx';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

export function ChecklistResultModal({ isOpen, onClose, result, schemeName }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!result) return null;

  const checkLabels = {
    permission: 'Applicant Permission & Access',
    identity: 'Identity Verification (Aadhaar / UIDAI)',
    scheme_open: 'Scheme Active & Open Deadline',
    eligibility: 'Family Eligibility Fact Validation',
    documents: 'Mandatory Verified Documents',
    duplicate: 'Duplicate Active Enrollment Check',
    create: 'Government Application Registration'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={result.ok ? t('applyModal.activeTitle') : t('applyModal.title')}
    >
      <div className="space-y-4 text-left" aria-live="polite">
        <p className="text-sm text-ink font-medium">
          {schemeName}
        </p>
        <p className="text-xs text-muted">
          {result.ok ? t('applyModal.activeSubtitle') : t('applyModal.failedSubtitle')}
        </p>

        {/* 7-Step Verification Checks */}
        <div className="space-y-2 py-2">
          {result.checks?.map((check, idx) => {
            const isPassed = check.passed;
            const title = checkLabels[check.name] || check.name;

            return (
              <div
                key={idx}
                className={`p-3 rounded-[8px] border text-xs flex items-start space-x-2.5 transition-colors ${
                  isPassed
                    ? 'bg-[#EBF5F0] border-[#B2D8C3] text-[#134E31]'
                    : 'bg-[var(--madder-fill)] border-[#F5BDB8] text-madder'
                }`}
              >
                {isPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-green shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <XCircle className="w-4 h-4 text-madder shrink-0 mt-0.5" aria-hidden="true" />
                )}

                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between items-center font-medium">
                    <span>{title}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {isPassed ? 'Passed' : 'Failed'}
                    </span>
                  </div>

                  {!isPassed && check.reason && (
                    <p className="text-[11px] text-ink/80 mt-1 flex items-start">
                      <AlertCircle className="w-3 h-3 text-madder shrink-0 mr-1 mt-0.5" />
                      <span>{check.reason}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-line flex justify-end space-x-2">
          {result.ok ? (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                navigate('/applications');
              }}
            >
              <span>{t('applyModal.viewApplications')}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button variant="secondary" onClick={onClose}>
              {t('applyModal.fixAndTryAgain')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default ChecklistResultModal;
