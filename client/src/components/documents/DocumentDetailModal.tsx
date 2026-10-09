import React, { useState } from 'react';
import {
  FileText,
  Paperclip,
  CheckSquare,
  GitBranch,
  MessageSquare,
  History,
  ShieldCheck,
  Download,
  Printer,
  User,
  Calendar,
  Building,
  Upload,
  Send,
  Plus,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StatusBadge, PriorityBadge } from '../ui/Badge';
import { DocumentTrackingSheet } from './DocumentTrackingSheet';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  onRefresh?: () => void;
  onAssignWork?: (doc: any) => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  isOpen,
  onClose,
  document,
  onRefresh,
  onAssignWork,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'attachments' | 'tasks' | 'workflow' | 'comments' | 'history' | 'tracking'
  >('overview');
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { user } = useAuth();

  if (!document) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const docId = document.documentId || document.id;
      await api.addDocumentComment(docId, newComment.trim());
      setNewComment('');
      if (onRefresh) onRefresh();
    } catch (e) {
      // ignore
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const docId = document.documentId || document.id;
      await api.uploadAttachment(docId, file);
      if (onRefresh) onRefresh();
    } catch (e) {
      // ignore
    }
  };

  const tabs = [
    { key: 'overview', label: 'ພາບລວມ', icon: FileText },
    { key: 'attachments', label: `ໄຟລ໌ຄັດຕິດ (${document.document?.attachments?.length || 0})`, icon: Paperclip },
    { key: 'tasks', label: `ວຽກງານ (${document.document?.tasks?.length || 0})`, icon: CheckSquare },
    { key: 'workflow', label: 'ຂັ້ນຕອນ (Workflow)', icon: GitBranch },
    { key: 'comments', label: `ຄຳເຫັນ (${document.document?.comments?.length || 0})`, icon: MessageSquare },
    { key: 'history', label: 'ປະຫວັດ', icon: History },
    { key: 'tracking', label: 'ໃບຕິດຕາມ (A4)', icon: Printer },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl">
      <div className="space-y-5">
        {/* Header with Document Number, Title, Status & Priority */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-extrabold text-blue-700 text-base">
                {document.incomingNumber || document.outgoingNumber || document.documentNumber}
              </span>
              <StatusBadge status={document.status || document.approvalStatus} />
              <PriorityBadge priority={document.priority} />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {document.subject || document.title}
            </h2>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {onAssignWork && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onAssignWork(document);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                ມອບໝາຍວຽກ
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setActiveTab('tracking')}>
              <Printer className="w-4 h-4 mr-1" />
              ໃບຕິດຕາມ
            </Button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-1.5 p-1.5 bg-gradient-to-r from-slate-100/90 via-sky-50/40 to-slate-100/90 rounded-2xl border border-slate-200/90 shadow-2xs overflow-x-auto text-xs font-semibold">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            
            // Eye-pleasing soft pastel colors per tab
            const tabColorMap: Record<string, string> = {
              overview: 'bg-sky-100/90 text-sky-800 border-sky-300 shadow-xs',
              attachments: 'bg-indigo-100/90 text-indigo-800 border-indigo-300 shadow-xs',
              tasks: 'bg-amber-100/90 text-amber-800 border-amber-300 shadow-xs',
              workflow: 'bg-emerald-100/90 text-emerald-800 border-emerald-300 shadow-xs',
              comments: 'bg-teal-100/90 text-teal-800 border-teal-300 shadow-xs',
              history: 'bg-purple-100/90 text-purple-800 border-purple-300 shadow-xs',
              tracking: 'bg-rose-100/90 text-rose-800 border-rose-300 shadow-xs',
            };

            const activeColor = tabColorMap[tab.key] || 'bg-white text-blue-700 border-blue-300 shadow-xs';

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
                  isActive
                    ? `${activeColor} font-bold scale-[1.02]`
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {/* 1. Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2.5">
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1">
                  ຂໍ້ມູນເອກະສານ
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium">ເລກທີຕົ້ນສະບັບ:</span>
                  <span className="col-span-2 font-semibold text-slate-800">
                    {document.originalDocNumber || document.docNumber || '-'}
                  </span>

                  <span className="text-slate-500 font-medium">ປະເພດເອກະສານ:</span>
                  <span className="col-span-2 font-medium text-slate-800">
                    {document.documentType?.nameLao || '-'}
                  </span>

                  <span className="text-slate-500 font-medium">ລົງວັນທີ:</span>
                  <span className="col-span-2 font-medium text-slate-800">
                    {document.docDate ? new Date(document.docDate).toLocaleDateString('lo-LA') : '-'}
                  </span>

                  <span className="text-slate-500 font-medium">ວັນທີຮັບ / ສົ່ງ:</span>
                  <span className="col-span-2 font-medium text-slate-800">
                    {document.receivedDate
                      ? new Date(document.receivedDate).toLocaleDateString('lo-LA')
                      : document.sendingDate
                      ? new Date(document.sendingDate).toLocaleDateString('lo-LA')
                      : '-'}
                  </span>

                  <span className="text-slate-500 font-medium">ກຳນົດເວລາ:</span>
                  <span className="col-span-2 font-medium text-red-600">
                    {document.dueDate ? new Date(document.dueDate).toLocaleDateString('lo-LA') : '-'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2.5">
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1">
                  ໜ່ວຍງານ ແລະ ຜູ້ຮັບຜິດຊອບ
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium">
                    {document.incomingNumber ? 'ໜ່ວຍງານສົ່ງ:' : 'ໜ່ວຍງານຮັບ:'}
                  </span>
                  <span className="col-span-2 font-semibold text-slate-800">
                    {document.senderOrg || document.recipientOrg || '-'}
                  </span>

                  <span className="text-slate-500 font-medium">
                    {document.incomingNumber ? 'ຜູ້ສົ່ງ / ລົງລາຍເຊັນ:' : 'ຜູ້ຮັບ:'}
                  </span>
                  <span className="col-span-2 font-medium text-slate-800">
                    {document.senderName || document.recipientName || '-'}
                  </span>

                  <span className="text-slate-500 font-medium">ພະແນກກ່ຽວຂ້ອງ:</span>
                  <span className="col-span-2 font-medium text-blue-700">
                    {document.department?.nameLao || '-'}
                  </span>

                  <span className="text-slate-500 font-medium">ຜູ້ຮັບຜິດຊອບ:</span>
                  <span className="col-span-2 font-medium text-slate-800">
                    {document.responsiblePerson || 'ຫົວໜ້າພະແນກ'}
                  </span>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800">ລາຍລະອຽດ / ເນື້ອໃນຫຍໍ້</h4>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {document.description || 'ບໍ່ມີລາຍລະອຽດເພີ່ມເຕີມ'}
                </p>
                {document.notes && (
                  <div className="mt-3 p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-800">
                    <span className="font-bold">ໝາຍເຫດ: </span>
                    {document.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Attachments Tab */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">
                  ໄຟລ໌ເອກະສານແນບ (PDF, DOCX, XLSX, ຮູບພາບ)
                </p>
                <label className="cursor-pointer inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  ອັບໂຫຼດໄຟລ໌ເພີ່ມ
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.zip"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {document.document?.attachments && document.document.attachments.length > 0 ? (
                  document.document.attachments.map((file: any) => (
                    <div
                      key={file.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:border-blue-400 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {file.originalName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {(file.fileSize / 1024).toFixed(1)} KB •{' '}
                            {new Date(file.createdAt).toLocaleDateString('lo-LA')}
                          </p>
                        </div>
                      </div>
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg shrink-0"
                        title="ດາວໂຫຼດ"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    ບໍ່ມີໄຟລ໌ຄັດຕິດໃນເອກະສານນີ້
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              {document.document?.tasks && document.document.tasks.length > 0 ? (
                document.document.tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {task.taskCode}
                        </span>
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                      </div>
                      <p className="font-semibold text-slate-900 text-sm">{task.title}</p>
                      <p className="text-slate-500 mt-1">
                        ມອບໝາຍໃຫ້:{' '}
                        <span className="font-medium text-slate-800">
                          {task.assignedTo?.employee?.fullNameLao || 'Staff'}
                        </span>{' '}
                        • ກຳນົດສົ່ງ:{' '}
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('lo-LA') : '-'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[11px] text-slate-500">ຄວາມຄືບໜ້າ</p>
                        <p className="font-bold text-slate-800">{task.progress}%</p>
                      </div>
                      <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  ຍັງບໍ່ມີວຽກງານທີ່ຜູກກັບເອກະສານນີ້
                </div>
              )}
            </div>
          )}

          {/* 4. Workflow Tab (Visual Timeline) */}
          {activeTab === 'workflow' && (
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 mb-4">
                ຂັ້ນຕອນການໄຫຼວຽນຂອງເອກະສານ (Workflow Timeline)
              </h4>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {document.document?.workflowHistory && document.document.workflowHistory.length > 0 ? (
                  document.document.workflowHistory.map((step: any, index: number) => (
                    <div key={index} className="relative text-xs">
                      {/* Timeline Dot */}
                      <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between text-slate-800 font-semibold mb-1">
                          <span className="text-blue-700 font-bold">{step.action}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(step.createdAt).toLocaleString('lo-LA')}
                          </span>
                        </div>
                        <p className="text-slate-700">
                          <span className="font-medium text-slate-900">{step.actorName}</span>{' '}
                          ({step.actorPosition})
                        </p>
                        {step.comment && (
                          <p className="mt-1.5 text-slate-600 bg-white p-2 rounded border border-slate-100 italic">
                            "{step.comment}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">ຍັງບໍ່ມີປະຫວັດການໄຫຼວຽນ</p>
                )}
              </div>
            </div>
          )}

          {/* 5. Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="ຂຽນຄຳເຫັນ ຫຼື ບັນທຶກກ່ຽວກັບເອກະສານນີ້..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                />
                <Button type="submit" size="sm" isLoading={isSubmittingComment}>
                  <Send className="w-3.5 h-3.5 mr-1" />
                  ສົ່ງ
                </Button>
              </form>

              {/* Comment List */}
              <div className="space-y-3">
                {document.document?.comments && document.document.comments.length > 0 ? (
                  document.document.comments.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span className="text-blue-700">
                          {c.user?.employee?.fullNameLao || c.user?.username || 'User'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(c.createdAt).toLocaleString('lo-LA')}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{c.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    ຍັງບໍ່ມີຄຳເຫັນເທື່ອ
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-2 text-xs">
              {document.document?.history && document.document.history.length > 0 ? (
                document.document.history.map((h: any) => (
                  <div
                    key={h.id}
                    className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{h.action}</p>
                      <p className="text-[11px] text-slate-500">
                        ໂດຍ: {h.userName || 'System'} {h.comment ? `• ${h.comment}` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(h.createdAt).toLocaleString('lo-LA')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  ຍັງບໍ່ມີປະຫວັດການແກ້ໄຂ
                </div>
              )}
            </div>
          )}

          {/* 7. Tracking Slip (A4 Printable) Tab */}
          {activeTab === 'tracking' && (
            <DocumentTrackingSheet document={document} onClose={() => setActiveTab('overview')} />
          )}
        </div>
      </div>
    </Modal>
  );
};
