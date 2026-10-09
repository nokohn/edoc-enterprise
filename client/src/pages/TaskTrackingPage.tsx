import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  List,
  Kanban,
  Plus,
  CheckSquare,
  Clock,
  User,
  Building,
  CheckCircle,
  FileSpreadsheet,
  MessageSquare,
  Send,
} from 'lucide-react';
import { api } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { Task, Department } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { KanbanBoard } from '../components/tasks/KanbanBoard';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { Modal } from '../components/ui/Modal';

export const TaskTrackingPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);

  // Task Form & Detail Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Comment inside task
  const [taskComment, setTaskComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks({
        search: search.trim() || undefined,
        departmentId: selectedDept || undefined,
        status: selectedStatus || undefined,
        priority: selectedPriority || undefined,
        limit: 100,
      });
      if (res.success && res.data) {
        setTasks(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getDepartments().then((res) => {
      if (res.success) setDepartments(res.data);
    });
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [search, selectedDept, selectedStatus, selectedPriority]);

  useEffect(() => {
    const taskId = searchParams.get('id');
    if (taskId) {
      api.getTaskById(taskId).then((res) => {
        if (res.success && res.data) {
          setSelectedTask(res.data);
          setDetailModalOpen(true);
        }
      });
    }
  }, [searchParams]);

  const handleUpdateStatus = async (status: string, progress?: number) => {
    if (!selectedTask) return;

    try {
      await api.updateTaskStatus(selectedTask.id, status, progress);
      Swal.fire({
        icon: 'success',
        title: 'ອັບເດດສະຖານະສຳເລັດ',
        timer: 1500,
        showConfirmButton: false,
      });
      fetchTasks();
      // refresh current task
      const updated = await api.getTaskById(selectedTask.id);
      if (updated.success) setSelectedTask(updated.data);
    } catch (e) {
      // ignore
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskComment.trim() || !selectedTask) return;

    setIsSubmittingComment(true);
    try {
      await api.addTaskComment(selectedTask.id, taskComment.trim());
      setTaskComment('');
      const updated = await api.getTaskById(selectedTask.id);
      if (updated.success) setSelectedTask(updated.data);
      fetchTasks();
    } catch (e) {
      // ignore
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const columns: Column<Task>[] = [
    {
      key: 'taskCode',
      header: 'ລະຫັດວຽກ',
      render: (item) => (
        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          {item.taskCode}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'ຫົວຂໍ້ວຽກງານ',
      render: (item) => (
        <div className="max-w-[320px]">
          <p className="font-semibold text-slate-900 truncate" title={item.title}>
            {item.title}
          </p>
          <p className="text-[11px] text-slate-500">
            {item.department?.nameLao}
          </p>
        </div>
      ),
    },
    {
      key: 'assignedTo',
      header: 'ມອບໝາຍໃຫ້',
      render: (item) => (
        <p className="font-medium text-slate-800">
          {item.assignedTo?.employee?.fullNameLao || item.assignedTo?.username || 'Staff'}
        </p>
      ),
    },
    {
      key: 'priority',
      header: 'ຄວາມຮີບດ່ວນ',
      render: (item) => <PriorityBadge priority={item.priority} />,
    },
    {
      key: 'status',
      header: 'ສະຖານະ',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'progress',
      header: 'ຄວາມຄືບໜ້າ',
      render: (item) => (
        <div className="w-24">
          <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
            <span>{item.progress}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                item.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'ກຳນົດສົ່ງ',
      render: (item) => (
        <span
          className={`text-xs ${
            item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'COMPLETED'
              ? 'text-red-600 font-bold'
              : 'text-slate-600'
          }`}
        >
          {item.dueDate ? new Date(item.dueDate).toLocaleDateString('lo-LA') : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Header & Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-sky-50/90 via-blue-50/60 to-purple-50/40 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-sky-200/70 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-white via-sky-50 to-purple-50 border-2 border-sky-300/80 shadow-md shadow-sky-500/15 flex items-center justify-center p-2 flex-shrink-0 group hover:scale-105 transition-all duration-300 overflow-hidden">
            <img
              src="/icons/task-tracking-icon.png?v=1"
              alt="Icon ຕິດຕາມ ແລະ ກວດກາວຽກງານ"
              className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.tasks.trackingTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              ຕິດຕາມຄວາມຄືບໜ້າ, ກວດກາ ແລະ ປະເມີນການປະຕິບັດວຽກງານ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle: Kanban vs List */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white/90 p-1 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'kanban'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <List className="w-4 h-4" />
              <span>List</span>
            </button>
          </div>

          <Button
            variant="primary"
            onClick={() => setTaskModalOpen(true)}
            className="text-[16px] font-semibold py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700/30 shadow-md shadow-blue-600/20"
          >
            <Plus className="w-5 h-5 mr-1 text-white" />
            ມອບໝາຍວຽກໃໝ່
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-gradient-to-r from-slate-50/90 via-sky-50/40 to-slate-50/90 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center gap-2.5 text-xs">
        <input
          type="text"
          placeholder="ຄົ້ນຫາລະຫັດວຽກ, ຫົວຂໍ້..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="py-1.5 px-3 rounded-lg border border-slate-300 min-w-[200px] focus:outline-none focus:border-blue-500"
        />

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
        >
          <option value="">ພະແນກ (ທັງໝົດ)</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nameLao}
            </option>
          ))}
        </select>

        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
        >
          <option value="">ຄວາມຮີບດ່ວນ (ທັງໝົດ)</option>
          <option value="NORMAL">ປົກກະຕິ</option>
          <option value="HIGH">ສູງ</option>
          <option value="URGENT">ຮີບດ່ວນ</option>
        </select>
      </div>

      {/* View: Kanban or List */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={tasks}
          onRefresh={fetchTasks}
          onTaskClick={(task) => {
            api.getTaskById(task.id).then((res) => {
              if (res.success && res.data) {
                setSelectedTask(res.data);
                setDetailModalOpen(true);
              }
            });
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={tasks}
          isLoading={loading}
          onRowClick={(task) => {
            api.getTaskById(task.id).then((res) => {
              if (res.success && res.data) {
                setSelectedTask(res.data);
                setDetailModalOpen(true);
              }
            });
          }}
        />
      )}

      {/* Task Creation Modal */}
      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSuccess={fetchTasks}
      />

      {/* Task Detail & Status Update Drawer/Modal */}
      {selectedTask && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`ລາຍລະອຽດວຽກງານ: ${selectedTask.taskCode}`}
          maxWidth="3xl"
        >
          <div className="space-y-5 text-xs sm:text-sm">
            {/* Title & Badges */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {selectedTask.taskCode}
                </span>
                <StatusBadge status={selectedTask.status} />
                <PriorityBadge priority={selectedTask.priority} />
              </div>
              <h2 className="text-base font-bold text-slate-900">{selectedTask.title}</h2>
            </div>

            {/* Quick Status & Progress Changer */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">ປ່ຽນສະຖານະວຽກງານ:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['ASSIGNED', 'IN_PROGRESS', 'REVIEWING', 'COMPLETED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        selectedTask.status === st
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {st === 'ASSIGNED'
                        ? 'ຮັບວຽກ'
                        : st === 'IN_PROGRESS'
                        ? 'ເລີ່ມດຳເນີນການ'
                        : st === 'REVIEWING'
                        ? 'ສົ່ງກວດກາ'
                        : 'ສຳເລັດສົມບູນ'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>ຄວາມຄືບໜ້າຕົວຈິງ:</span>
                  <span className="font-bold text-blue-600">{selectedTask.progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={selectedTask.progress}
                  onChange={(e) => handleUpdateStatus(selectedTask.status, Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>

            {/* Task Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <p>
                  <span className="text-slate-500 font-medium">ຜູ້ມອບໝາຍ:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {selectedTask.assignedBy?.employee?.fullNameLao || selectedTask.assignedBy?.username}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500 font-medium">ຜູ້ຮັບຜິດຊອບ:</span>{' '}
                  <span className="font-semibold text-blue-700">
                    {selectedTask.assignedTo?.employee?.fullNameLao || selectedTask.assignedTo?.username}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500 font-medium">ພະແນກ:</span>{' '}
                  <span className="font-medium text-slate-800">
                    {selectedTask.department?.nameLao}
                  </span>
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <p>
                  <span className="text-slate-500 font-medium">ວັນທີເລີ່ມ:</span>{' '}
                  <span className="font-medium text-slate-800">
                    {new Date(selectedTask.startDate).toLocaleDateString('lo-LA')}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500 font-medium">ກຳນົດສົ່ງ:</span>{' '}
                  <span className="font-medium text-red-600">
                    {selectedTask.dueDate
                      ? new Date(selectedTask.dueDate).toLocaleDateString('lo-LA')
                      : '-'}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500 font-medium">ວັນທີສຳເລັດ:</span>{' '}
                  <span className="font-medium text-emerald-600">
                    {selectedTask.completionDate
                      ? new Date(selectedTask.completionDate).toLocaleDateString('lo-LA')
                      : 'ຍັງບໍ່ສຳເລັດ'}
                  </span>
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1 text-xs">
              <h4 className="font-bold text-slate-800">ຄຳແນະນຳ / ຂອບເຂດວຽກ:</h4>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedTask.description || 'ບໍ່ມີຄຳແນະນຳເພີ່ມເຕີມ'}
              </p>
            </div>

            {/* Comments & Progress Reporting */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="font-bold text-slate-800 text-xs">
                ບັນທຶກຄວາມຄືບໜ້າ & ຄຳເຫັນ ({selectedTask.comments?.length || 0})
              </h4>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="ລາຍງານຄວາມຄືບໜ້າ ຫຼື ຕອບກັບວຽກງານນີ້..."
                  value={taskComment}
                  onChange={(e) => setTaskComment(e.target.value)}
                  className="flex-1 py-1.5 px-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500"
                />
                <Button type="submit" size="sm" isLoading={isSubmittingComment}>
                  <Send className="w-3.5 h-3.5 mr-1" />
                  ສົ່ງ
                </Button>
              </form>

              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedTask.comments && selectedTask.comments.length > 0 ? (
                  selectedTask.comments.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs space-y-0.5"
                    >
                      <div className="flex justify-between items-center text-slate-700 font-semibold">
                        <span>{c.user?.employee?.fullNameLao || c.user?.username}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(c.createdAt).toLocaleString('lo-LA')}
                        </span>
                      </div>
                      <p className="text-slate-600">{c.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">
                    ຍັງບໍ່ມີບັນທຶກຄວາມຄືບໜ້າເທື່ອ
                  </p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
