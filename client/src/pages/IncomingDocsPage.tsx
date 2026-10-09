import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Plus,
  FileSpreadsheet,
  Printer,
  Eye,
  Edit,
  Trash2,
  Pin,
  Filter,
  Download,
  Paperclip,
  Database,
} from 'lucide-react';
import { api } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { IncomingDocument, Department, DocumentType } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { DocumentDetailModal } from '../components/documents/DocumentDetailModal';
import { DocumentFormModal } from '../components/documents/DocumentFormModal';
import { DocumentTrackingSheet } from '../components/documents/DocumentTrackingSheet';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { BackupRestoreModal } from '../components/common/BackupRestoreModal';
import { Modal } from '../components/ui/Modal';

export const IncomingDocsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [docs, setDocs] = useState<IncomingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [docForTask, setDocForTask] = useState<any>(null);
  const [backupModalOpen, setBackupModalOpen] = useState(false);

  const fetchDocs = async (
    targetPage = page,
    targetSearch = search,
    targetDept = selectedDept,
    targetStatus = selectedStatus,
    targetPriority = selectedPriority
  ) => {
    try {
      setLoading(true);
      const params: any = {
        page: targetPage,
        limit,
        search: targetSearch.trim() || undefined,
        departmentId: targetDept || undefined,
        status: targetStatus || undefined,
        priority: targetPriority || undefined,
      };

      const res = await api.getIncomingDocs(params);
      if (res.success && res.data) {
        setDocs(res.data);
        setTotal(res.pagination.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [deptRes, typeRes] = await Promise.all([
        api.getDepartments(),
        api.getDocumentTypes(),
      ]);
      if (deptRes.success) setDepartments(deptRes.data);
      if (typeRes.success) setDocTypes(typeRes.data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchDocs(page, search, selectedDept, selectedStatus, selectedPriority);
  }, [page, search, selectedDept, selectedStatus, selectedPriority]);

  // Handle URL query parameter ?id=...
  useEffect(() => {
    const docId = searchParams.get('id');
    if (docId) {
      api.getIncomingDocById(docId).then((res) => {
        if (res.success && res.data) {
          setSelectedDoc(res.data);
          setDetailModalOpen(true);
        }
      });
    }
  }, [searchParams]);

  const handleDelete = async (doc: IncomingDocument) => {
    const result = await Swal.fire({
      title: '⚠️ ຢືນຢັນການລຶບ?',
      text: `ທ່ານຕ້ອງການລຶບເອກະສານ "${doc.incomingNumber} - ${doc.subject}" ແທ້ບໍ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ລຶບຂໍ້ມູນ',
      cancelButtonText: 'ຍົກເລີກ',
    });

    if (result.isConfirmed) {
      try {
        await api.deleteIncomingDoc(doc.id);
        Swal.fire({
          icon: 'success',
          title: 'ລຶບຂໍ້ມູນສຳເລັດ',
          text: 'ເອກະສານໄດ້ຖືກລຶບອອກຈາກລະບົບຮຽບຮ້ອຍແລ້ວ',
          timer: 1500,
          showConfirmButton: false,
        });
        fetchDocs();
      } catch (e: any) {
        Swal.fire({
          icon: 'error',
          title: 'ເກີດຂໍ້ຜິດພາດ',
          text: e.message || 'ບໍ່ສາມາດລຶບເອກະສານໄດ້',
        });
      }
    }
  };

  const handleExportExcel = () => {
    window.open(api.getExcelExportUrl('incoming'), '_blank');
  };

  const columns: Column<IncomingDocument>[] = [
    {
      key: 'incomingNumber',
      header: 'ເລກທີຂາເຂົ້າ',
      render: (item) => (
        <div>
          <span className="font-bold text-blue-700 hover:underline">
            {item.incomingNumber}
          </span>
          {item.originalDocNumber && (
            <p className="text-[10px] text-slate-400">ຕົ້ນສະບັບ: {item.originalDocNumber}</p>
          )}
        </div>
      ),
    },
    {
      key: 'receivedDate',
      header: 'ວັນທີຮັບ',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-800">
            {new Date(item.receivedDate).toLocaleDateString('lo-LA')}
          </p>
          <p className="text-[10px] text-slate-400">{item.receivedTime || '08:30'}</p>
        </div>
      ),
    },
    {
      key: 'senderOrg',
      header: 'ໜ່ວຍງານສົ່ງ',
      render: (item) => (
        <div className="max-w-[160px] truncate" title={item.senderOrg}>
          <p className="font-semibold text-slate-800 truncate">{item.senderOrg}</p>
          {item.senderName && (
            <p className="text-[10px] text-slate-500 truncate">{item.senderName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'ຫົວຂໍ້ / ເນື້ອໃນຫຍໍ້',
      render: (item) => (
        <div className="max-w-[280px]">
          <p className="font-semibold text-slate-900 truncate" title={item.subject}>
            {item.subject}
          </p>
          <p className="text-[11px] text-slate-500">
            {item.documentType?.nameLao} • {item.department?.nameLao}
          </p>
        </div>
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
      key: 'attachment',
      header: 'ໄຟລ໌',
      align: 'center',
      render: (item) => {
        const hasAttachment =
          item.document?.attachments && item.document.attachments.length > 0;
        return hasAttachment ? (
          <a
            href={item.document?.attachments?.[0]?.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 inline-block text-blue-600 hover:bg-blue-50 rounded-lg"
            title="ດາວໂຫຼດໄຟລ໌"
            onClick={(e) => e.stopPropagation()}
          >
            <Paperclip className="w-4 h-4" />
          </a>
        ) : (
          <span className="text-slate-300">-</span>
        );
      },
    },
    {
      key: 'actions',
      header: 'ຈັດການ',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setSelectedDoc(item);
              setDetailModalOpen(true);
            }}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="ເບິ່ງລາຍລະອຽດ"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedDoc(item);
              setTrackingModalOpen(true);
            }}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="ໃບຕິດຕາມ (A4)"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setDocForTask(item);
              setTaskModalOpen(true);
            }}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="ມອບໝາຍວຽກ"
          >
            <Pin className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditingDoc(item);
              setFormModalOpen(true);
            }}
            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="ແກ້ໄຂ"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(item)}
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="ລຶບ"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-indigo-50/40 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-blue-200/70 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-100 via-sky-100 to-indigo-100 border-2 border-blue-300/80 shadow-md shadow-blue-500/15 flex items-center justify-center p-2.5 flex-shrink-0 group hover:scale-105 transition-all duration-300">
            <img
              src="/icons/incoming-doc-icon.png"
              alt="Icon ລາຍການເອກະສານຂາເຂົ້າ"
              className="w-full h-full object-contain filter contrast-125 drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.documents.incomingTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              ລົງທະບຽນ, ຕິດຕາມ ແລະ ຄຸ້ມຄອງເອກະສານຂາເຂົ້າຂອງອົງກອນ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setBackupModalOpen(true)}
            className="text-[16px] font-semibold py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700/30 shadow-md shadow-indigo-600/20"
          >
            <Database className="w-5 h-5 mr-1.5 text-white" />
            BackUp & Restore
          </Button>
          <Button
            variant="success"
            onClick={handleExportExcel}
            className="text-[16px] font-semibold py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700/30 shadow-md shadow-emerald-600/20"
          >
            <FileSpreadsheet className="w-5 h-5 mr-1.5 text-white" />
            ສົ່ງອອກ Excel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setEditingDoc(null);
              setFormModalOpen(true);
            }}
            className="text-[16px] font-bold py-2.5 px-5 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-5 h-5 mr-1.5" />
            {t.documents.addIncoming}
          </Button>
        </div>
      </div>

      {/* Main Table with Filters & Search */}
      <DataTable
        columns={columns}
        data={docs}
        isLoading={loading}
        searchPlaceholder={t.documents.searchDocs}
        searchValue={search}
        onSearchChange={setSearch}
        onRowClick={(item) => {
          setSelectedDoc(item);
          setDetailModalOpen(true);
        }}
        filterSlot={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">{t.documents.filterByDept} (ທັງໝົດ)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameLao}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">{t.documents.filterByStatus} (ທັງໝົດ)</option>
              <option value="NEW">ໃໝ່ (New)</option>
              <option value="REGISTERED">ລົງທະບຽນແລ້ວ (Registered)</option>
              <option value="REVIEWING">ກຳລັງກວດກາ (Reviewing)</option>
              <option value="ASSIGNED">ມອບໝາຍແລ້ວ (Assigned)</option>
              <option value="IN_PROGRESS">ກຳລັງດຳເນີນ (In Progress)</option>
              <option value="COMPLETED">ສຳເລັດ (Completed)</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">{t.documents.filterByPriority} (ທັງໝົດ)</option>
              <option value="NORMAL">🔹 ປົກກະຕິ (Normal)</option>
              <option value="HIGH">🔺 ສູງ (High)</option>
              <option value="URGENT">⚡ ຮີບດ່ວນ (Urgent)</option>
              <option value="URGENTEST">🚨 ຮີບດ່ວນທີ່ສຸດ (Most Urgent)</option>
            </select>
          </div>
        }
        pagination={{
          total,
          page,
          limit,
          onPageChange: setPage,
        }}
      />

      {/* Form Modal (Create / Edit) */}
      <DocumentFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        type="incoming"
        initialData={editingDoc}
        onSuccess={() => {
          if (!editingDoc) {
            setSearch('');
            setSelectedDept('');
            setSelectedStatus('');
            setSelectedPriority('');
            setPage(1);
            fetchDocs(1, '', '', '', '');
          } else {
            fetchDocs(page, search, selectedDept, selectedStatus, selectedPriority);
          }
        }}
      />

      {/* Detail Modal */}
      <DocumentDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        document={selectedDoc}
        onRefresh={fetchDocs}
        onAssignWork={(doc) => {
          setDocForTask(doc);
          setTaskModalOpen(true);
        }}
      />

      {/* Printable A4 Tracking Sheet Modal */}
      <Modal
        isOpen={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
        maxWidth="3xl"
      >
        <DocumentTrackingSheet
          document={selectedDoc}
          onClose={() => setTrackingModalOpen(false)}
        />
      </Modal>

      {/* Task Assignment Modal */}
      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        initialDocument={docForTask}
        onSuccess={fetchDocs}
      />

      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        scope="INCOMING"
        onSuccess={() => fetchDocs(page, search, selectedDept, selectedStatus, selectedPriority)}
      />
    </div>
  );
};
