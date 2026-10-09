import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useTranslation } from '../../i18n/LanguageContext';

export const AppShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  // Map path to title
  const getPageTitle = (pathname: string): string => {
    if (pathname.startsWith('/incoming-docs')) return t.nav.incomingDocs;
    if (pathname.startsWith('/outgoing-docs')) return t.nav.outgoingDocs;
    if (pathname.startsWith('/all-docs')) return t.nav.allDocs;
    if (pathname.startsWith('/assign-task')) return t.nav.assignTask;
    if (pathname.startsWith('/task-tracking')) return t.nav.taskTracking;
    if (pathname.startsWith('/calendar')) return t.nav.calendar;
    if (pathname.startsWith('/notifications')) return t.nav.notifications;
    if (pathname.startsWith('/employees')) return t.nav.employees;
    if (pathname.startsWith('/departments')) return t.nav.departments;
    if (pathname.startsWith('/reports')) return t.nav.reports;
    if (pathname.startsWith('/audit-logs')) return t.nav.auditLogs;
    if (pathname.startsWith('/settings')) return t.nav.settings;
    return t.nav.dashboard;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Header
          onToggleSidebar={() => {
            if (window.innerWidth >= 1024) {
              setSidebarCollapsed(!sidebarCollapsed);
            } else {
              setSidebarOpen(!sidebarOpen);
            }
          }}
          pageTitle={getPageTitle(location.pathname)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
