import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export function LanguageToggle({ className = '' }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('gu') ? 'gu' : 'en';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'gu' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title="Switch Language / ભાષા બદલો"
      className={`min-h-[36px] px-3 py-1.5 rounded-[8px] border border-line bg-surface hover:bg-indigo-50 text-xs font-medium text-ink flex items-center space-x-1.5 focus-visible:outline-2 focus-visible:outline-indigo transition-colors cursor-pointer ${className}`}
    >
      <Languages className="w-4 h-4 text-indigo shrink-0" aria-hidden="true" />
      <span>{currentLang === 'en' ? 'ગુજરાતી' : 'English'}</span>
    </button>
  );
}

export default LanguageToggle;
