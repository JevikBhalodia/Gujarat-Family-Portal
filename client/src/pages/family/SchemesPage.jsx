import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../../api/client.js';
import SchemeCard from '../../components/SchemeCard.jsx';
import { SchemeSkeleton, EmptyState, ErrorState } from '../../components/common/States.jsx';
import { Search } from 'lucide-react';

export function SchemesPage() {
  const { t } = useTranslation();

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNonEligible, setShowNonEligible] = useState(false);

  // Debounce search input by 250ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchSchemes = async () => {
    setLoading(true);
    setError('');
    try {
      // Backend supports view=all or view=applicable
      const view = showNonEligible ? 'all' : 'applicable';
      const data = await apiRequest(`/schemes?view=${view}`);
      setSchemes(data.schemes || []);
    } catch (err) {
      setError(err.message || t('states.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [showNonEligible]);

  const categories = useMemo(() => {
    const cats = new Set();
    schemes.forEach((s) => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats);
  }, [schemes]);

  // Filter and Sort: Qualify first, then "Check needed", then "Not eligible"
  const filteredSchemes = useMemo(() => {
    return schemes
      .filter((s) => {
        // Category filter
        if (selectedCategory !== 'all' && s.category !== selectedCategory) {
          return false;
        }
        // Search filter (name, description, department)
        if (debouncedSearch.trim()) {
          const q = debouncedSearch.toLowerCase().trim();
          const matchName = (s.name || '').toLowerCase().includes(q);
          const matchDesc = (s.description || '').toLowerCase().includes(q);
          const matchDept = (s.department_name || '').toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchDept) return false;
        }
        // Eligibility toggle
        if (!showNonEligible && s.eligibility?.status === 'not_eligible') {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const order = { eligible: 1, maybe: 2, not_eligible: 3 };
        const statusA = a.eligibility?.status || 'eligible';
        const statusB = b.eligibility?.status || 'eligible';
        return (order[statusA] || 4) - (order[statusB] || 4);
      });
  }, [schemes, selectedCategory, debouncedSearch, showNonEligible]);

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h1 className="text-2xl font-bold text-ink">
          {t('schemes.title')}
        </h1>
      </div>

      {/* Top Filter Controls: Search, Mobile Category Dropdown, Non-Eligible Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('schemes.searchPlaceholder')}
              className="w-full min-h-[44px] pl-10 pr-3 py-2 text-base text-ink bg-surface border border-line rounded-[8px] focus:outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-colors"
            />
          </div>
        </div>

        {/* Mobile category select (<1024px) */}
        <div className="lg:hidden">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 text-sm text-ink bg-surface border border-line rounded-[8px] focus:outline-none focus:border-indigo"
          >
            <option value="all">{t('schemes.categoryAll')}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Checkbox: Show schemes we don't qualify for */}
        <label className="flex items-center space-x-2 text-sm text-ink cursor-pointer select-none self-start sm:self-center">
          <input
            type="checkbox"
            checked={showNonEligible}
            onChange={(e) => setShowNonEligible(e.target.checked)}
            className="w-4 h-4 rounded border-line text-indigo focus:ring-indigo accent-indigo cursor-pointer"
          />
          <span>{t('schemes.showNotQualify')}</span>
        </label>
      </div>

      {/* Main Grid: Left rail for category filter on desktop ≥1024px, 1-column list for schemes */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left rail (≥1024px) */}
        <aside className="hidden lg:block lg:col-span-1 bg-surface border border-line rounded-[12px] p-4 text-left space-y-2 sticky top-24">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
            Categories
          </h2>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`w-full text-left px-3 py-2 rounded-[8px] text-sm font-medium transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-50 text-indigo font-bold'
                : 'text-ink hover:bg-salt'
            }`}
          >
            {t('schemes.categoryAll')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-3 py-2 rounded-[8px] text-sm font-medium transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-50 text-indigo font-bold'
                  : 'text-ink hover:bg-salt'
              }`}
            >
              {cat}
            </button>
          ))}
        </aside>

        {/* 1 Column Schemes List */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="space-y-4">
              <SchemeSkeleton />
              <SchemeSkeleton />
              <SchemeSkeleton />
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={fetchSchemes} />
          ) : filteredSchemes.length === 0 ? (
            <EmptyState
              message={t('schemes.noMatch')}
              actionText={t('schemes.clearSearch')}
              onAction={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setShowNonEligible(true);
              }}
            />
          ) : (
            <div className="space-y-4">
              {filteredSchemes.map((scheme) => (
                <SchemeCard key={scheme.id} scheme={scheme} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SchemesPage;
