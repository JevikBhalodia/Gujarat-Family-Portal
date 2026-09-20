import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  FileText,
  Layers,
  Users,
  User,
  BarChart3,
  Search,
  MessageSquare,
  LogOut,
  Languages,
  ShieldCheck
} from 'lucide-react';

export function Navbar() {
  const { user, member, family, isAdmin, isHead, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const citizenNav = [
    { to: '/schemes', label: t('navSchemes'), icon: Layers },
    { to: '/applications', label: t('navApplications'), icon: FileText },
    ...(isHead ? [{ to: '/family', label: t('navFamily'), icon: Users }] : []),
    { to: '/profile', label: t('navProfile'), icon: User }
  ];

  const adminNav = [
    { to: '/admin/analytics', label: t('navAnalytics'), icon: BarChart3 },
    { to: '/admin/lookup', label: t('navLookup'), icon: Search },
    { to: '/admin/queries', label: t('navQueries'), icon: MessageSquare },
    { to: '/profile', label: t('navProfile'), icon: ShieldCheck }
  ];

  const navItems = isAdmin ? adminNav : citizenNav;

  return (
    <>
      {/* Top Desktop Navigation */}
      <header className="sticky top-0 z-40 glass-header border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate(isAdmin ? '/admin/analytics' : '/schemes')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-amber-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                GJ
              </div>
              <div>
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight block leading-tight">
                  {t('portalTitle')}
                </span>
                <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  {t('portalSub')}
                </span>
              </div>
            </div>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-sky-50 text-sky-700 shadow-sm border border-sky-100'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Right utilities: Language Toggle & User actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                title="Switch Language"
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
              >
                <Languages className="w-3.5 h-3.5 text-sky-600" />
                <span>{lang === 'en' ? 'ગુજરાતી' : 'English'}</span>
              </button>

              {user ? (
                <div className="flex items-center space-x-2">
                  <div className="hidden lg:block text-right">
                    <span className="block text-xs font-bold text-slate-800">
                      {member?.name || user.mobile}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-medium uppercase">
                      {isAdmin ? 'Dept Officer' : family?.family_code || 'Citizen'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title={t('logout')}
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/login"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition"
                >
                  {t('login')}
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg px-2 py-1 flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-[10px] font-medium transition ${
                    isActive ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </>
  );
}

export default Navbar;
