import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { Layers, FileText, Users, User, BarChart3, Search, MessageSquare } from 'lucide-react';

export function BottomNav() {
  const { t } = useTranslation();
  const { user, isAdmin, isHead } = useAuth();

  if (!user) return null;

  const citizenNav = [
    { to: '/schemes', label: t('nav.schemes'), icon: Layers },
    { to: '/applications', label: t('nav.applications'), icon: FileText },
    ...(isHead ? [{ to: '/family', label: t('nav.family'), icon: Users }] : []),
    { to: '/profile', label: t('nav.profile'), icon: User }
  ].slice(0, 4);

  const adminNav = [
    { to: '/admin/analytics', label: t('nav.analytics'), icon: BarChart3 },
    { to: '/admin/lookup', label: t('nav.lookup'), icon: Search },
    { to: '/admin/queries', label: t('nav.queries'), icon: MessageSquare },
    { to: '/profile', label: t('nav.profile'), icon: User }
  ].slice(0, 4);

  const items = isAdmin ? adminNav : citizenNav;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-surface border-t border-line z-40 px-2 flex justify-around items-center"
      aria-label="Mobile Bottom Navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-full text-[11px] font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo font-bold'
                  : 'text-muted hover:text-ink'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span className="leading-tight mt-0.5">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default BottomNav;
