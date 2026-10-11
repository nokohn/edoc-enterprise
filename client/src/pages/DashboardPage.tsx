import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  Send,
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Plus,
  TrendingUp,
  UserCheck,
  Building,
  ArrowRight,
  ExternalLink,
  BarChart2,
  Activity,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { api } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { DashboardStats } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { DocumentFormModal } from '../components/documents/DocumentFormModal';
import { TaskFormModal } from '../components/tasks/TaskFormModal';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals for Quick Actions
  const [openIncomingModal, setOpenIncomingModal] = useState(false);
  const [openOutgoingModal, setOpenOutgoingModal] = useState(false);
  const [openTaskModal, setOpenTaskModal] = useState(false);

  // Timeframe states for charts: daily, weekly, monthly, yearly
  type Timeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';
  type ChartType = 'area' | 'bar';

  const [incomingPeriod, setIncomingPeriod] = useState<Timeframe>('monthly');
  const [outgoingPeriod, setOutgoingPeriod] = useState<Timeframe>('monthly');
  const [incomingChartType, setIncomingChartType] = useState<ChartType>('bar');
  const [outgoingChartType, setOutgoingChartType] = useState<ChartType>('bar');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time ticking clock for LIVE badge
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLiveDateTime = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  // Responsive screen detection for dynamic chart sizing & layout across all devices
  const [screenWidth, setScreenWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenWidth < 640;
  const isTablet = screenWidth >= 640 && screenWidth < 1024;

  // Smart responsive X-axis label formatter so all items fit cleanly on any device
  const formatXAxisLabel = (label: string) => {
    if (!isMobile) return label;
    const monthShortLao: Record<string, string> = {
      'ມັງກອນ': 'ມ.ກ',
      'ກຸມພາ': 'ກ.ພ',
      'ມີນາ': 'ມ.ນ',
      'ເມສາ': 'ມ.ສ',
      'ພຶດສະພາ': 'ພ.ພ',
      'ມິຖຸນາ': 'ມ.ຖ',
      'ກໍລະກົດ': 'ກ.ລ',
      'ສິງຫາ': 'ສ.ຫ',
      'ກັນຍາ': 'ກ.ຍ',
      'ຕຸລາ': 'ຕ.ລ',
      'ພະຈິກ': 'ພ.ຈ',
      'ທັນວາ': 'ທ.ວ',
    };
    if (monthShortLao[label]) return monthShortLao[label];
    if (typeof label === 'string' && label.startsWith('ອາທິດ ')) {
      return 'ອ.' + label.replace('ອາທິດ ', '');
    }
    return label;
  };

  // Dynamic responsive bar thickness based on screen width and data granularity
  const getResponsiveBarSize = (period: Timeframe) => {
    if (isMobile) {
      switch (period) {
        case 'monthly':
          return 14;
        case 'daily':
          return 20;
        case 'weekly':
          return 28;
        case 'yearly':
          return 34;
        default:
          return 20;
      }
    }
    if (isTablet) {
      switch (period) {
        case 'monthly':
          return 22;
        case 'daily':
          return 28;
        case 'weekly':
          return 38;
        case 'yearly':
          return 44;
        default:
          return 30;
      }
    }
    // Desktop / Ultrawide
    switch (period) {
      case 'monthly':
        return 32;
      case 'daily':
        return 38;
      case 'weekly':
        return 48;
      case 'yearly':
        return 52;
      default:
        return 40;
    }
  };

  const timeframeOptions: { key: Timeframe; label: string }[] = [
    { key: 'daily', label: t.dashboard.charts.daily || 'ລາຍວັນ' },
    { key: 'weekly', label: t.dashboard.charts.weekly || 'ລາຍອາທິດ' },
    { key: 'monthly', label: t.dashboard.charts.monthly || 'ລາຍເດືອນ' },
    { key: 'yearly', label: t.dashboard.charts.yearly || 'ລາຍປີ' },
  ];

  const getIncomingChartData = () => {
    if (!stats?.charts) return [];
    switch (incomingPeriod) {
      case 'daily':
        return stats.charts.incomingByDay && stats.charts.incomingByDay.length > 0
          ? stats.charts.incomingByDay
          : [];
      case 'weekly':
        return stats.charts.incomingByWeek && stats.charts.incomingByWeek.length > 0
          ? stats.charts.incomingByWeek
          : [];
      case 'yearly':
        return stats.charts.incomingByYear && stats.charts.incomingByYear.length > 0
          ? stats.charts.incomingByYear
          : [];
      case 'monthly':
      default:
        return (stats.charts.incomingByMonth || []).map((m) => ({
          ...m,
          label: m.label || m.month,
        }));
    }
  };

  const getOutgoingChartData = () => {
    if (!stats?.charts) return [];
    switch (outgoingPeriod) {
      case 'daily':
        return stats.charts.outgoingByDay && stats.charts.outgoingByDay.length > 0
          ? stats.charts.outgoingByDay
          : [];
      case 'weekly':
        return stats.charts.outgoingByWeek && stats.charts.outgoingByWeek.length > 0
          ? stats.charts.outgoingByWeek
          : [];
      case 'yearly':
        return stats.charts.outgoingByYear && stats.charts.outgoingByYear.length > 0
          ? stats.charts.outgoingByYear
          : [];
      case 'monthly':
      default:
        return (stats.charts.outgoingByMonth || []).map((m) => ({
          ...m,
          label: m.label || m.month,
        }));
    }
  };

  const getTimeframeLabel = (p: Timeframe) => {
    switch (p) {
      case 'daily':
        return t.dashboard.charts.daily || 'ລາຍວັນ';
      case 'weekly':
        return t.dashboard.charts.weekly || 'ລາຍອາທິດ';
      case 'yearly':
        return t.dashboard.charts.yearly || 'ລາຍປີ';
      case 'monthly':
      default:
        return t.dashboard.charts.monthly || 'ລາຍເດືອນ';
    }
  };

  const CustomChartTooltip = ({ active, payload, label, color, docTypeLabel }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const count = payload[0].value ?? 0;
      const fullLabel =
        data.fullDate ||
        (data.range ? `${label} (${data.range})` : data.year ? `ປີ ${data.year}` : data.name || data.month || label);
      return (
        <div className="bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-xl shadow-xl border border-slate-200/90 text-xs min-w-[140px] sm:min-w-[160px]">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 border-b border-slate-100 pb-1.5 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="truncate">{fullLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 font-medium">{docTypeLabel}:</span>
            <span className="font-extrabold text-xs sm:text-sm" style={{ color }}>
              {count} ສະບັບ
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const incomingData = getIncomingChartData();
  const totalIncomingInPeriod = incomingData.reduce((acc, cur) => acc + (cur.count || 0), 0);

  const outgoingData = getOutgoingChartData();
  const totalOutgoingInPeriod = outgoingData.reduce((acc, cur) => acc + (cur.count || 0), 0);

  const COLORS = ['#94a3b8', '#3b82f6', '#eab308', '#a855f7', '#22c55e', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                {t.dashboard.title}
              </h1>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-xs">
                <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-400"></span>
                </span>
                <span className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-black font-mono tracking-tight text-white">
                  {formatLiveDateTime(currentDateTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Section 8) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setOpenIncomingModal(true)}
              className="bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold shadow-md shadow-blue-950/30 border border-blue-300/40 hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t.dashboard.newIncoming}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setOpenOutgoingModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-md shadow-indigo-950/30 border border-indigo-300/40 hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t.dashboard.newOutgoing}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setOpenTaskModal(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold shadow-md shadow-orange-950/30 border border-amber-300/40 hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t.dashboard.assignWork}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/employees')}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-md shadow-emerald-950/30 border border-emerald-300/40 hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t.dashboard.addUser}
            </Button>
          </div>
        </div>
      </div>

      {/* Top 7 KPI Cards (Section 8) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2.5 sm:gap-3.5 lg:gap-4">
        {/* KPI 1: Incoming Docs */}
        <div
          onClick={() => navigate('/incoming-docs')}
          className="bg-gradient-to-br from-blue-500/15 via-blue-50/80 to-sky-100/70 p-4 rounded-2xl border border-blue-200/90 shadow-2xs hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col items-center justify-between text-center group"
        >
          <div className="flex items-center justify-center mb-2.5">
            <span className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <Inbox className="w-5 h-5" />
            </span>
          </div>
          <div className="w-full flex flex-col items-center">
            <p className="text-2xl sm:text-3xl font-black text-blue-950">
              {loading ? <LoadingSkeleton className="h-8 w-12" /> : stats?.counts.incomingDocs ?? 0}
            </p>
            <p className="text-[16px] font-bold text-blue-800/90 mt-1.5 text-center leading-tight">
              {t.dashboard.kpi.incomingDocs}
            </p>
          </div>
        </div>

        {/* KPI 2: Outgoing Docs */}
        <div
          onClick={() => navigate('/outgoing-docs')}
          className="bg-gradient-to-br from-indigo-500/15 via-indigo-50/80 to-violet-100/70 p-4 rounded-2xl border border-indigo-200/90 shadow-2xs hover:shadow-md hover:border-indigo-400 hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col items-center justify-between text-center group"
        >
          <div className="flex items-center justify-center mb-2.5">
            <span className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs shadow-indigo-500/30 group-hover:scale-110 transition-transform">
              <Send className="w-5 h-5" />
            </span>
          </div>
          <div className="w-full flex flex-col items-center">
            <p className="text-2xl sm:text-3xl font-black text-indigo-950">
              {loading ? <LoadingSkeleton className="h-8 w-12" /> : stats?.counts.outgoingDocs ?? 0}
            </p>
            <p className="text-[16px] font-bold text-indigo-800/90 mt-1.5 text-center leading-tight">
              {t.dashboard.kpi.outgoingDocs}
            </p>
          </div>
        </div>

        {/* KPI 3: Assigned Tasks */}
        <div
          onClick={() => navigate('/task-tracking')}
          className="bg-gradient-to-br from-cyan-500/15 via-cyan-50/80 to-teal-100/70 p-4 rounded-2xl border border-cyan-200/90 shadow-2xs hover:shadow-md hover:border-cyan-400 hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col items-center justify-between text-center group"
        >
          <div className="flex items-center justify-center mb-2.5">
            <span className="p-2.5 bg-cyan-600 text-white rounded-xl shadow-xs shadow-cyan-500/30 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </span>
          </div>
          <div className="w-full flex flex-col items-center">
            <p className="text-2xl sm:text-3xl font-black text-cyan-950">
              {loading ? <LoadingSkeleton className="h-8 w-12" /> : stats?.counts.assignedTasks ?? 0}
            </p>
            <p className="text-[16px] font-bold text-cyan-800/90 mt-1.5 text-center leading-tight">
              {t.dashboard.kpi.assignedTasks}
            </p>
          </div>
        </div>

        {/* KPI 4: In Progress Tasks */}
        <div
          onClick={() => navigate('/task-tracking')}
          className="bg-gradient-to-br from-amber-500/15 via-amber-50/80 to-orange-100/70 p-4 rounded-2xl border border-amber-200/90 shadow-2xs hover:shadow-md hover:border-amber-400 hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col items-center justify-between text-center group"
        >
          <div className="flex items-center justify-center mb-2.5">
            <span className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shadow-amber-500/30 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="w-full flex flex-col items-center">
            <p className="text-2xl sm:text-3xl font-black text-amber-950">
              {loading ? <LoadingSkeleton className="h-8 w-12" /> : stats?.counts.inProgressTasks ?? 0}
            </p>
            <p className="text-[16px] font-bold text-amber-800/90 mt-1.5 text-center leading-tight">
              {t.dashboard.kpi.inProgressTasks}
            </p>
          </div>
        </div>

        {/* KPI 5: Completed Tasks */}
        <div
          onClick={() => navigate('/task-tracking')}
          className="bg-gradient-to-br from-emerald-500/15 via-emerald-50/80 to-teal-100/70 p-4 rounded-2xl border border-emerald-200/90 shadow-2xs hover:shadow-md hover:border-emerald-400 hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col items-center justify-between text-center group"
        >
          <div className="flex items-center justify-center mb-2.5">
            <span className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="w-full flex flex-col items-center">
            <p className="text-2xl sm:text-3xl font-black text-emerald-950">
              {loading ? <LoadingSkeleton className="h-8 w-12" /> : stats?.counts.completedTasks ?? 0}
            </p>
            <p className="text-[16px] font-bold text-emerald-800/90 mt-1.5 text-center leading-tight">
              {t.dashboard.kpi.completedTasks}
            </p>
          </div>
        </div>

        {/* KPI 6: Pending Tasks */}
        <div
          onClick={() => navigate('/task-tracking')}
          className="bg-gradient-to-br from-purple-500/15 via-purple-50/80 to-fuchsia-100/70 p-4 rounded-2xl border border-purple-200/90 shadow-2xs hover:shadow-md hover:border-purple-400 hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col items-center justify-between text-center group"
        >
          <div className="flex items-center justify-center mb-2.5">
            <span className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-5 h-5" />
            </span>
          </div>
          <div className="w-full flex flex-col items-center">
            <p className="text-2xl sm:text-3xl font-black text-purple-950">
              {loading ? <LoadingSkeleton className="h-8 w-12" /> : stats?.counts.pendingTasks ?? 0}
            </p>
            <p className="text-[16px] font-bold text-purple-800/90 mt-1.5 text-center leading-tight">
              {t.dashboard.kpi.pendingTasks}
            </p>
          </div>
        </div>

        {/* KPI 7: Pending Approvals */}
        <div
          onClick={() => navigate('/outgoing-docs')}
          className="bg-gradient-to-br from-rose-500/15 via-rose-50/80 to-pink-100/70 p-4 rounded-2xl border border-rose-200/90 shadow-2xs hover:shadow-md hover:border-rose-400 hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col items-center justify-between text-center group"
        >
          <div className="flex items-center justify-center mb-2.5">
            <span className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs shadow-rose-500/30 group-hover:scale-110 transition-transform">
              <FileCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="w-full flex flex-col items-center">
            <p className="text-2xl sm:text-3xl font-black text-rose-950">
              {loading ? <LoadingSkeleton className="h-8 w-12" /> : stats?.counts.pendingApprovals ?? 0}
            </p>
            <p className="text-[16px] font-bold text-rose-800/90 mt-1.5 text-center leading-tight">
              {t.dashboard.kpi.pendingApprovals}
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Incoming Documents with Period Filter (Daily, Weekly, Monthly, Yearly) - Bar Chart Default */}
        <Card
          className="border-blue-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden min-w-0"
          headerClassName="bg-gradient-to-r from-blue-100/80 via-sky-50 to-blue-100/80 border-b border-blue-200/90"
          title={
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="p-2 bg-blue-600 text-white rounded-xl shadow-xs shadow-blue-500/30 shrink-0">
                {incomingChartType === 'bar' ? <BarChart2 className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-blue-950 truncate">
                  {t.dashboard.charts.incomingDocsStats || 'ສະຖິຕິເອກະສານຂາເຂົ້າ'}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-blue-100/90 text-blue-800 border border-blue-200/90 shadow-2xs">
                    {`ສະແດງຕາມ ${getTimeframeLabel(incomingPeriod)} • ລວມ ${totalIncomingInPeriod} ສະບັບ`}
                  </span>
                </div>
              </div>
            </div>
          }
          action={
            <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
              {/* Colored Timeframe Tabs Strip (ແຖບເລືອກຊ່ວງເວລາ: ລາຍວັນ, ລາຍອາທິດ, ລາຍເດືອນ, ລາຍປີ) */}
              <div className="inline-flex items-center p-0.5 sm:p-1 bg-gradient-to-r from-blue-100 via-sky-100 to-blue-100 rounded-xl border border-blue-200/90 shadow-2xs gap-0.5 sm:gap-1 flex-1 sm:flex-initial">
                {timeframeOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setIncomingPeriod(opt.key)}
                    className={clsx(
                      'px-1.5 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer flex-1 sm:flex-initial text-center justify-center',
                      incomingPeriod === opt.key
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-sm shadow-blue-500/30 border border-blue-500 scale-[1.02]'
                        : 'bg-white/95 text-blue-950 font-bold border border-blue-200/80 hover:bg-white hover:text-blue-700 hover:border-blue-300 shadow-2xs'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIncomingChartType((prev) => (prev === 'bar' ? 'area' : 'bar'))}
                title={incomingChartType === 'bar' ? (t.dashboard.charts.lineChart || 'ປ່ຽນເປັນເສັ້ນສະແດງ (Line/Area)') : (t.dashboard.charts.barChart || 'ປ່ຽນເປັນແຜນພູມແທ່ງ (Bar Chart)')}
                className="p-1.5 rounded-xl border border-blue-200/90 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-900 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                {incomingChartType === 'bar' ? <Activity className="w-4 h-4" /> : <BarChart2 className="w-4 h-4" />}
              </button>
            </div>
          }
        >
          <div className="h-[250px] sm:h-[285px] lg:h-[320px] w-full pt-1 sm:pt-2">
            {loading ? (
              <LoadingSkeleton className="w-full h-full" />
            ) : incomingChartType === 'bar' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={incomingData}
                  margin={{
                    top: 10,
                    right: isMobile ? 6 : 14,
                    left: isMobile ? -14 : -6,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="barIncomingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={isMobile ? 10 : 11}
                    tickLine={false}
                    tickMargin={4}
                    tickFormatter={formatXAxisLabel}
                    interval={0}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={isMobile ? 10 : 11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={isMobile ? 26 : 34}
                  />
                  <Tooltip content={<CustomChartTooltip color="#2563eb" docTypeLabel="ເອກະສານຂາເຂົ້າ" />} />
                  <Bar
                    dataKey="count"
                    fill="url(#barIncomingGrad)"
                    maxBarSize={getResponsiveBarSize(incomingPeriod)}
                    radius={[6, 6, 2, 2]}
                    name="ເອກະສານຂາເຂົ້າ"
                    isAnimationActive={true}
                    animationDuration={500}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={incomingData}
                  margin={{
                    top: 10,
                    right: isMobile ? 6 : 14,
                    left: isMobile ? -14 : -6,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={isMobile ? 10 : 11}
                    tickLine={false}
                    tickMargin={4}
                    tickFormatter={formatXAxisLabel}
                    interval={0}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={isMobile ? 10 : 11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={isMobile ? 26 : 34}
                  />
                  <Tooltip content={<CustomChartTooltip color="#2563eb" docTypeLabel="ເອກະສານຂາເຂົ້າ" />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={isMobile ? 2.5 : 3}
                    fillOpacity={1}
                    fill="url(#colorIncoming)"
                    dot={{ r: isMobile ? 2.5 : 3.5, fill: '#2563eb', strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                    name="ເອກະສານຂາເຂົ້າ"
                    isAnimationActive={true}
                    animationDuration={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Chart 2: Outgoing Documents with Period Filter (Daily, Weekly, Monthly, Yearly) - Bar Chart Default */}
        <Card
          className="border-indigo-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden min-w-0"
          headerClassName="bg-gradient-to-r from-indigo-100/80 via-purple-50 to-indigo-100/80 border-b border-indigo-200/90"
          title={
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs shadow-indigo-500/30 shrink-0">
                {outgoingChartType === 'bar' ? <BarChart2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-indigo-950 truncate">
                  {t.dashboard.charts.outgoingDocsStats || 'ສະຖິຕິເອກະສານຂາອອກ'}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-indigo-100/90 text-indigo-800 border border-indigo-200/90 shadow-2xs">
                    {`ສະແດງຕາມ ${getTimeframeLabel(outgoingPeriod)} • ລວມ ${totalOutgoingInPeriod} ສະບັບ`}
                  </span>
                </div>
              </div>
            </div>
          }
          action={
            <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
              {/* Colored Timeframe Tabs Strip (ແຖບເລືອກຊ່ວງເວລາ: ລາຍວັນ, ລາຍອາທິດ, ລາຍເດືອນ, ລາຍປີ) */}
              <div className="inline-flex items-center p-0.5 sm:p-1 bg-gradient-to-r from-indigo-100 via-purple-100 to-indigo-100 rounded-xl border border-indigo-200/90 shadow-2xs gap-0.5 sm:gap-1 flex-1 sm:flex-initial">
                {timeframeOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setOutgoingPeriod(opt.key)}
                    className={clsx(
                      'px-1.5 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer flex-1 sm:flex-initial text-center justify-center',
                      outgoingPeriod === opt.key
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black shadow-sm shadow-indigo-500/30 border border-indigo-500 scale-[1.02]'
                        : 'bg-white/95 text-indigo-950 font-bold border border-indigo-200/80 hover:bg-white hover:text-indigo-700 hover:border-indigo-300 shadow-2xs'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOutgoingChartType((prev) => (prev === 'bar' ? 'area' : 'bar'))}
                title={outgoingChartType === 'bar' ? (t.dashboard.charts.lineChart || 'ປ່ຽນເປັນເສັ້ນສະແດງ (Line/Area)') : (t.dashboard.charts.barChart || 'ປ່ຽນເປັນແຜນພູມແທ່ງ (Bar Chart)')}
                className="p-1.5 rounded-xl border border-indigo-200/90 bg-white hover:bg-indigo-50 text-indigo-700 hover:text-indigo-900 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                {outgoingChartType === 'bar' ? <Activity className="w-4 h-4" /> : <BarChart2 className="w-4 h-4" />}
              </button>
            </div>
          }
        >
          <div className="h-[250px] sm:h-[285px] lg:h-[320px] w-full pt-1 sm:pt-2">
            {loading ? (
              <LoadingSkeleton className="w-full h-full" />
            ) : outgoingChartType === 'bar' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={outgoingData}
                  margin={{
                    top: 10,
                    right: isMobile ? 6 : 14,
                    left: isMobile ? -14 : -6,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="barOutgoingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={isMobile ? 10 : 11}
                    tickLine={false}
                    tickMargin={4}
                    tickFormatter={formatXAxisLabel}
                    interval={0}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={isMobile ? 10 : 11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={isMobile ? 26 : 34}
                  />
                  <Tooltip content={<CustomChartTooltip color="#6366f1" docTypeLabel="ເອກະສານຂາອອກ" />} />
                  <Bar
                    dataKey="count"
                    fill="url(#barOutgoingGrad)"
                    maxBarSize={getResponsiveBarSize(outgoingPeriod)}
                    radius={[6, 6, 2, 2]}
                    name="ເອກະສານຂາອອກ"
                    isAnimationActive={true}
                    animationDuration={500}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={outgoingData}
                  margin={{
                    top: 10,
                    right: isMobile ? 6 : 14,
                    left: isMobile ? -14 : -6,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="colorOutgoing" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={isMobile ? 10 : 11}
                    tickLine={false}
                    tickMargin={4}
                    tickFormatter={formatXAxisLabel}
                    interval={0}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={isMobile ? 10 : 11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={isMobile ? 26 : 34}
                  />
                  <Tooltip content={<CustomChartTooltip color="#6366f1" docTypeLabel="ເອກະສານຂາອອກ" />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={isMobile ? 2.5 : 3}
                    fillOpacity={1}
                    fill="url(#colorOutgoing)"
                    dot={{ r: isMobile ? 2.5 : 3.5, fill: '#6366f1', strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 5, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                    name="ເອກະສານຂາອອກ"
                    isAnimationActive={true}
                    animationDuration={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Chart 3: Tasks by Status (Donut Chart) */}
        <Card
          className="border-amber-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden min-w-0"
          headerClassName="bg-gradient-to-r from-amber-100/80 via-orange-50 to-amber-100/80 border-b border-amber-200/90"
          title={
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="p-2 bg-amber-500 text-white rounded-xl shadow-xs shadow-amber-500/30 shrink-0">
                <Activity className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-amber-950 truncate">
                  {t.dashboard.charts.tasksByStatus || 'ສະຖານະວຽກງານທັງໝົດ'}
                </h3>
                <p className="text-[10px] sm:text-xs text-amber-900/70 font-medium truncate">
                  ອັດຕາສ່ວນຄວາມຄືບໜ້າຂອງວຽກງານ
                </p>
              </div>
            </div>
          }
        >
          <div className="h-[250px] sm:h-[285px] lg:h-[320px] w-full flex items-center justify-center">
            {loading ? (
              <LoadingSkeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.charts.tasksByStatus || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 48 : 65}
                    outerRadius={isMobile ? 74 : 95}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="status"
                  >
                    {(stats?.charts.tasksByStatus || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: isMobile ? '10px' : '11px', paddingTop: '4px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Chart 4: Tasks by Department */}
        <Card
          className="border-emerald-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden min-w-0"
          headerClassName="bg-gradient-to-r from-emerald-100/80 via-teal-50 to-emerald-100/80 border-b border-emerald-200/90"
          title={
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs shadow-emerald-500/30 shrink-0">
                <Building className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-emerald-950 truncate">
                  {t.dashboard.charts.tasksByDept || 'ຈຳນວນວຽກງານແຕ່ລະພະແນກ'}
                </h3>
                <p className="text-[10px] sm:text-xs text-emerald-900/70 font-medium truncate">
                  ການແບ່ງປັນວຽກງານຕາມພະແນກການ
                </p>
              </div>
            </div>
          }
        >
          <div className="h-[250px] sm:h-[285px] lg:h-[320px] w-full pt-1 sm:pt-2">
            {loading ? (
              <LoadingSkeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.charts.tasksByDept || []}
                  layout="vertical"
                  margin={{
                    top: 8,
                    right: isMobile ? 14 : 24,
                    left: isMobile ? -10 : 2,
                    bottom: 4,
                  }}
                >
                  <defs>
                    <linearGradient id="barDeptGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    fontSize={isMobile ? 10 : 11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    dataKey="dept"
                    type="category"
                    stroke="#475569"
                    fontSize={isMobile ? 10 : 11}
                    tickLine={false}
                    axisLine={false}
                    width={isMobile ? 85 : 125}
                    tickFormatter={(dept: string) =>
                      isMobile && dept && dept.length > 8 ? dept.substring(0, 7) + '…' : dept
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl shadow-xl border border-slate-200/90 text-xs min-w-[130px]">
                            <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1">{data.dept}</div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500 font-medium">ຈຳນວນວຽກງານ:</span>
                              <span className="text-emerald-600 font-extrabold text-sm">{payload[0].value} ວຽກງານ</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#barDeptGrad)"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={isMobile ? 18 : 26}
                    name="ຈຳນວນວຽກງານ"
                    isAnimationActive={true}
                    animationDuration={500}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity Sections (Recent Documents & Tasks) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card
          title={t.dashboard.recent.recentDocs}
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/all-docs')}>
              <span>{t.dashboard.recent.viewAll}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          }
        >
          <div className="divide-y divide-slate-100 -my-2 text-xs">
            {stats?.recent.documents && stats.recent.documents.length > 0 ? (
              stats.recent.documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() =>
                    navigate(
                      doc.flowType === 'INCOMING'
                        ? `/incoming-docs?id=${doc.id}`
                        : `/outgoing-docs?id=${doc.id}`
                    )
                  }
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer rounded-lg px-2 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        {doc.documentNumber}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {doc.department?.nameLao}
                      </span>
                    </div>
                    <p className="font-medium text-slate-800 truncate">{doc.title}</p>
                  </div>
                  <StatusBadge status={doc.status} />
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-slate-400">ບໍ່ມີເອກະສານຫຼ້າສຸດ</p>
            )}
          </div>
        </Card>

        {/* Recent Tasks */}
        <Card
          title={t.dashboard.recent.recentTasks}
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/task-tracking')}>
              <span>{t.dashboard.recent.viewAll}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          }
        >
          <div className="divide-y divide-slate-100 -my-2 text-xs">
            {stats?.recent.tasks && stats.recent.tasks.length > 0 ? (
              stats.recent.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/task-tracking?id=${task.id}`)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer rounded-lg px-2 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {task.taskCode}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ມອບໝາຍໃຫ້: {task.assignedTo?.employee?.fullNameLao || 'Staff'}
                      </span>
                    </div>
                    <p className="font-medium text-slate-800 truncate">{task.title}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={task.status} />
                    <p className="text-[10px] text-slate-400 mt-1">{task.progress}% ສຳເລັດ</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-slate-400">ບໍ່ມີວຽກງານຫຼ້າສຸດ</p>
            )}
          </div>
        </Card>
      </div>

      {/* Modals for Quick Actions */}
      <DocumentFormModal
        isOpen={openIncomingModal}
        onClose={() => setOpenIncomingModal(false)}
        type="incoming"
        onSuccess={() => {
          fetchDashboardData();
          navigate('/incoming');
        }}
      />
      <DocumentFormModal
        isOpen={openOutgoingModal}
        onClose={() => setOpenOutgoingModal(false)}
        type="outgoing"
        onSuccess={() => {
          fetchDashboardData();
          navigate('/outgoing');
        }}
      />
      <TaskFormModal
        isOpen={openTaskModal}
        onClose={() => setOpenTaskModal(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};
