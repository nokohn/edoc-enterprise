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
  CheckCircle,
  XCircle,
  Send,
  Paperclip,
  Database,
} from 'lucide-react';
import { api } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { OutgoingDocument, Department } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { DocumentDetailModal } from '../components/documents/DocumentDetailModal';
import { DocumentFormModal } from '../components/documents/DocumentFormModal';
import { DocumentTrackingSheet } from '../components/documents/DocumentTrackingSheet';
import { BackupRestoreModal } from '../components/common/BackupRestoreModal';
import { Modal } from '../components/ui/Modal';

export const OutgoingDocsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [docs, setDocs] = useState<OutgoingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);

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
  const [backupModalOpen, setBackupModalOpen] = useState(false);

  const fetchDocs = async (
    targetPage = page,
    targetSearch = search,
    targetDept = selectedDept,
    targetStatus = selectedStatus
  ) => {
    try {
      setLoading(true);
      const params: any = {
        page: targetPage,
        limit,
        search: targetSearch.trim() || undefined,
        departmentId: targetDept || undefined,
        approvalStatus: targetStatus || undefined,
      };

      const res = await api.getOutgoingDocs(params);
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

  useEffect(() => {
    api.getDepartments().then((res) => {
      if (res.success) setDepartments(res.data);
    });
  }, []);

  useEffect(() => {
    fetchDocs(page, search, selectedDept, selectedStatus);
  }, [page, search, selectedDept, selectedStatus]);

  useEffect(() => {
    const docId = searchParams.get('id');
    if (docId) {
      api.getOutgoingDocById(docId).then((res) => {
        if (res.success && res.data) {
          setSelectedDoc(res.data);
          setDetailModalOpen(true);
        }
      });
    }
  }, [searchParams]);

  // Handle Approve Workflow Step (Section 22)
  const handleApprove = async (doc: OutgoingDocument) => {
    const result = await Swal.fire({
      title: 'ຢືນຢັນການອະນຸມັດ?',
      text: `ທ່ານຕ້ອງການອະນຸມັດເອກະສານຂາອອກ "${doc.outgoingNumber}" ແທ້ບໍ?`,
      input: 'text',
      inputLabel: 'ຄຳເຫັນ / ບັນທຶກການອະນຸມັດ (ທາງເລືອກ):',
      inputValue: 'ເຫັນດີ ແລະ ອະນຸມັດ',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ອະນຸມັດ',
      cancelButtonText: 'ຍົກເລີກ',
    });

    if (result.isConfirmed) {
      try {
        await api.approveOutgoingDoc(doc.id, result.value);
        Swal.fire({
          icon: 'success',
          title: 'ອະນຸມັດສຳເລັດແລ້ວ',
          text: 'ເອກະສານໄດ້ຖືກອະນຸມັດ ແລະ ສົ່ງຕໍ່ຕາມສາຍງານຮຽບຮ້ອຍ',
          timer: 1500,
          showConfirmButton: false,
        });
        fetchDocs();
      } catch (e: any) {
        Swal.fire({
          icon: 'error',
          title: 'ເກີດຂໍ້ຜິດພາດ',
          text: e.message || 'ບໍ່ສາມາດອະນຸມັດເອກະສານໄດ້',
        });
      }
    }
  };

  // Handle Reject Workflow Step (Section 22: Require rejection reason)
  const handleReject = async (doc: OutgoingDocument) => {
    const result = await Swal.fire({
      title: 'ປະຕິເສດ / ສົ່ງກັບຄືນແກ້ໄຂ',
      input: 'textarea',
      inputLabel: 'ກະລຸນາລະບຸເຫດຜົນໃນການປະຕິເສດ *:',
      inputPlaceholder: 'ພິມເຫດຜົນ ຫຼື ສິ່ງທີ່ຕ້ອງແກ້ໄຂ...',
      inputValidator: (value) => {
        if (!value) {
          return 'ຈຳເປັນຕ້ອງໃສ່ເຫດຜົນໃນການປະຕິເສດ!';
        }
      },
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ຢືນຢັນປະຕິເສດ',
      cancelButtonText: 'ຍົກເລີກ',
    });

    if (result.isConfirmed) {
      try {
        await api.rejectOutgoingDoc(doc.id, result.value);
        Swal.fire({
          icon: 'success',
          title: 'ສົ່ງກັບຄືນສຳເລັດ',
          text: 'ເອກະສານຖືກສົ່ງກັບຄືນພ້ອມເຫດຜົນຮຽບຮ້ອຍແລ້ວ',
          timer: 1500,
          showConfirmButton: false,
        });
        fetchDocs();
      } catch (e: any) {
        Swal.fire({
          icon: 'error',
          title: 'ເກີດຂໍ້ຜິດພາດ',
          text: e.message || 'ບໍ່ສາມາດປະຕິເສດເອກະສານໄດ້',
        });
      }
    }
  };

  const handleDelete = async (doc: OutgoingDocument) => {
    const result = await Swal.fire({
      title: '⚠️ ຢືນຢັນການລຶບ?',
      text: `ທ່ານຕ້ອງການລຶບເອກະສານ "${doc.outgoingNumber} - ${doc.subject}" ແທ້ບໍ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ລຶບຂໍ້ມູນ',
      cancelButtonText: 'ຍົກເລີກ',
    });

    if (result.isConfirmed) {
      try {
        await api.deleteOutgoingDoc(doc.id);
        Swal.fire({
          icon: 'success',
          title: 'ລຶບຂໍ້ມູນສຳເລັດ',
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
    window.open(api.getExcelExportUrl('outgoing'), '_blank');
  };

  const columns: Column<OutgoingDocument>[] = [
    {
      key: 'outgoingNumber',
      header: 'ເລກທີຂາອອກ',
      render: (item) => (
        <div>
          <span className="font-bold text-indigo-700 hover:underline">
            {item.outgoingNumber}
          </span>
          {item.docNumber && (
            <p className="text-[10px] text-slate-400">ເລກທີ: {item.docNumber}</p>
          )}
        </div>
      ),
    },
    {
      key: 'docDate',
      header: 'ວັນທີ',
      render: (item) => (
        <p className="font-medium text-slate-800">
          {new Date(item.docDate).toLocaleDateString('lo-LA')}
        </p>
      ),
    },
    {
      key: 'recipientOrg',
      header: 'ໜ່ວຍງານຮັບ',
      render: (item) => (
        <div className="max-w-[160px] truncate" title={item.recipientOrg}>
          <p className="font-semibold text-slate-800 truncate">{item.recipientOrg}</p>
          {item.recipientName && (
            <p className="text-[10px] text-slate-500 truncate">{item.recipientName}</p>
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
      key: 'approvalStatus',
      header: 'ສະຖານະອະນຸມັດ',
      render: (item) => <StatusBadge status={item.approvalStatus} />,
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
      header: 'ຈັດການ / ອະນຸມັດ',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {item.approvalStatus !== 'APPROVED' && item.approvalStatus !== 'SENT' && (
            <>
              <button
                onClick={() => handleApprove(item)}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-medium text-xs flex items-center"
                title="ອະນຸມັດ"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleReject(item)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-xs flex items-center"
                title="ປະຕິເສດ / ສົ່ງກັບຄືນ"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-sky-50/90 via-indigo-50/60 to-slate-50/40 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-sky-200/70 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 border-2 border-sky-300/80 shadow-md shadow-sky-500/15 flex items-center justify-center p-2.5 flex-shrink-0 group hover:scale-105 transition-all duration-300">
            <img
              src="/icons/outgoing-doc-icon.png"
              alt="Icon ລາຍການເອກະສານຂາອອກ"
              className="w-full h-full object-contain filter contrast-110 drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.documents.outgoingTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              ສ້າງ, ກວດກາ, ອະນຸມັດ ແລະ ສົ່ງອອກເອກະສານທາງການ
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
            {t.documents.addOutgoing}
          </Button>
        </div>
      </div>

      {/* Main Table with Filters */}
      <DataTable
        columns={columns}
        data={docs}
        isLoading={loading}
        searchPlaceholder="ຄົ້ນຫາເລກທີ, ໜ່ວຍງານຮັບ, ຫົວຂໍ້..."
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
              <option value="">ສະຖານະອະນຸມັດ (ທັງໝົດ)</option>
              <option value="DRAFT">📝 ຮ່າງເອກະສານ (Draft)</option>
              <option value="REVIEW">🔍 ກຳລັງກວດກາ (Review)</option>
              <option value="DEPT_APPROVAL">👤 ຫົວໜ້າພະແນກກວດກາ (Dept Approval)</option>
              <option value="DIRECTOR_APPROVAL">👑 ລໍຖ້າຜູ້ອຳນວຍການອະນຸມັດ (Director Approval)</option>
              <option value="APPROVED">✅ ອະນຸມັດແລ້ວ (Approved)</option>
              <option value="SENT">📤 ສົ່ງອອກແລ້ວ (Sent)</option>
              <option value="REJECTED">❌ ຖືກສົ່ງກັບຄືນ (Rejected)</option>
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

      {/* Create / Edit Form Modal */}
      <DocumentFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        type="outgoing"
        initialData={editingDoc}
        onSuccess={() => {
          if (!editingDoc) {
            setSearch('');
            setSelectedDept('');
            setSelectedStatus('');
            setPage(1);
            fetchDocs(1, '', '', '');
          } else {
            fetchDocs(page, search, selectedDept, selectedStatus);
          }
        }}
      />

      {/* Detail Modal */}
      <DocumentDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        document={selectedDoc}
        onRefresh={fetchDocs}
      />

      {/* Printable Sheet */}
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

      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        scope="OUTGOING"
        onSuccess={() => fetchDocs(page, search, selectedDept, selectedStatus)}
      />
    </div>
  );
};
