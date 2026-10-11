import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Inbox,
  Send,
  Workflow,
  FileText,
  Pin,
  RefreshCw,
  Calendar,
  Bell,
  Users,
  Building,
  BarChart3,
  Clock,
  Settings,
  ChevronLeft,
  X,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { t } = useTranslation();

  const menuItems = [
    { name: t.nav.dashboard, path: '/dashboard', icon: Home },
    { name: t.nav.incomingDocs, path: '/incoming-docs', icon: Inbox },
    { name: t.nav.outgoingDocs, path: '/outgoing-docs', icon: Send },
    { name: t.nav.workflow, path: '/approval-workflow', icon: Workflow },
    { name: t.nav.allDocs, path: '/all-docs', icon: FileText },
    { name: t.nav.assignTask, path: '/assign-task', icon: Pin },
    { name: t.nav.taskTracking, path: '/task-tracking', icon: RefreshCw },
    { name: t.nav.calendar, path: '/calendar', icon: Calendar },
    { name: t.nav.notifications, path: '/notifications', icon: Bell },
    { name: t.nav.employees, path: '/employees', icon: Users },
    { name: t.nav.departments, path: '/departments', icon: Building },
    { name: t.nav.reports, path: '/reports', icon: BarChart3 },
    { name: t.nav.auditLogs, path: '/audit-logs', icon: Clock },
    { name: t.nav.settings, path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-gradient-to-b from-[#12396e] via-[#1a4a8c] to-[#0d264c] text-blue-100 transition-all duration-300 ease-in-out border-r border-blue-700/50 shadow-xl shadow-blue-950/20 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'w-64 max-w-[85vw]'}`}
      >
        {/* Brand Header */}
        <div className="h-14 sm:h-16 flex items-center justify-between px-3.5 sm:px-4 border-b border-white/10 bg-black/15 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-9 h-9 rounded-lg object-contain bg-white p-0.5 shrink-0 shadow-xs"
              onError={(e) => {
                // fallback to colored placeholder if remote image is blocked
                (e.currentTarget as HTMLImageElement).src =
                  'https://img2.pic.in.th/ChatGPT-Image-Sep-28-2026-11_11_54-AM.png';
              }}
            />
            {!isCollapsed && (
              <div className="leading-tight select-none">
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white block">E-Document Management</span>
                <span className="block text-[10px] text-sky-200 font-medium mt-0.5">
                  ລະບົບຫ້ອງການອິເລັກໂຕຣນິກ
                </span>
              </div>
            )}
          </div>

          {/* Close for mobile */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/15 text-blue-200 hover:text-white lg:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Collapse toggle for desktop */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1 rounded-lg hover:bg-white/15 text-blue-200 hover:text-white transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-200 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto min-h-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-white text-blue-800 font-bold shadow-md shadow-blue-950/25 border border-white'
                      : 'text-blue-100 hover:text-white hover:bg-white/12'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`
                }
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105`} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* System Version Badge */}
        <div className="p-3 border-t border-white/10 bg-black/20 shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-1 text-[11px] text-sky-200">
              <span className="font-medium">ເວີຊັນລະບົບ:</span>
              <span className="font-bold font-mono px-2 py-0.5 rounded-full bg-blue-500/30 text-white border border-blue-400/40 shadow-xs">
                v11.10.2026
              </span>
            </div>
          ) : (
            <div className="text-center" title="ເວີຊັນ v11.10.2026">
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-500/30 text-white border border-blue-400/30 inline-block">
                v11.10
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
