import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import StatusChip from '../../components/common/StatusChip.jsx';
import { Skeleton, EmptyState, ErrorState } from '../../components/common/States.jsx';
import { formatDate } from '../../utils/formatters.js';
import { Send, ArrowLeft, MessageSquare } from 'lucide-react';

export function AdminQueries() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const currentLang = i18n.language?.startsWith('gu') ? 'gu' : 'en';

  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('open'); // 'open' | 'replied'

  // Selected query for viewing thread
  const [selectedQueryId, setSelectedQueryId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchQueries = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/admin/queries');
      setQueries(data || []);
      // Select first query on desktop if none selected
      if (data && data.length > 0 && !selectedQueryId) {
        setSelectedQueryId(data[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load queries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleSendReply = async () => {
    if (!selectedQueryId || !replyText.trim()) return;
    setSending(true);
    try {
      await apiRequest(`/admin/queries/${selectedQueryId}/reply`, {
        method: 'POST',
        body: { reply: replyText.trim() }
      });
      showToast(t('toast.replySent'));
      setReplyText('');
      await fetchQueries();
    } catch (err) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const filteredQueries = queries.filter((q) => {
    if (filter === 'open') return !q.admin_reply;
    return Boolean(q.admin_reply);
  });

  const selectedQuery = queries.find((q) => q.id === selectedQueryId);

  return (
    <div className="space-y-6 text-left">
      <h1 className="text-2xl font-bold text-ink">
        {t('admin.queriesTitle')}
      </h1>

      {/* Filter Tabs: Open / Replied */}
      <div className="flex border-b border-line space-x-6">
        <button
          type="button"
          onClick={() => {
            setFilter('open');
            setSelectedQueryId(null);
          }}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            filter === 'open'
              ? 'text-indigo border-indigo font-bold'
              : 'text-muted border-transparent hover:text-ink'
          }`}
        >
          {t('admin.filterOpen')} ({queries.filter((q) => !q.admin_reply).length})
        </button>

        <button
          type="button"
          onClick={() => {
            setFilter('replied');
            setSelectedQueryId(null);
          }}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            filter === 'replied'
              ? 'text-indigo border-indigo font-bold'
              : 'text-muted border-transparent hover:text-ink'
          }`}
        >
          {t('admin.filterReplied')} ({queries.filter((q) => Boolean(q.admin_reply)).length})
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 md:col-span-2 w-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchQueries} />
      ) : (
        /* Two Panes Layout: List on left, Thread on right */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left Pane: List */}
          <div
            className={`space-y-2.5 ${
              selectedQueryId ? 'hidden md:block' : 'block'
            }`}
          >
            {filteredQueries.length === 0 ? (
              <EmptyState message={t('admin.noQueries')} icon={MessageSquare} />
            ) : (
              filteredQueries.map((q) => {
                const isSelected = q.id === selectedQueryId;

                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQueryId(q.id)}
                    className={`p-3.5 rounded-[8px] border transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo'
                        : 'bg-surface border-line hover:bg-salt'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-xs text-indigo">
                        {q.scheme_name}
                      </span>
                      <span className="text-[10px] text-muted">
                        {formatDate(q.created_at, currentLang)}
                      </span>
                    </div>

                    <p className="text-xs text-ink line-clamp-2 font-medium">
                      "{q.question}"
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 text-[11px] text-muted">
                      <span>Family: {q.family_code}</span>
                      <span>{q.member_name}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Pane: Thread + Reply Box */}
          <div
            className={`md:col-span-2 ${
              selectedQueryId ? 'block' : 'hidden md:block'
            }`}
          >
            {selectedQuery ? (
              <Card className="space-y-4">
                {/* Mobile Back to List Button */}
                <button
                  type="button"
                  onClick={() => setSelectedQueryId(null)}
                  className="md:hidden inline-flex items-center text-xs font-medium text-muted hover:text-ink cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  <span>Back to inquiries</span>
                </button>

                {/* Thread Header */}
                <div className="pb-3 border-b border-line flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold text-ink">{selectedQuery.scheme_name}</h2>
                    <p className="text-xs text-muted">
                      Family {selectedQuery.family_code} · {selectedQuery.member_name}
                    </p>
                  </div>
                  <span className="text-xs text-muted">
                    {formatDate(selectedQuery.created_at, currentLang)}
                  </span>
                </div>

                {/* Citizen Question */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-ink">{t('admin.familyQuestion')}:</span>
                  <p className="p-3 rounded-[8px] bg-salt border border-line text-sm text-ink leading-relaxed">
                    "{selectedQuery.question}"
                  </p>
                </div>

                {/* Assistant Answer if available */}
                {selectedQuery.bot_answer && (
                  <div className="space-y-1.5 text-xs">
                    <span className="font-medium text-muted">{t('admin.assistantAnswer')}:</span>
                    <p className="p-3 rounded-[8px] bg-indigo-50/40 border border-indigo/15 text-xs text-ink/90">
                      {selectedQuery.bot_answer}
                    </p>
                  </div>
                )}

                {/* Officer Reply */}
                {selectedQuery.admin_reply ? (
                  <div className="p-3 rounded-[8px] bg-[#EBF5F0] border border-[#B2D8C3] text-xs text-[#134E31] space-y-1">
                    <span className="font-bold">{t('admin.officerReply')}:</span>
                    <p className="text-sm">{selectedQuery.admin_reply}</p>
                  </div>
                ) : (
                  /* Reply composer */
                  <div className="space-y-2 pt-2 border-t border-line">
                    <label className="text-xs font-bold text-ink">
                      Official Department Guidance:
                    </label>
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={t('admin.replyPlaceholder')}
                      className="w-full p-3 text-sm text-ink bg-surface border border-line rounded-[8px] focus:outline-none focus:border-indigo"
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="primary"
                        loading={sending}
                        disabled={!replyText.trim()}
                        onClick={handleSendReply}
                      >
                        <Send className="w-4 h-4 mr-1.5" />
                        <span>{t('admin.sendReply')}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <div className="hidden md:flex h-64 border border-dashed border-line rounded-[12px] items-center justify-center text-xs text-muted">
                Select an inquiry from the list to view thread details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminQueries;
