import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import LanguageToggle from '../common/LanguageToggle.jsx';
import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react';

export function TopNav() {
  const { t } = useTranslation();
  const { user, member, family, isAdmin, isHead, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const getRoleLabel = () => {
    if (isAdmin) return t('roles.officer');
    if (isHead) return t('roles.head');
    if (member?.access === 'apply') return t('roles.memberApply');
    return t('roles.memberView');
  };

  const citizenNav = [
    { to: '/schemes', label: t('nav.schemes') },
    { to: '/applications', label: t('nav.applications') },
    ...(isHead ? [{ to: '/family', label: t('nav.family') }] : []),
    { to: '/profile', label: t('nav.profile') }
  ];

  const adminNav = [
    { to: '/admin/analytics', label: t('nav.analytics') },
    { to: '/admin/lookup', label: t('nav.lookup') },
    { to: '/admin/queries', label: t('nav.queries') },
    { to: '/profile', label: t('nav.profile') }
  ];

  const navItems = isAdmin ? adminNav : citizenNav;
  const displayName = member?.name || user?.mobile || 'User';

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-line">
      {/* Thin Ajrakh woven stripe along top edge */}
      <div className="stripe" aria-hidden="true" />

      <div className="max-w-[1120px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal title */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => navigate(user ? (isAdmin ? '/admin/analytics' : '/schemes') : '/login')}
          >
            <div className="w-8 h-8 rounded-[8px] bg-indigo flex items-center justify-center text-white font-bold text-sm shrink-0">
              GJ
            </div>
            <span className="font-bold text-ink text-base sm:text-lg tracking-tight line-clamp-1">
              {t('portal.title')}
            </span>
          </div>

          {/* Desktop Nav Links (only when logged in) */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 h-full" aria-label="Main Navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `h-full flex items-center px-3.5 text-sm font-medium transition-colors border-b-2 ${
                      isActive
                        ? 'text-indigo border-indigo'
                        : 'text-muted border-transparent hover:text-ink'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Right Utilities: Language toggle & User Menu / Sign In button */}
          <div className="flex items-center space-x-3">
            <LanguageToggle />

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center space-x-1.5 py-1.5 px-2.5 rounded-[8px] border border-line bg-surface hover:bg-indigo-50 text-sm font-medium text-ink focus-visible:outline-2 focus-visible:outline-indigo transition-colors cursor-pointer"
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  <span className="max-w-[120px] truncate">{displayName}</span>
                  <ChevronDown className={`w-4 h-4 text-muted transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-surface border border-line rounded-[12px] p-2 shadow-lg z-50 animate-fade-in"
                    role="menu"
                  >
                    <div className="px-3 py-2 border-b border-line mb-1 text-left">
                      <p className="text-xs font-bold text-ink truncate">{displayName}</p>
                      <p className="text-[11px] text-muted font-mono truncate">{user.mobile}</p>
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo border border-indigo/20">
                          {getRoleLabel()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-[8px] text-xs font-medium text-ink hover:bg-indigo-50 transition-colors text-left cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-muted" />
                      <span>{t('nav.profile')}</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-[8px] text-xs font-medium text-madder hover:bg-[var(--madder-fill)] transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-madder" />
                      <span>{t('nav.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to="/login"
                className="inline-flex items-center justify-center min-h-[36px] px-3.5 py-1.5 rounded-[8px] bg-indigo text-white text-xs font-medium hover:opacity-95 transition-opacity"
              >
                {t('nav.login')}
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopNav;
