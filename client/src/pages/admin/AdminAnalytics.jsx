import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../../api/client.js';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import { Skeleton, ErrorState } from '../../components/common/States.jsx';
import { Table, BarChart2 } from 'lucide-react';

export function AdminAnalytics() {
  const { t } = useTranslation();

  const [schemesBreakdown, setSchemesBreakdown] = useState([]);
  const [districtData, setDistrictData] = useState([]);
  const [failedChecks, setFailedChecks] = useState([]);
  const [awarenessGap, setAwarenessGap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // "View as table" accessibility toggles for each of the 4 cards
  const [tableMode1, setTableMode1] = useState(false);
  const [tableMode2, setTableMode2] = useState(false);
  const [tableMode3, setTableMode3] = useState(false);

  // Filters
  const [filterScheme, setFilterScheme] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const [dist, fails, gap, scBreak] = await Promise.all([
        apiRequest('/admin/analytics/by-district'),
        apiRequest('/admin/analytics/failed-checks'),
        apiRequest('/admin/analytics/awareness-gap'),
        apiRequest('/admin/analytics/schemes-breakdown')
      ]);
      setDistrictData(dist || []);
      setFailedChecks(fails || []);
      setAwarenessGap(gap || []);
      setSchemesBreakdown(scBreak || []);
    } catch (err) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchAnalytics} />;
  }

  return (
    <div className="space-y-6 text-left">
      <h1 className="text-2xl font-bold text-ink">
        {t('admin.analyticsTitle')}
      </h1>

      {/* Top Filter Bar (Sticky) */}
      <div className="sticky top-16 z-30 bg-surface border border-line rounded-[12px] p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <label htmlFor="filter-scheme" className="text-xs font-medium text-muted">
            {t('admin.filterScheme')}:
          </label>
          <select
            id="filter-scheme"
            value={filterScheme}
            onChange={(e) => setFilterScheme(e.target.value)}
            className="h-[36px] px-2.5 rounded-[8px] bg-surface border border-line text-xs font-medium text-ink"
          >
            <option value="all">{t('admin.filterAll')}</option>
            {schemesBreakdown.map((s) => (
              <option key={s.schemeId} value={s.schemeId}>
                {s.schemeName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label htmlFor="filter-district" className="text-xs font-medium text-muted">
            {t('admin.filterDistrict')}:
          </label>
          <select
            id="filter-district"
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="h-[36px] px-2.5 rounded-[8px] bg-surface border border-line text-xs font-medium text-ink"
          >
            <option value="all">{t('admin.filterAll')}</option>
            {districtData.map((d) => (
              <option key={d.district} value={d.district}>
                {d.district}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Primary Visual Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* 1. Stacked Bar: Active vs Expired vs Revoked per Scheme */}
        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-line">
            <div>
              <h2 className="text-sm font-bold text-ink">
                {t('admin.chart1Title')}
              </h2>
              <p className="text-xs text-muted">
                What proportion of enrolled families remain actively supported?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTableMode1(!tableMode1)}
              className="inline-flex items-center text-xs font-medium text-indigo hover:underline cursor-pointer shrink-0"
            >
              {tableMode1 ? (
                <>
                  <BarChart2 className="w-3.5 h-3.5 mr-1" />
                  <span>{t('admin.viewAsChart')}</span>
                </>
              ) : (
                <>
                  <Table className="w-3.5 h-3.5 mr-1" />
                  <span>{t('admin.viewAsTable')}</span>
                </>
              )}
            </button>
          </div>

          {tableMode1 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="pb-2 font-medium">Scheme</th>
                    <th className="pb-2 font-medium">Active</th>
                    <th className="pb-2 font-medium">Expired</th>
                    <th className="pb-2 font-medium">Revoked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {schemesBreakdown.map((s) => (
                    <tr key={s.schemeId}>
                      <td className="py-2 font-medium text-ink">{s.schemeName}</td>
                      <td className="py-2 text-green font-semibold">{s.active}</td>
                      <td className="py-2 text-muted">{s.expired}</td>
                      <td className="py-2 text-madder font-semibold">{s.revoked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-4">
              {schemesBreakdown.map((s) => {
                const total = s.active + s.expired + s.revoked;
                const activePct = total > 0 ? (s.active / total) * 100 : 0;
                const expiredPct = total > 0 ? (s.expired / total) * 100 : 0;
                const revokedPct = total > 0 ? (s.revoked / total) * 100 : 0;

                return (
                  <div key={s.schemeId} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-medium text-ink">
                      <span>{s.schemeName}</span>
                      <span>
                        <span className="text-green font-bold">{s.active} Active</span> ·{' '}
                        <span className="text-muted">{s.expired} Expired</span> ·{' '}
                        <span className="text-madder font-bold">{s.revoked} Revoked</span>
                      </span>
                    </div>

                    {/* Stacked bar using exact colors: green active, grey expired, madder revoked */}
                    <div className="h-3.5 rounded-full bg-salt border border-line overflow-hidden flex">
                      <div
                        className="bg-green h-full"
                        style={{ width: `${activePct}%` }}
                        title={`Active: ${s.active}`}
                      />
                      <div
                        className="bg-line h-full"
                        style={{ width: `${expiredPct}%` }}
                        title={`Expired: ${s.expired}`}
                      />
                      <div
                        className="bg-madder h-full"
                        style={{ width: `${revokedPct}%` }}
                        title={`Revoked: ${s.revoked}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* 2. Horizontal Bar: Applications by District */}
        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-line">
            <div>
              <h2 className="text-sm font-bold text-ink">
                {t('admin.chart2Title')}
              </h2>
              <p className="text-xs text-muted">
                Which districts have the highest participation?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTableMode2(!tableMode2)}
              className="inline-flex items-center text-xs font-medium text-indigo hover:underline cursor-pointer shrink-0"
            >
              {tableMode2 ? (
                <>
                  <BarChart2 className="w-3.5 h-3.5 mr-1" />
                  <span>{t('admin.viewAsChart')}</span>
                </>
              ) : (
                <>
                  <Table className="w-3.5 h-3.5 mr-1" />
                  <span>{t('admin.viewAsTable')}</span>
                </>
              )}
            </button>
          </div>

          {tableMode2 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="pb-2 font-medium">District</th>
                    <th className="pb-2 font-medium">Total Applications</th>
                    <th className="pb-2 font-medium">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {districtData.map((d) => (
                    <tr key={d.district}>
                      <td className="py-2 font-medium text-ink">{d.district}</td>
                      <td className="py-2 font-semibold text-ink">{d.totalApplications}</td>
                      <td className="py-2 text-green font-semibold">{d.activeCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3">
              {districtData.map((d) => {
                const max = Math.max(...districtData.map((item) => item.totalApplications), 1);
                const pct = (d.totalApplications / max) * 100;

                return (
                  <div key={d.district} className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium text-ink">
                      <span>{d.district}</span>
                      <span>{d.totalApplications} applications</span>
                    </div>
                    <div className="h-3 rounded-full bg-salt border border-line overflow-hidden">
                      <div
                        className="bg-indigo h-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* 3. Horizontal Bar: Most Common Failed Checks */}
        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-line">
            <div>
              <h2 className="text-sm font-bold text-ink">
                {t('admin.chart3Title')}
              </h2>
              <p className="text-xs text-muted">
                What are the primary barriers preventing citizen approvals?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTableMode3(!tableMode3)}
              className="inline-flex items-center text-xs font-medium text-indigo hover:underline cursor-pointer shrink-0"
            >
              {tableMode3 ? (
                <>
                  <BarChart2 className="w-3.5 h-3.5 mr-1" />
                  <span>{t('admin.viewAsChart')}</span>
                </>
              ) : (
                <>
                  <Table className="w-3.5 h-3.5 mr-1" />
                  <span>{t('admin.viewAsTable')}</span>
                </>
              )}
            </button>
          </div>

          {tableMode3 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="pb-2 font-medium">Check Name</th>
                    <th className="pb-2 font-medium">Failure Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {failedChecks.map((f) => (
                    <tr key={f.checkName}>
                      <td className="py-2 font-medium text-ink capitalize">
                        {f.checkName.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2 font-semibold text-madder">{f.failedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3">
              {failedChecks.map((f) => {
                const max = Math.max(...failedChecks.map((item) => item.failedCount), 1);
                const pct = (f.failedCount / max) * 100;

                return (
                  <div key={f.checkName} className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium text-ink">
                      <span className="capitalize">{f.checkName.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-madder">{f.failedCount} failures</span>
                    </div>
                    <div className="h-3 rounded-full bg-salt border border-line overflow-hidden">
                      <div
                        className="bg-madder h-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* 4. Table: Eligible but not applied per scheme (Awareness Gap) */}
        <Card className="space-y-4">
          <div className="pb-2 border-b border-line">
            <h2 className="text-sm font-bold text-ink">
              {t('admin.chart4Title')}
            </h2>
            <p className="text-xs text-muted">
              Where can departmental outreach close the uptake gap?
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="pb-2 font-medium">Scheme</th>
                  <th className="pb-2 font-medium text-right">Eligible Families Not Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {awarenessGap.map((gap) => (
                  <tr key={gap.schemeId}>
                    <td className="py-2.5 font-medium text-ink">{gap.schemeName}</td>
                    <td className="py-2.5 text-right font-bold text-marigold">
                      {gap.eligibleNotApplied}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AdminAnalytics;
