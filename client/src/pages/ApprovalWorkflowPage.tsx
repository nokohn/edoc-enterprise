import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Workflow,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Eye,
  Search,
  Filter,
  ArrowRight,
  ArrowDown,
  ShieldCheck,
  Building,
  UserCheck,
  AlertCircle,
  FileText,
  ChevronRight,
  Layers,
  History,
  Send,
  PenTool,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { DocumentTrackingSheet } from '../components/documents/DocumentTrackingSheet';
import { DocumentDetailModal } from '../components/documents/DocumentDetailModal';
import { SignaturePadModal } from '../components/common/SignaturePadModal';
import { InlineSignaturePad } from '../components/common/InlineSignaturePad';

export const ApprovalWorkflowPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'pending' | 'steps' | 'sheets' | 'history'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  
  // Selected doc for tracking sheet modal or detail modal
  const [selectedDocForSheet, setSelectedDocForSheet] = useState<any | null>(null);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<any | null>(null);

  // Approval Action with Digital Pen Signature
  const [approvalModalDoc, setApprovalModalDoc] = useState<any | null>(null);
  const [approvalComment, setApprovalComment] = useState('ເຫັນດີ ແລະ ອະນຸມັດ');
  const [approvalSignature, setApprovalSignature] = useState('');
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);

  // Reject Action Modal
  const [rejectModalDoc, setRejectModalDoc] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Clean Toast Notification (No SweetAlert)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Queries
  const { data: pendingData, isLoading: isPendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ['workflow-pending', selectedDept, selectedPriority],
    queryFn: () =>
      api.getPendingApprovals({
        departmentId: selectedDept || undefined,
        priority: selectedPriority || undefined,
      }),
  });

  const { data: stepsData, isLoading: isStepsLoading } = useQuery({
    queryKey: ['workflow-steps'],
    queryFn: () => api.getWorkflowSteps(),
  });

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['workflow-history'],
    queryFn: () => api.getWorkflowHistory(40),
  });

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.getDepartments(),
  });

  // Approval Mutation
  const approveMutation = useMutation({
    mutationFn: ({
      id,
      comment,
      stepName,
      signatureDataUrl,
    }: {
      id: string;
      comment?: string;
      stepName?: string;
      signatureDataUrl?: string;
    }) => api.approveWorkflowStep(id, comment, stepName, signatureDataUrl),
    onSuccess: (res) => {
      setToast({
        type: 'success',
        message: res.message || 'ເອກະສານໄດ້ຖືກອະນຸມັດ ແລະ ສົ່ງຕໍ່ຂັ້ນຕອນຖັດໄປແລ້ວ',
      });
      queryClient.invalidateQueries({ queryKey: ['workflow-pending'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-history'] });
      queryClient.invalidateQueries({ queryKey: ['outgoing-docs'] });
    },
    onError: (err: any) => {
      setToast({
        type: 'error',
        message: err.message || 'ເກີດຂໍ້ຜິດພາດໃນການອະນຸມັດ',
      });
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.rejectWorkflowStep(id, reason),
    onSuccess: () => {
      setToast({
        type: 'success',
        message: 'ເອກະສານຖືກສົ່ງກັບຄືນຫາຜູ້ຮ່າງເພື່ອປັບປຸງແກ້ໄຂຮຽບຮ້ອຍ',
      });
      queryClient.invalidateQueries({ queryKey: ['workflow-pending'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-history'] });
      queryClient.invalidateQueries({ queryKey: ['outgoing-docs'] });
    },
    onError: (err: any) => {
      setToast({
        type: 'error',
        message: err.message || 'ເກີດຂໍ້ຜິດພາດໃນການສົ່ງກັບຄືນ',
      });
    },
  });

  // Action handlers
  const handleApprove = (doc: any) => {
    setApprovalModalDoc(doc);
    setApprovalComment('ເຫັນດີ ແລະ ອະນຸມັດຕາມສະເໜີ');
    setApprovalSignature('');
  };

  const handleConfirmApproval = () => {
    if (!approvalModalDoc) return;
    const currentStepText = getStepInfo(approvalModalDoc.approvalStatus).title;
    approveMutation.mutate({
      id: approvalModalDoc.id,
      comment: approvalComment || 'ເຫັນດີ ແລະ ອະນຸມັດ',
      stepName: currentStepText,
      signatureDataUrl: approvalSignature || undefined,
    });
    setApprovalModalDoc(null);
  };

  const handleReject = (doc: any) => {
    setRejectModalDoc(doc);
    setRejectReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectModalDoc || !rejectReason.trim()) return;
    rejectMutation.mutate({ id: rejectModalDoc.id, reason: rejectReason.trim() });
    setRejectModalDoc(null);
  };

  // Helper for workflow steps status mapping
  const getStepInfo = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { step: 1, title: 'ຜູ້ຄົ້ນຄວ້າ / ສ້າງຮ່າງ', color: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'REVIEW':
        return { step: 2, title: 'ຄຳເຫັນຂອງຄະນະໜ່ວຍງານ', color: 'bg-amber-50 text-amber-800 border-amber-300' };
      case 'DEPT_APPROVAL':
        return { step: 3, title: 'ຄຳເຫັນຂອງຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ', color: 'bg-blue-50 text-blue-800 border-blue-300' };
      case 'MANAGEMENT_APPROVAL':
        return { step: 4, title: 'ຄຳເຫັນຂອງຫົວໜ້າພະແນກ', color: 'bg-indigo-50 text-indigo-800 border-indigo-300' };
      case 'DIRECTOR_APPROVAL':
        return { step: 5, title: 'ຄຳເຫັນຂອງ ຮອງ ຜອ / ຜອ', color: 'bg-purple-50 text-purple-800 border-purple-300' };
      case 'APPROVED':
        return { step: 6, title: 'ອະນຸມັດຮຽບຮ້ອຍແລ້ວ', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
      case 'REJECTED':
        return { step: 0, title: 'ສົ່ງກັບຄືນແກ້ໄຂ', color: 'bg-rose-50 text-rose-800 border-rose-300' };
      default:
        return { step: 1, title: status, color: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  const stats = pendingData?.data?.stats || {
    totalPending: 0,
    incomingPending: 0,
    draftCount: 0,
    unitReviewCount: 0,
    deptApprovalCount: 0,
    managementCount: 0,
    directorApprovalCount: 0,
    urgentCount: 0,
  };

  const pendingOutgoing = (pendingData?.data?.outgoing || []).filter((doc: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.outgoingNumber?.toLowerCase().includes(q) ||
      doc.subject?.toLowerCase().includes(q) ||
      doc.recipientOrg?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-sky-50/40 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-emerald-200/70 shadow-xs">
        <div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-100 via-teal-100 to-sky-100 border-2 border-emerald-300/80 shadow-md shadow-emerald-500/15 flex items-center justify-center p-1.5 flex-shrink-0 group hover:scale-105 transition-all duration-300 overflow-hidden">
              <img
                src="/icons/workflow-approved-icon.png"
                alt="Icon ຂັ້ນຕອນອະນຸມັດ (Approval Workflow)"
                className="w-full h-full object-contain rounded-xl drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                ຂັ້ນຕອນອະນຸມັດ (Approval Workflow)
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                ສາຍງານການກວດກາ, ໃຫ້ຄຳເຫັນ ແລະ ອະນຸມັດເອກະສານ ຕາມໃບຕິດຕາມ ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LHSE)
              </p>
            </div>
          </div>
        </div>

        {/* Quick Tabs in Header */}
        <div className="flex items-center gap-1.5 p-1.5 bg-gradient-to-r from-slate-100/90 via-sky-50/40 to-slate-100/90 rounded-2xl border border-slate-200/90 shadow-2xs text-xs font-medium">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all border ${
              activeTab === 'pending'
                ? 'bg-amber-100/90 text-amber-900 border-amber-300 font-bold shadow-xs scale-[1.02]'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            ລໍຖ້າອະນຸມັດ ({stats.totalPending})
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all border ${
              activeTab === 'steps'
                ? 'bg-sky-100/90 text-sky-900 border-sky-300 font-bold shadow-xs scale-[1.02]'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            ໂຄງສ້າງຂັ້ນຕອນ
          </button>
          <button
            onClick={() => setActiveTab('sheets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all border ${
              activeTab === 'sheets'
                ? 'bg-emerald-100/90 text-emerald-900 border-emerald-300 font-bold shadow-xs scale-[1.02]'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            ໃບຕິດຕາມ LHSE
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all border ${
              activeTab === 'history'
                ? 'bg-purple-100/90 text-purple-900 border-purple-300 font-bold shadow-xs scale-[1.02]'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <History className="w-3.5 h-3.5 text-purple-600" />
            ປະຫວັດການອະນຸມັດ
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-gradient-to-br from-blue-500/10 via-sky-50 to-blue-100/70 p-3.5 rounded-xl border border-blue-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <span className="text-[11px] font-bold text-blue-900">ລໍຖ້າທັງໝົດ</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-blue-700">{stats.totalPending}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold tracking-wide shadow-2xs">
              Active
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-200/60 via-slate-50 to-zinc-100/80 p-3.5 rounded-xl border border-slate-300/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-800">1. ຄົ້ນຄວ້າ/ສ້າງຮ່າງ</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-700">{stats.draftCount}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-600 text-white font-bold tracking-wide shadow-2xs">
              DRAFT
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/15 via-amber-50 to-orange-100/70 p-3.5 rounded-xl border border-amber-300/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <span className="text-[11px] font-bold text-amber-900">2. ຄະນະໜ່ວຍງານ</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-700">{stats.unitReviewCount}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold tracking-wide shadow-2xs">
              Review
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500/15 via-cyan-50 to-teal-100/70 p-3.5 rounded-xl border border-cyan-300/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <span className="text-[11px] font-bold text-cyan-900">3. ຮອງຫົວໜ້າພະແນກ</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-cyan-700">{stats.deptApprovalCount}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-600 text-white font-bold tracking-wide shadow-2xs">
              Endorse
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500/15 via-indigo-50 to-violet-100/70 p-3.5 rounded-xl border border-indigo-300/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <span className="text-[11px] font-bold text-indigo-900">4. ຫົວໜ້າພະແນກ</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-indigo-700">{stats.managementCount}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold tracking-wide shadow-2xs">
              Dept
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/15 via-purple-50 to-fuchsia-100/70 p-3.5 rounded-xl border border-purple-300/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <span className="text-[11px] font-bold text-purple-900">5. ຮອງ ຜອ / ຜອ</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-purple-700">{stats.directorApprovalCount}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold tracking-wide shadow-2xs">
              Sign
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PENDING APPROVALS LIST */}
      {/* ======================================================== */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-gradient-to-r from-slate-50/90 via-sky-50/40 to-slate-50/90 p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ຄົ້ນຫາເລກທີຂາອອກ, ເລື່ອງ, ໜ່ວຍງານສົ່ງ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
              >
                <option value="">-- ທຸກພະແນກ --</option>
                {deptsData?.data?.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.nameLao}
                  </option>
                ))}
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
              >
                <option value="">-- ທຸກລະດັບ --</option>
                <option value="URGENT">ດ່ວນ (Urgent)</option>
                <option value="HIGH">ສູງ (High)</option>
                <option value="NORMAL">ທຳມະດາ (Normal)</option>
              </select>
            </div>
          </div>

          {/* Pending Table / Cards */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200/90 bg-gradient-to-r from-sky-50/80 via-blue-50/40 to-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                ລາຍການເອກະສານທີ່ກຳລັງຢູ່ໃນຂັ້ນຕອນການອະນຸມັດ ({pendingOutgoing.length})
              </h3>
            </div>

            {isPendingLoading ? (
              <div className="p-12 text-center text-xs text-slate-500">
                ກຳລັງໂຫຼດຂໍ້ມູນການອະນຸມັດ...
              </div>
            ) : pendingOutgoing.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-semibold text-slate-600">ບໍ່ມີເອກະສານທີ່ຄ້າງລໍຖ້າອະນຸມັດໃນຂະນະນີ້</p>
                <p className="text-[11px] text-slate-400">ເອກະສານທັງໝົດໄດ້ຮັບການກວດກາ ແລະ ອະນຸມັດຮຽບຮ້ອຍແລ້ວ</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingOutgoing.map((doc: any) => {
                  const stepInfo = getStepInfo(doc.approvalStatus);
                  const isUrgentDoc = doc.priority === 'URGENT' || doc.priority === 'HIGH';

                  return (
                    <div
                      key={doc.id}
                      className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                    >
                      {/* Left: Doc Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {doc.outgoingNumber}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              isUrgentDoc
                                ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {isUrgentDoc ? '⚡ ດ່ວນ' : '🔹 ທຳມະດາ'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ພະແນກ: <strong className="text-slate-700">{doc.department?.nameLao}</strong>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            • {new Date(doc.createdAt).toLocaleDateString('lo-LA')}
                          </span>
                        </div>

                        <h4
                          onClick={() => setSelectedDocForDetail(doc)}
                          className="font-bold text-sm text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-1"
                        >
                          {doc.subject}
                        </h4>

                        <p className="text-xs text-slate-500 line-clamp-1">
                          ສົ່ງເຖິງ: <span className="text-slate-700 font-medium">{doc.recipientOrg}</span>
                          {doc.description ? ` — ${doc.description}` : ''}
                        </p>

                        {/* Visual Workflow Steps Bar */}
                        <div className="pt-2 flex items-center gap-1.5 text-[11px]">
                          <span className="text-slate-400 font-medium">ຂັ້ນຕອນ:</span>
                          <div className="flex items-center gap-1">
                            {[
                              { s: 1, label: 'ຜູ້ຮ່າງ' },
                              { s: 2, label: 'ໜ່ວຍງານ' },
                              { s: 3, label: 'ຮອງພະແນກ' },
                              { s: 4, label: 'ຫົວໜ້າພະແນກ' },
                              { s: 5, label: 'ຮອງ ຜອ / ຜອ' },
                            ].map((st) => {
                              const isPassed = stepInfo.step > st.s;
                              const isCurrent = stepInfo.step === st.s;
                              return (
                                <React.Fragment key={st.s}>
                                  <span
                                    title={st.label}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                                      isCurrent
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : isPassed
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}
                                  >
                                    {isPassed && <CheckCircle2 className="w-2.5 h-2.5" />}
                                    {st.label}
                                  </span>
                                  {st.s < 5 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Print Tracking Sheet */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDocForSheet(doc)}
                          className="text-xs"
                          title="ພິມໃບຕິດຕາມເອກະສານ A4 ຕາມແບບຟອມ LHSE"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1 text-slate-600" />
                          ໃບຕິດຕາມ
                        </Button>

                        {/* View Full Doc */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDocForDetail(doc)}
                          className="text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-600" />
                          ລາຍລະອຽດ
                        </Button>

                        {/* Reject / Send back */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(doc)}
                          className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          ສົ່ງກັບຄືນ
                        </Button>

                        {/* Approve */}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprove(doc)}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          ອະນຸມັດ / ໃຫ້ຄຳເຫັນ
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: WORKFLOW STEPS PIPELINE (LHSE OFFICIAL 5 STEPS) */}
      {/* ======================================================== */}
      {activeTab === 'steps' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="max-w-2xl">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-blue-600" />
                  ໂຄງສ້າງ 5 ຂັ້ນຕອນການອະນຸມັດເອກະສານ (LHSE Approval Pipeline)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ອີງຕາມໃບຕິດຕາມເອກະສານຂອງ ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LHSE), ການອະນຸມັດເອກະສານຂາອອກຕ້ອງຜ່ານຂັ້ນຕອນຕາມລຳດັບ:
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200 font-medium shrink-0 self-start md:self-auto">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                ລຳດັບຂັ້ນຕອນ 1 ➔ 5 ແບບ Progress Flow
              </span>
            </div>

            {/* Horizontal Arrow Progress Ribbon */}
            <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl text-white shadow-md border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  ແຜນວາດຂັ້ນຕອນການອະນຸມັດ (Approval Flow Progress Tracker)
                </span>
                <span className="text-[11px] bg-blue-500/20 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  5 ຂັ້ນຕອນຕໍ່ເນື່ອງ
                </span>
              </div>

              {/* Step Process Bar with Directional Chevrons / Arrows */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
                {[
                  { num: 1, title: 'ຜູ້ສ້າງຮ່າງ', en: 'Staff' },
                  { num: 2, title: 'ຄະນະໜ່ວຍງານ', en: 'Unit Head' },
                  { num: 3, title: 'ຮອງຫົວໜ້າພະແນກ', en: 'Deputy Dept' },
                  { num: 4, title: 'ຫົວໜ້າພະແນກ', en: 'Dept Head' },
                  { num: 5, title: 'ຮອງ ຜອ / ຜອ', en: 'Director' },
                ].map((item, index) => (
                  <div
                    key={item.num}
                    className="flex items-center justify-between bg-white/10 hover:bg-white/15 transition-all p-2.5 rounded-xl border border-white/10 text-white relative group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-blue-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {item.num}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{item.title}</p>
                        <p className="text-[10px] text-blue-200/70 truncate">{item.en}</p>
                      </div>
                    </div>
                    {index < 4 && (
                      <ArrowRight className="hidden sm:block w-4 h-4 text-blue-400/70 shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Pipeline Cards with Prominent Directional Arrows */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative">
              {[
                {
                  order: 1,
                  badge: 'ຂັ້ນຕອນທີ 1',
                  title: '1. ຜູ້ຄົ້ນຄວ້າ / ສ້າງຮ່າງ',
                  role: 'Officer / Staff (ພະນັກງານວິຊາການ)',
                  desc: 'ຮ່າງເນື້ອໃນເອກະສານ, ແນບຟາຍ, ແລະ ສົ່ງເຂົ້າສູ່ລະບົບ',
                  actionTag: '📝 ສ້າງຮ່າງ • ແນບເອກະສານ',
                  icon: FileText,
                  theme: {
                    border: 'border-slate-300 hover:border-slate-400',
                    bg: 'bg-white',
                    headerBg: 'bg-slate-50',
                    numBg: 'bg-slate-800 text-white',
                    tagBg: 'bg-slate-100 text-slate-700 border-slate-200',
                    arrowRing: 'ring-slate-300',
                  },
                },
                {
                  order: 2,
                  badge: 'ຂັ້ນຕອນທີ 2',
                  title: '2. ຄະນະໜ່ວຍງານ',
                  role: 'Unit Head (ຫົວໜ້າໜ່ວຍງານ)',
                  desc: 'ກວດກາຄວາມຖືກຕ້ອງຂອງເນື້ອໃນ ແລະ ໃຫ້ຄຳເຫັນຂັ້ນຕົ້ນ',
                  actionTag: '✍️ ກວດກາ • ໃຫ້ຄຳເຫັນ',
                  icon: UserCheck,
                  theme: {
                    border: 'border-amber-300 hover:border-amber-400',
                    bg: 'bg-white',
                    headerBg: 'bg-amber-50/70',
                    numBg: 'bg-amber-600 text-white',
                    tagBg: 'bg-amber-50 text-amber-800 border-amber-200',
                    arrowRing: 'ring-amber-300',
                  },
                },
                {
                  order: 3,
                  badge: 'ຂັ້ນຕອນທີ 3',
                  title: '3. ຮອງຫົວໜ້າພະແນກ',
                  role: 'Deputy Dept Head (ຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ)',
                  desc: 'ກັ່ນຕອງເນື້ອໃນດ້ານວິຊາການ ແລະ ໃຫ້ທິດຊີ້ນຳ',
                  actionTag: '✍️ ກັ່ນຕອງ • ທິດຊີ້ນຳ',
                  icon: Building,
                  theme: {
                    border: 'border-blue-300 hover:border-blue-400',
                    bg: 'bg-white',
                    headerBg: 'bg-blue-50/70',
                    numBg: 'bg-blue-600 text-white',
                    tagBg: 'bg-blue-50 text-blue-800 border-blue-200',
                    arrowRing: 'ring-blue-300',
                  },
                },
                {
                  order: 4,
                  badge: 'ຂັ້ນຕອນທີ 4',
                  title: '4. ຫົວໜ້າພະແນກ',
                  role: 'Department Head (ຫົວໜ້າພະແນກ)',
                  desc: 'ກວດກາ, ຮັບຮອງ ແລະ ສະເໜີຂຶ້ນຫາຄະນະຜູ້ອຳນວຍການ',
                  actionTag: '✍️ ຮັບຮອງ • 🔴 ກາປະທັບພະແນກ',
                  icon: ShieldCheck,
                  theme: {
                    border: 'border-indigo-300 hover:border-indigo-400',
                    bg: 'bg-white',
                    headerBg: 'bg-indigo-50/70',
                    numBg: 'bg-indigo-600 text-white',
                    tagBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                    arrowRing: 'ring-indigo-300',
                  },
                },
                {
                  order: 5,
                  badge: 'ຂັ້ນຕອນທີ 5',
                  title: '5. ຮອງ ຜອ / ຜອ',
                  role: 'Director / Deputy Director (ຜູ້ອຳນວຍການ)',
                  desc: 'ພິຈາລະນາອະນຸມັດສຸດທ້າຍ, ລົງນາມ ແລະ ອະນຸຍາດຈໍລະຈອນ',
                  actionTag: '✍️ ລົງນາມ • 🔴 ກາປະທັບ LHSE',
                  icon: CheckCircle2,
                  theme: {
                    border: 'border-purple-300 hover:border-purple-400',
                    bg: 'bg-white',
                    headerBg: 'bg-purple-50/70',
                    numBg: 'bg-purple-600 text-white',
                    tagBg: 'bg-purple-50 text-purple-800 border-purple-200',
                    arrowRing: 'ring-purple-300',
                  },
                },
              ].map((step, idx) => {
                const Icon = step.icon;
                return (
                  <React.Fragment key={step.order}>
                    <div
                      className={`p-4 rounded-2xl border-2 ${step.theme.border} ${step.theme.bg} flex flex-col justify-between relative shadow-xs hover:shadow-md transition-all duration-200 group`}
                    >
                      <div>
                        {/* Top Step Badge & Icon */}
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                          <span className={`w-7 h-7 rounded-xl ${step.theme.numBg} font-black text-xs flex items-center justify-center shadow-xs`}>
                            {step.order}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            {step.badge}
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                            <Icon className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Title & Role */}
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                          {step.title}
                        </h4>
                        <p className="text-[11px] font-semibold text-blue-700 mt-1">
                          {step.role}
                        </p>

                        {/* Description */}
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-slate-600 text-[11px] leading-relaxed">
                          {step.desc}
                        </div>
                      </div>

                      {/* Bottom Deliverables Tag */}
                      <div className="mt-4 pt-2.5 border-t border-slate-100">
                        <span className={`inline-block w-full text-center px-2 py-1 rounded-lg text-[10px] font-semibold border ${step.theme.tagBg}`}>
                          {step.actionTag}
                        </span>
                      </div>

                      {/* Directional Arrow between cards (Desktop) */}
                      {idx < 4 && (
                        <div className="hidden lg:flex items-center justify-center absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white shadow-md flex items-center justify-center border-2 border-white ring-2 ring-blue-100 group-hover:scale-110 transition-transform">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Directional Arrow between cards (Mobile Stack) */}
                    {idx < 4 && (
                      <div className="lg:hidden flex items-center justify-center py-1">
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white shadow-xs flex items-center justify-center border-2 border-white">
                          <ArrowDown className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: LHSE ROUTING SLIPS TEMPLATES */}
      {/* ======================================================== */}
      {activeTab === 'sheets' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              ຕົວຢ່າງແບບຟອມໃບຕິດຕາມເອກະສານ ມາດຕະຖານ LHSE (Routing Slip Templates)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              ທ່ານສາມາດກົດພິມ (Print A4) ເພື່ອນຳໄປໃຊ້ງານຕົວຈິງ ຫຼື ໃຊ້ເປັນແບບຟອມຕິດຕາມເອກະສານທາງການ
            </p>

            {/* Embedded Live Sheet Component */}
            <DocumentTrackingSheet
              document={{
                incomingNumber: '',
                outgoingNumber: '',
                docNumber: '',
                docDate: '',
                receivedDate: '',
                subject: '',
                priority: 'NORMAL',
                confidentialLevel: 'NORMAL',
                department: { nameLao: 'ພະແນກພັດທະນາ' },
                recipientOrg: '',
                recipientName: '',
                responsible: { fullNameLao: '' },
                document: {
                  workflowHistory: [],
                },
              }}
              defaultType="outgoing"
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: APPROVAL AUDIT LOGS & TIMELINE */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-800">
              ປະຫວັດການອະນຸມັດ ແລະ ໃຫ້ທິດຊີ້ນຳ (Approval Audit Trail)
            </h3>
            <p className="text-xs text-slate-500">
              ບັນທຶກທຸກການດຳເນີນງານ, ຄຳເຫັນ, ລາຍເຊັນ ແລະ ວັນເວລາ ທີ່ມີການອະນຸມັດເອກະສານ
            </p>
          </div>

          {isHistoryLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">ກຳລັງໂຫຼດປະຫວັດ...</div>
          ) : !historyData?.data || historyData.data.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">ຍັງບໍ່ມີປະຫວັດການອະນຸມັດ</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {historyData.data.map((item: any) => (
                <div key={item.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                      item.decision === 'APPROVE'
                        ? 'bg-emerald-500'
                        : item.decision === 'REJECT'
                        ? 'bg-rose-500'
                        : 'bg-blue-500'
                    }`}
                  >
                    {item.decision === 'APPROVE' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : item.decision === 'REJECT' ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">
                        {item.actorName}{' '}
                        <span className="text-[11px] font-normal text-slate-500">
                          ({item.actorPosition || 'ຜູ້ອະນຸມັດ'})
                        </span>
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(item.createdAt).toLocaleString('lo-LA')}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-blue-700">{item.action}</p>

                    {item.comment && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 italic">
                        "{item.comment}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal for Tracking Sheet */}
      {selectedDocForSheet && (
        <Modal
          isOpen={Boolean(selectedDocForSheet)}
          onClose={() => setSelectedDocForSheet(null)}
          title="ໃບຕິດຕາມເອກະສານ LHSE (A4 Printable Routing Slip)"
          maxWidth="4xl"
        >
          <DocumentTrackingSheet
            document={selectedDocForSheet}
            onClose={() => setSelectedDocForSheet(null)}
            defaultType="outgoing"
          />
        </Modal>
      )}

      {/* Modal for Document Detail */}
      {selectedDocForDetail && (
        <DocumentDetailModal
          isOpen={Boolean(selectedDocForDetail)}
          onClose={() => setSelectedDocForDetail(null)}
          document={selectedDocForDetail}
          onRefresh={refetchPending}
        />
      )}

      {/* Modal for Approval Action with Digital Pen Signature */}
      {approvalModalDoc && (
        <Modal
          isOpen={Boolean(approvalModalDoc)}
          onClose={() => setApprovalModalDoc(null)}
          title="ຢືນຢັນການອະນຸມັດ / ໃຫ້ຄຳເຫັນ ແລະ ລົງລາຍເຊັນ"
          maxWidth="lg"
        >
          <div className="space-y-4">
            {/* Document summary box */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">ເລກທີເອກະສານ:</span>
                <span className="font-bold text-blue-700 font-mono">
                  {approvalModalDoc.outgoingNumber || approvalModalDoc.docNumber || '—'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-slate-700 whitespace-nowrap">ເລື່ອງ:</span>
                <span className="text-slate-900 text-right font-medium">
                  {approvalModalDoc.subject || approvalModalDoc.title}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="font-bold text-slate-700">ຂັ້ນຕອນປັດຈຸບັນ:</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                  {getStepInfo(approvalModalDoc.approvalStatus).title}
                </span>
              </div>
            </div>

            {/* Comment Area */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                ຄຳເຫັນ / ທິດຊີ້ນຳການອະນຸມັດ:
              </label>
              <textarea
                rows={3}
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="ພິມຄຳເຫັນ ຫຼື ທິດຊີ້ນຳ..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>

            {/* Online Visible Signature Drawing Canvas Box */}
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
              <InlineSignaturePad
                label={`✍️ ຊ່ອງລົງລາຍເຊັນດ້ວຍປາກກາອອນລາຍ (${user?.fullNameLao || 'ຜູ້ອະນຸມັດ'}):`}
                value={approvalSignature}
                onChange={(dataUrl) => setApprovalSignature(dataUrl)}
                height={125}
                onExpandModal={() => setIsSignaturePadOpen(true)}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setApprovalModalDoc(null)}>
                ຍົກເລີກ
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmApproval}
                isLoading={approveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                ຢືນຢັນການອະນຸມັດ (Approve)
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Reason Modal (Replaces SweetAlert) */}
      {rejectModalDoc && (
        <Modal
          isOpen={Boolean(rejectModalDoc)}
          onClose={() => setRejectModalDoc(null)}
          title="ປະຕິເສດ / ສົ່ງກັບຄືນໃຫ້ແກ້ໄຂ"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
              <p>
                <strong>ເອກະສານ:</strong> {rejectModalDoc.outgoingNumber || rejectModalDoc.subject}
              </p>
              <p className="text-[11px] text-rose-700">
                ເອກະສານຈະຖືກສົ່ງກັບຄືນຫາຜູ້ສ້າງຮ່າງ ແລະ ປ່ຽນສະຖານະເປັນ "ສົ່ງກັບຄືນແກ້ໄຂ (REJECTED)"
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                ກະລຸນາລະບຸເຫດຜົນໃນການປະຕິເສດ ຫຼື ສິ່ງທີ່ຕ້ອງແກ້ໄຂ <span className="text-red-500">*</span>:
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="ພິມເຫດຜົນຢ່າງລະອຽດ ເພື່ອໃຫ້ຜູ້ສ້າງຮ່າງປັບປຸງ..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-rose-500 shadow-2xs"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setRejectModalDoc(null)}>
                ຍົກເລີກ
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim()}
                isLoading={rejectMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                ຢືນຢັນສົ່ງກັບຄືນ
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Signature Pad Modal for Approval Action */}
      {isSignaturePadOpen && (
        <SignaturePadModal
          isOpen={isSignaturePadOpen}
          onClose={() => setIsSignaturePadOpen(false)}
          title="ເຊັນລາຍເຊັນອອນລາຍ (Digital Signature Pad)"
          signerName={user?.fullNameLao || 'ຜູ້ອະນຸມັດ'}
          initialSignature={approvalSignature}
          onSave={(dataUrl) => {
            setApprovalSignature(dataUrl);
            setIsSignaturePadOpen(false);
          }}
        />
      )}

      {/* Floating Modern Toast Notification (No SweetAlert) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20'
                : 'bg-rose-600 text-white border-rose-500 shadow-rose-900/20'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
