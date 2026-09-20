import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Modal from '../../components/common/Modal.jsx';
import StatusChip from '../../components/common/StatusChip.jsx';
import { formatDate } from '../../utils/formatters.js';
import { Search, ShieldAlert, Eye } from 'lucide-react';

export function AdminLookup() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const currentLang = i18n.language?.startsWith('gu') ? 'gu' : 'en';

  const [familyCode, setFamilyCode] = useState('GJ-AHM-00101');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'past'

  // Revocation Modal State
  const [revokeAppId, setRevokeAppId] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!familyCode.trim()) return;

    setLoading(true);
    setError('');
    try {
      const data = await apiRequest(`/admin/families/${encodeURIComponent(familyCode.trim().toUpperCase())}/applications`);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Family not found.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeAppId || revokeReason.trim().length < 10) return;

    setRevoking(true);
    try {
      await apiRequest(`/admin/applications/${revokeAppId}/revoke`, {
        method: 'POST',
        body: { reason: revokeReason.trim() }
      });

      showToast(t('toast.schemeRevoked'));
      setRevokeAppId(null);
      setRevokeReason('');

      // Refresh family search to reflect updated status
      const data = await apiRequest(`/admin/families/${encodeURIComponent(familyCode.trim().toUpperCase())}/applications`);
      setResult(data);
    } catch (err) {
      alert(err.message || 'Failed to revoke application');
    } finally {
      setRevoking(false);
    }
  };

  const headMember = result?.members?.find((m) => m.family_role === 'head');
  const applications = result?.applications || [];
  const activeApps = applications.filter((a) => a.status === 'active');
  const pastApps = applications.filter((a) => a.status !== 'active');
  const displayedApps = activeTab === 'active' ? activeApps : pastApps;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-ink">
          {t('admin.lookupTitle')}
        </h1>
        {/* Muted audit recording notice */}
        <span className="text-xs text-muted flex items-center">
          <Eye className="w-3.5 h-3.5 mr-1 text-muted" />
          {t('admin.recordedNotice')}
        </span>
      </div>

      {/* Search Input Bar */}
      <Card>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1">
            <Input
              id="family-search"
              type="text"
              value={familyCode}
              onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
              placeholder={t('admin.enterFamilyCode')}
              prefix={<Search className="w-4 h-4 text-muted" />}
            />
          </div>
          <Button type="submit" variant="primary" loading={loading}>
            {t('admin.search')}
          </Button>
        </form>
      </Card>

      {error && (
        <Card className="border-madder bg-[var(--madder-fill)] text-madder text-sm">
          {error}
        </Card>
      )}

      {/* Family Result Details */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card: head name, district, mobile masked */}
          <Card className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line">
              <div>
                <span className="text-xs text-muted block font-medium">Family Code</span>
                <span className="text-xl font-bold font-mono text-ink">
                  {result.family?.family_code}
                </span>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-muted block">{t('admin.headName')}</span>
                <span className="text-sm font-semibold text-ink">
                  {headMember?.name || '—'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-ink">
              <div>
                <span className="text-muted block">District:</span>
                <span className="font-medium">{result.family?.district}</span>
              </div>
              <div>
                <span className="text-muted block">Registered Members:</span>
                <span className="font-medium">{result.members?.length || 0}</span>
              </div>
              <div>
                <span className="text-muted block">Contact:</span>
                <span className="font-mono text-muted">••••••{result.user?.mobile ? result.user.mobile.slice(-4) : '••••'}</span>
              </div>
            </div>
          </Card>

          {/* Applications: Tabs Active / Past */}
          <Card className="space-y-4">
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
                {t('admin.tabActive')} ({activeApps.length})
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'past'}
                onClick={() => setActiveTab('past')}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
                  activeTab === 'past'
                    ? 'text-indigo border-indigo font-bold'
                    : 'text-muted border-transparent hover:text-ink'
                }`}
              >
                {t('admin.tabPast')} ({pastApps.length})
              </button>
            </div>

            {displayedApps.length === 0 ? (
              <p className="text-xs text-muted py-6 text-center">
                No {activeTab} applications found for this family.
              </p>
            ) : (
              <div className="divide-y divide-line">
                {displayedApps.map((app) => (
                  <div
                    key={app.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-ink">{app.scheme_name}</span>
                        <StatusChip
                          status={app.status === 'active' ? 'active' : 'notEligible'}
                          label={app.status}
                        />
                      </div>
                      <p className="text-xs text-muted">
                        Applied: {formatDate(app.start_date, currentLang)} · Valid until:{' '}
                        {app.end_date ? formatDate(app.end_date, currentLang) : 'Open'}
                      </p>
                      {app.revoke_reason && (
                        <p className="text-xs text-madder">
                          Revocation reason: {app.revoke_reason}
                        </p>
                      )}
                    </div>

                    {app.status === 'active' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setRevokeAppId(app.id)}
                      >
                        {t('admin.revoke')}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Mandatory Revocation Modal (min 10 chars required) */}
      <Modal
        isOpen={Boolean(revokeAppId)}
        onClose={() => {
          setRevokeAppId(null);
          setRevokeReason('');
        }}
        title={t('admin.revokeModalTitle')}
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-muted p-2.5 rounded-[8px] bg-[var(--madder-fill)] border border-[#F5BDB8] text-madder font-medium">
            {t('admin.revokeDisclaimer')}
          </p>

          <div className="space-y-1">
            <label className="text-sm font-medium text-ink">
              {t('admin.revokeReasonLabel')} *
            </label>
            <textarea
              rows={3}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder={t('admin.revokeReasonPlaceholder')}
              className="w-full p-3 text-sm text-ink bg-surface border border-line rounded-[8px] focus:outline-none focus:border-indigo"
            />
            <span className="text-[11px] text-muted block text-right">
              {revokeReason.trim().length} / 10 characters minimum
            </span>
          </div>

          <div className="pt-3 border-t border-line flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => {
                setRevokeAppId(null);
                setRevokeReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={revokeReason.trim().length < 10}
              loading={revoking}
              onClick={handleConfirmRevoke}
            >
              {t('admin.confirmRevoke')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminLookup;
