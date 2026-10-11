import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Globe, ChevronDown, User as UserIcon, CheckSquare, FileText, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { NotificationDropdown } from './NotificationDropdown';
import { GlobalSearchModal } from './GlobalSearchModal';

export interface HeaderProps {
  onToggleSidebar: () => void;
  pageTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, pageTitle }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 h-14 sm:h-16 bg-gradient-to-r from-slate-50/95 via-sky-50/30 to-indigo-50/20 backdrop-blur-md border-b border-slate-200/90 px-2.5 sm:px-5 lg:px-6 flex items-center justify-between gap-2 sm:gap-4 shadow-2xs">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors focus:outline-none border border-transparent hover:border-slate-200"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {pageTitle && (
            <h1 className="text-xs sm:text-base font-bold text-slate-800 tracking-tight hidden md:block">
              {pageTitle}
            </h1>
          )}
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md mx-1 sm:mx-2 min-w-0">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white/90 hover:bg-white text-slate-400 hover:text-slate-600 text-xs sm:text-sm transition-all focus:outline-none shadow-2xs hover:border-blue-300"
          >
            <span className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
              <span className="truncate text-[11px] sm:text-xs">{t.header.searchPlaceholder}</span>
            </span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-50 rounded border border-slate-200 shadow-2xs shrink-0">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Language, Notifications & User Profile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Language Switcher Tab Strip */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/90 p-0.5 sm:p-1 text-[11px] sm:text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setLanguage('lo')}
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg transition-all ${
                language === 'lo'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              ລາວ
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg transition-all ${
                language === 'en'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              EN
            </button>
          </div>

          {/* Notifications Dropdown */}
          <NotificationDropdown />

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-2 rounded-xl hover:bg-slate-100 transition-all focus:outline-none border border-transparent hover:border-slate-200"
            >
              <div className="relative shrink-0">
                {user?.avatarUrl || (user?.username === 'admin' ? '/avatars/nokone-badge.png' : undefined) ? (
                  <img
                    src={user?.avatarUrl || '/avatars/nokone-badge.png'}
                    alt={user?.fullNameLao || user?.username}
                    className="w-9 h-9 rounded-full object-cover shadow-xs border-2 border-white ring-1 ring-blue-500/30"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs border-2 border-white ring-1 ring-blue-500/30">
                    {user?.fullNameLao?.charAt(0) || user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.fullNameLao || user?.username}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="inline-flex items-center text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/80 leading-none">
                    {user?.roleNameLao || user?.roleName}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 py-1 text-xs animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-white flex items-center gap-3">
                  <div className="relative shrink-0">
                    {user?.avatarUrl || (user?.username === 'admin' ? '/avatars/nokone-badge.png' : undefined) ? (
                      <img
                        src={user?.avatarUrl || '/avatars/nokone-badge.png'}
                        alt={user?.fullNameLao || user?.username}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs ring-1 ring-blue-400/40"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs border-2 border-white">
                        {user?.fullNameLao?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {user?.fullNameLao || user?.username}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-bold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-full border border-blue-300/80 shadow-2xs">
                      {user?.roleNameLao || user?.roleName}
                    </span>
                    {user?.departmentName && (
                      <p className="text-slate-500 text-[10px] mt-0.5 truncate font-medium">
                        {user.departmentName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/task-tracking');
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <CheckSquare className="w-4 h-4 text-slate-400" />
                    <span>{t.header.myTasks}</span>
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/all-docs');
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>{t.header.myDocuments}</span>
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>{t.header.settings}</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2.5"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>{t.header.logout}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};
