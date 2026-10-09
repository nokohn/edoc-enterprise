import React from 'react';
import { Task } from '../../types';
import { PriorityBadge } from '../ui/Badge';
import { Clock, CheckCircle2, ChevronRight, User, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import Swal from 'sweetalert2';

export interface KanbanBoardProps {
  tasks: Task[];
  onRefresh: () => void;
  onTaskClick: (task: Task) => void;
}

const COLUMNS = [
  { key: 'NEW', label: 'ໃໝ່ (New)', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { key: 'ASSIGNED', label: 'ມອບໝາຍແລ້ວ (Assigned)', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'IN_PROGRESS', label: 'ກຳລັງດຳເນີນ (In Progress)', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'WAITING', label: 'ລໍຖ້າ (Waiting)', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { key: 'REVIEWING', label: 'ກວດກາ (Review)', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'COMPLETED', label: 'ສຳເລັດສົມບູນ (Completed)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onRefresh, onTaskClick }) => {
  const handleMoveStatus = async (task: Task, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await api.updateTaskStatus(task.id, newStatus);
      onRefresh();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update task status',
      });
    }
  };

  const getNextStatus = (current: string): string | null => {
    switch (current) {
      case 'NEW':
        return 'ASSIGNED';
      case 'ASSIGNED':
        return 'IN_PROGRESS';
      case 'IN_PROGRESS':
        return 'REVIEWING';
      case 'REVIEWING':
        return 'COMPLETED';
      case 'WAITING':
        return 'IN_PROGRESS';
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => {
          if (col.key === 'REVIEWING') return t.status === 'REVIEWING' || t.status === 'REVIEW';
          return t.status === col.key;
        });

        return (
          <div
            key={col.key}
            className="w-72 sm:w-80 shrink-0 flex flex-col bg-slate-100/70 rounded-2xl p-3 border border-slate-200/80 shadow-2xs"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-1.5 mb-2.5">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${col.color}`}>
                {col.label}
              </span>
              <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                {colTasks.length}
              </span>
            </div>

            {/* Tasks Container */}
            <div className="flex-1 space-y-2.5 overflow-y-auto min-h-[400px]">
              {colTasks.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/40">
                  ບໍ່ມີລາຍການ
                </div>
              ) : (
                colTasks.map((task) => {
                  const nextStatus = getNextStatus(task.status);
                  const isOverdue =
                    task.dueDate &&
                    new Date(task.dueDate) < new Date() &&
                    task.status !== 'COMPLETED';

                  return (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          {task.taskCode}
                        </span>
                        <PriorityBadge priority={task.priority} />
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                        {task.title}
                      </h4>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {task.assignedTo?.employee?.fullNameLao || task.assignedTo?.username || 'Staff'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1 mb-3">
                        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                          <span>ຄວາມຄືບໜ້າ</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              task.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer: Due date & Next Step Action */}
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                        <div
                          className={`flex items-center gap-1 ${
                            isOverdue ? 'text-red-600 font-semibold' : 'text-slate-400'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString('lo-LA')
                              : 'ບໍ່ມີກຳນົດ'}
                          </span>
                        </div>

                        {nextStatus && (
                          <button
                            onClick={(e) => handleMoveStatus(task, nextStatus, e)}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="ຍ້າຍໄປຂັ້ນຕອນຕໍ່ໄປ"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
