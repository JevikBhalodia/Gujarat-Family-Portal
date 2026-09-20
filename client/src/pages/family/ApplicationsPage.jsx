import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../../api/client.js';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import StatusChip from '../../components/common/StatusChip.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/common/States.jsx';
import { formatDate, calculateDaysLeft, formatNumber } from '../../utils/formatters.js';
import { FileText, MessageSquare, AlertCircle } from 'lucide-react';

export function ApplicationsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const currentLang = i18n.language?.startsWith('gu') ? 'gu' : 'en';

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'expired' | 'questions'
  const [activeApps, setActiveApps] = useState([]);
  const [expiredApps, setExpiredApps] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [act, exp, qs] = await Promise.all([
        apiRequest('/applications?status=active'),
        apiRequest('/applications?status=expired'),
        apiRequest('/queries')
      ]);
      setActiveApps(act || []);
      setExpiredApps(exp || []);
      setQuestions(qs || []);
    } catch (err) {
      setError(err.message || 'Failed to load application records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getExpiredReasonText = (reason) => {
    switch (reason) {
      case 'revoked':
        return t('applications.reasonRevoked');
      case 'quota_exhausted':
        return t('applications.reasonBenefitUsed');
      case 'one_time_completed':
        return t('applications.reasonBenefitReceived');
      case 'validity_ended':
      default:
        return t('applications.reasonValidityEnded');
    }
  };

  const getQueryStatusChip = (status) => {
    switch (status) {
      case 'answered':
        return { status: 'qualify', label: t('applications.statusAnswered') };
      case 'escalated':
        return { status: 'checkNeeded', label: t('applications.statusSentToDept') };
      case 'replied':
        return { status: 'active', label: t('applications.statusReplied') };
      default:
        return { status: 'notEligible', label: status };
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">
          {t('applications.title')}
        </h1>
      </div>

      {/* Tabs: Active (n) · Expired (n) · Questions (n) */}
      <div className="flex border-b border-line space-x-6" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'active'}
          onClick={() => setActiveTab('active')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === 'active'
              ? 'text-indigo border-indigo font-bold'
              : 'text-muted border-transparent hover:text-ink'
          }`}
        >
          {t('applications.tabActive')} ({activeApps.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'expired'}
          onClick={() => setActiveTab('expired')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === 'expired'
              ? 'text-indigo border-indigo font-bold'
              : 'text-muted border-transparent hover:text-ink'
          }`}
        >
          {t('applications.tabExpired')} ({expiredApps.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'questions'}
          onClick={() => setActiveTab('questions')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === 'questions'
              ? 'text-indigo border-indigo font-bold'
              : 'text-muted border-transparent hover:text-ink'
          }`}
        >
          {t('applications.tabQuestions')} ({questions.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          {/* Active Applications Tab */}
          {activeTab === 'active' && (
            activeApps.length === 0 ? (
              <EmptyState
                message={t('applications.emptyActive')}
                actionText={t('applications.browseSchemes')}
                onAction={() => navigate('/schemes')}
                icon={FileText}
              />
            ) : (
              <div className="space-y-4">
                {activeApps.map((app) => {
                  const daysLeft = calculateDaysLeft(app.end_date);

                  return (
                    <Card key={app.id} className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h2 className="text-base font-bold text-ink">
                            {app.scheme_name}
                          </h2>
                          <p className="text-xs text-muted">
                            {app.department_name} · Enrolled {formatDate(app.start_date, currentLang)}
                          </p>
                        </div>

                        {daysLeft !== null && (
                          <div className="text-left sm:text-right">
                            <span className="text-xs font-semibold text-indigo bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo/20">
                              {daysLeft === 1
                                ? t('applications.daysLeftSingular')
                                : t('applications.daysLeft', { days: daysLeft })}
                            </span>
                            {app.end_date && (
                              <p className="text-[11px] text-muted mt-1">
                                Until {formatDate(app.end_date, currentLang)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quota Progress Bar if scheme_type === 'quota' */}
                      {app.scheme_type === 'quota' && app.benefit_total && (
                        <div className="pt-2 border-t border-line space-y-1.5">
                          <div className="flex justify-between text-xs font-medium text-ink">
                            <span>
                              {t('applications.quotaUsed', {
                                used: formatNumber(app.benefit_used, currentLang),
                                total: formatNumber(app.benefit_total, currentLang)
                              })}
                            </span>
                            <span>{Math.round(app.benefit_progress || 0)}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-salt border border-line overflow-hidden">
                            <div
                              className="h-full bg-indigo transition-all"
                              style={{ width: `${Math.min(app.benefit_progress || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )
          )}

          {/* Expired Applications Tab */}
          {activeTab === 'expired' && (
            expiredApps.length === 0 ? (
              <EmptyState
                message={t('applications.emptyExpired')}
                icon={FileText}
              />
            ) : (
              <div className="space-y-4">
                {expiredApps.map((app) => {
                  const isRevoked = app.expired_reason === 'revoked';

                  return (
                    <Card key={app.id} className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h2 className="text-base font-bold text-ink">
                              {app.scheme_name}
                            </h2>
                            <StatusChip
                              status={isRevoked ? 'revoked' : 'notEligible'}
                              label={getExpiredReasonText(app.expired_reason)}
                            />
                          </div>
                          <p className="text-xs text-muted mt-0.5">
                            {app.department_name} · Enrolled {formatDate(app.start_date, currentLang)}
                          </p>
                        </div>

                        {app.scheme_type !== 'one_time' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/schemes/${app.scheme_id}`)}
                          >
                            {t('applications.applyAgain')}
                          </Button>
                        )}
                      </div>

                      {/* Cancelled by department: Officer's reason in a madder-tinted block */}
                      {isRevoked && (
                        <div className="p-3 rounded-[8px] bg-[var(--madder-fill)] border border-[#F5BDB8] text-xs text-madder space-y-1">
                          <div className="flex items-center space-x-1.5 font-bold">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{t('applications.revokedByOfficer')}</span>
                          </div>
                          <p className="text-ink/90 pl-5">
                            {app.revoke_reason || 'Administrative revocation under scheme rules.'}
                          </p>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )
          )}

          {/* Questions Tab */}
          {activeTab === 'questions' && (
            questions.length === 0 ? (
              <EmptyState
                message={t('applications.emptyQuestions')}
                icon={MessageSquare}
              />
            ) : (
              <div className="space-y-4">
                {questions.map((q) => {
                  const chip = getQueryStatusChip(q.status);

                  return (
                    <Card key={q.id} className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-line">
                        <div>
                          <span className="text-xs font-semibold text-indigo block">
                            {q.scheme_name}
                          </span>
                          <span className="text-[11px] text-muted">
                            {formatDate(q.created_at, currentLang)}
                          </span>
                        </div>
                        <StatusChip status={chip.status} label={chip.label} />
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-bold text-ink block mb-0.5">Question:</span>
                          <p className="p-2.5 rounded-[8px] bg-salt border border-line text-ink">
                            {q.question}
                          </p>
                        </div>

                        {q.bot_answer && (
                          <div>
                            <span className="font-medium text-muted block mb-0.5">Assistant Answer:</span>
                            <p className="p-2.5 rounded-[8px] bg-indigo-50/50 border border-indigo/10 text-ink">
                              {q.bot_answer}
                            </p>
                          </div>
                        )}

                        {q.admin_reply && (
                          <div className="p-3 rounded-[8px] bg-[#EBF5F0] border border-[#B2D8C3] text-xs text-[#134E31] space-y-1">
                            <span className="font-bold block">{t('applications.officialReply')}</span>
                            <p>{q.admin_reply}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

export default ApplicationsPage;
