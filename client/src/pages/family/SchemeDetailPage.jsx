import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../api/client.js';
import StatusChip from '../../components/common/StatusChip.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ChatPanel from '../../components/ChatPanel.jsx';
import ChecklistResultModal from '../../components/ChecklistResultModal.jsx';
import { ErrorState, Skeleton } from '../../components/common/States.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, MessageSquare, ArrowLeft, Upload } from 'lucide-react';

export function SchemeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, member, canApply } = useAuth();
  const { showToast } = useToast();

  const currentLang = i18n.language?.startsWith('gu') ? 'gu' : 'en';

  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Accordion state for FAQs
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Chat panel state
  const [chatOpen, setChatOpen] = useState(false);

  // Apply result modal state
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState(null);

  const fetchScheme = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest(`/schemes/${id}`);
      setScheme(data);
    } catch (err) {
      setError(err.message || 'Failed to load scheme details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheme();
  }, [id]);

  const handleApply = async () => {
    if (!canApply) return;
    setApplying(true);
    try {
      const res = await apiRequest(`/schemes/${id}/apply`, { method: 'POST' });
      setApplyResult({
        ok: true,
        message: res.message,
        checks: res.checks
      });
      showToast(t('toast.applicationSubmitted'));
    } catch (err) {
      setApplyResult({
        ok: false,
        message: err.message || 'Application verification failed.',
        checks: err.data?.checks || []
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1120px] mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="max-w-md mx-auto py-12">
        <ErrorState message={error} onRetry={fetchScheme} />
      </div>
    );
  }

  const title = currentLang === 'gu' && scheme.name_gu ? scheme.name_gu : scheme.name;
  const description = currentLang === 'gu' && scheme.description_gu ? scheme.description_gu : scheme.description;
  const status = scheme.eligibility?.status || 'eligible';

  const statusLabel =
    status === 'eligible'
      ? t('schemes.qualify')
      : status === 'maybe'
      ? t('schemes.checkNeeded')
      : t('schemes.notEligible');

  const chipStatus = status === 'eligible' ? 'qualify' : status === 'maybe' ? 'checkNeeded' : 'notEligible';

  // Parse rules and faqs
  const rules = Array.isArray(scheme.rules_json) ? scheme.rules_json : [];
  const faqs = Array.isArray(scheme.faq_json) ? scheme.faq_json : [];
  const requiredDocs = Array.isArray(scheme.required_docs_json) ? scheme.required_docs_json : [];

  return (
    <div className="space-y-6 text-left pb-24 md:pb-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/schemes')}
        className="inline-flex items-center text-xs font-medium text-muted hover:text-ink transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        <span>Back to schemes</span>
      </button>

      {/* Header: Title · department · eligibility chip */}
      <div className="space-y-2 pb-4 border-b border-line">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          <StatusChip status={chipStatus} label={statusLabel} />
        </div>
        <p className="text-xs text-muted">
          {scheme.category} · {scheme.department_name}
        </p>
      </div>

      {/* 2/3 Content Pane + 1/3 Sticky Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Pane (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <Card>
            <h2 className="text-base font-bold text-ink mb-2">
              {t('schemes.about')}
            </h2>
            <p className="text-sm text-ink/90 leading-relaxed">
              {description}
            </p>
          </Card>

          {/* Who can apply: live pass/fail rules for this family */}
          <Card>
            <h2 className="text-base font-bold text-ink mb-3">
              {t('schemes.whoCanApply')}
            </h2>
            <div className="space-y-2">
              {rules.length === 0 ? (
                <p className="text-xs text-muted">No specific rules specified.</p>
              ) : (
                rules.map((rule, idx) => {
                  // Rule evaluation check
                  const isFailed = scheme.eligibility?.failed?.some((f) => f.rule === rule.name || f.message?.includes(rule.description));
                  const isPass = !isFailed && status !== 'not_eligible';

                  return (
                    <div
                      key={idx}
                      className="flex items-start space-x-2.5 text-sm py-1"
                    >
                      {isPass ? (
                        <CheckCircle2 className="w-5 h-5 text-green shrink-0 mt-0.5" aria-hidden="true" />
                      ) : (
                        <XCircle className="w-5 h-5 text-madder shrink-0 mt-0.5" aria-hidden="true" />
                      )}
                      <span className={isPass ? 'text-ink' : 'text-muted'}>
                        {rule.description || rule.name}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Documents you need: live pass/fail documents for this family */}
          <Card>
            <h2 className="text-base font-bold text-ink mb-3">
              {t('schemes.docsNeeded')}
            </h2>
            <div className="space-y-2.5">
              {requiredDocs.length === 0 ? (
                <p className="text-xs text-muted">No document uploads required.</p>
              ) : (
                requiredDocs.map((docType, idx) => {
                  const docMatch = scheme.docStatus?.find((d) => d.type?.toLowerCase() === docType?.toLowerCase());
                  const isPresent = docMatch?.present;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-[8px] bg-salt border border-line text-sm"
                    >
                      <div className="flex items-center space-x-2.5">
                        {isPresent ? (
                          <CheckCircle2 className="w-4 h-4 text-green shrink-0" aria-hidden="true" />
                        ) : (
                          <XCircle className="w-4 h-4 text-madder shrink-0" aria-hidden="true" />
                        )}
                        <span className="font-medium capitalize text-ink">
                          {docType.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {isPresent ? (
                        <span className="text-xs text-green font-medium">
                          {t('schemes.verifiedInLocker')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate('/profile')}
                          className="inline-flex items-center space-x-1 text-xs font-medium text-indigo hover:underline cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{t('schemes.uploadDoc')}</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Common questions (Accordion) */}
          {faqs.length > 0 && (
            <Card>
              <h2 className="text-base font-bold text-ink mb-3">
                {t('schemes.faq')}
              </h2>
              <div className="divide-y divide-line">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  const q = currentLang === 'gu' && faq.q_gu ? faq.q_gu : faq.q;
                  const a = currentLang === 'gu' && faq.a_gu ? faq.a_gu : faq.a;

                  return (
                    <div key={idx} className="py-3">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full flex justify-between items-center text-left text-sm font-medium text-ink hover:text-indigo transition-colors cursor-pointer"
                        aria-expanded={isOpen}
                      >
                        <span>{q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-muted shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted shrink-0 ml-2" />
                        )}
                      </button>
                      {isOpen && (
                        <p className="mt-2 text-xs text-muted leading-relaxed pr-6">
                          {a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right Sticky Sidebar (1/3) on desktop ≥1024px */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24 space-y-4">
          <Card className="space-y-4">
            {scheme.benefit_total && (
              <div className="pb-3 border-b border-line">
                <span className="text-xs text-muted block mb-0.5">{t('schemes.benefit')}</span>
                <span className="text-xl font-bold text-ink">
                  {formatCurrency(scheme.benefit_total, currentLang)}
                </span>
              </div>
            )}

            {scheme.validity_months && (
              <div className="pb-3 border-b border-line">
                <span className="text-xs text-muted block mb-0.5">Validity</span>
                <span className="text-sm font-medium text-ink">
                  {t('schemes.validity', { months: scheme.validity_months })}
                </span>
              </div>
            )}

            {scheme.deadline && (
              <div className="pb-3 border-b border-line">
                <span className="text-xs text-muted block mb-0.5">Deadline</span>
                <span className="text-sm font-medium text-ink">
                  {t('schemes.applyBy', { date: formatDate(scheme.deadline, currentLang) })}
                </span>
              </div>
            )}

            {/* Apply Button */}
            <div>
              <Button
                variant="primary"
                className="w-full"
                loading={applying}
                disabled={!canApply || status === 'not_eligible'}
                onClick={handleApply}
              >
                {t('schemes.applyForScheme')}
              </Button>

              {!canApply && (
                <p className="text-[11px] text-muted mt-1.5 text-center">
                  {t('schemes.viewOnlyNotice')}
                </p>
              )}
            </div>

            {/* Ask about this scheme button */}
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setChatOpen(true)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              <span>{t('schemes.askAboutScheme')}</span>
            </Button>
          </Card>
        </div>
      </div>

      {/* Mobile Fixed Bottom Apply Bar (<1024px) */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 p-3 bg-surface border-t border-line z-30 flex items-center justify-between gap-3 shadow-md">
        <div>
          {scheme.benefit_total && (
            <span className="text-sm font-bold text-ink block">
              {formatCurrency(scheme.benefit_total, currentLang)}
            </span>
          )}
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="text-xs text-indigo font-medium hover:underline flex items-center"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1" />
            <span>Ask question</span>
          </button>
        </div>

        <Button
          variant="primary"
          size="sm"
          loading={applying}
          disabled={!canApply || status === 'not_eligible'}
          onClick={handleApply}
        >
          {t('schemes.applyForScheme')}
        </Button>
      </div>

      {/* Chat Side Panel */}
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        schemeId={scheme.id}
        schemeName={title}
        departmentName={scheme.department_name}
      />

      {/* 7-Step Apply Checklist Feedback Modal */}
      <ChecklistResultModal
        isOpen={Boolean(applyResult)}
        onClose={() => setApplyResult(null)}
        result={applyResult}
        schemeName={title}
      />
    </div>
  );
}

export default SchemeDetailPage;
