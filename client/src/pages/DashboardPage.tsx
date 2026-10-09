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
} from 'lucide-react';
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

  const COLORS = ['#94a3b8', '#3b82f6', '#eab308', '#a855f7', '#22c55e', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                {t.dashboard.title}
              </h1>
              <div className="flex items-center gap-2.5 px-3 py-1 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-xs">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                </span>
                <span className="text-xl sm:text-2xl md:text-3xl font-black font-mono tracking-tight text-white">
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
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
        {/* Chart 1: Incoming Documents by Month */}
        <Card title={t.dashboard.charts.incomingByMonth}>
          <div className="h-72 w-full pt-2">
            {loading ? (
              <LoadingSkeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.charts.incomingByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                    name="ເອກະສານຂາເຂົ້າ"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Chart 2: Outgoing Documents by Month */}
        <Card title={t.dashboard.charts.outgoingByMonth}>
          <div className="h-72 w-full pt-2">
            {loading ? (
              <LoadingSkeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.charts.outgoingByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    name="ເອກະສານຂາອອກ"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Chart 3: Tasks by Status (Donut Chart) */}
        <Card title={t.dashboard.charts.tasksByStatus}>
          <div className="h-72 w-full flex items-center justify-center">
            {loading ? (
              <LoadingSkeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.charts.tasksByStatus || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
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
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Chart 4: Tasks by Department */}
        <Card title={t.dashboard.charts.tasksByDept}>
          <div className="h-72 w-full pt-2">
            {loading ? (
              <LoadingSkeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.charts.tasksByDept || []}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    dataKey="dept"
                    type="category"
                    stroke="#475569"
                    fontSize={11}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    radius={[0, 6, 6, 0]}
                    name="ຈຳນວນວຽກງານ"
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
