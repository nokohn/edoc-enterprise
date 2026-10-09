import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  FileSpreadsheet,
  Eye,
  Inbox,
  Send,
  Paperclip,
  CheckSquare,
} from 'lucide-react';
import { api } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { Document, Department } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { DocumentDetailModal } from '../components/documents/DocumentDetailModal';

export const AllDocsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [flowType, setFlowType] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await api.getAllDocuments({
        page,
        limit,
        search: search.trim() || undefined,
        flowType: flowType || undefined,
        departmentId: selectedDept || undefined,
      });
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
    fetchDocs();
  }, [page, search, flowType, selectedDept]);

  useEffect(() => {
    const docId = searchParams.get('id');
    if (docId) {
      api.getDocumentById(docId).then((res) => {
        if (res.success && res.data) {
          setSelectedDoc(res.data);
          setDetailModalOpen(true);
        }
      });
    }
  }, [searchParams]);

  const columns: Column<Document>[] = [
    {
      key: 'flowType',
      header: 'ປະເພດສາຍງານ',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold ${
            item.flowType === 'INCOMING'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
          }`}
        >
          {item.flowType === 'INCOMING' ? (
            <>
              <Inbox className="w-3.5 h-3.5" />
              ຂາເຂົ້າ
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              ຂາອອກ
            </>
          )}
        </span>
      ),
    },
    {
      key: 'documentNumber',
      header: 'ເລກທີເອກະສານ',
      render: (item) => (
        <span className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer">
          {item.documentNumber}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'ຫົວຂໍ້ / ເນື້ອໃນຫຍໍ້',
      render: (item) => (
        <div className="max-w-[320px]">
          <p className="font-semibold text-slate-900 truncate" title={item.title}>
            {item.title}
          </p>
          <p className="text-[11px] text-slate-500">
            {item.documentType?.nameLao} • {item.department?.nameLao}
          </p>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'ວັນທີບັນທຶກ',
      render: (item) => (
        <span className="text-slate-600 text-xs">
          {new Date(item.createdAt).toLocaleDateString('lo-LA')}
        </span>
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
      key: 'tasks',
      header: 'ວຽກຜູກພັນ',
      align: 'center',
      render: (item) => (
        <span className="text-xs font-semibold text-slate-600">
          {item._count?.tasks || 0}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ຈັດການ',
      align: 'right',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDoc(item);
            setDetailModalOpen(true);
          }}
          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="ເບິ່ງລາຍລະອຽດ"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-indigo-50/40 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-blue-200/70 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-2 border-blue-300/80 shadow-md shadow-blue-500/15 flex items-center justify-center p-1.5 flex-shrink-0 group hover:scale-105 transition-all duration-300 overflow-hidden">
            <img
              src="/icons/all-docs-icon.png?v=4"
              alt="Icon ຄັງເກັບເອກະສານທັງໝົດ"
              className="w-full h-full object-contain rounded-xl drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.documents.allTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              ສູນລວມຄັງເກັບເອກະສານທັງໝົດໃນອົງກອນ (ຂາເຂົ້າ, ຂາອອກ, ພາຍໃນ)
            </p>
          </div>
        </div>
      </div>

      {/* Main Table with Filters */}
      <DataTable
        columns={columns}
        data={docs}
        isLoading={loading}
        searchPlaceholder="ຄົ້ນຫາເລກທີ, ຫົວຂໍ້, ເນື້ອໃນ..."
        searchValue={search}
        onSearchChange={setSearch}
        onRowClick={(item) => {
          setSelectedDoc(item);
          setDetailModalOpen(true);
        }}
        filterSlot={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={flowType}
              onChange={(e) => setFlowType(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">ທຸກສາຍງານ (All)</option>
              <option value="INCOMING">ເອກະສານຂາເຂົ້າ (Incoming)</option>
              <option value="OUTGOING">ເອກະສານຂາອອກ (Outgoing)</option>
            </select>

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
          </div>
        }
        pagination={{
          total,
          page,
          limit,
          onPageChange: setPage,
        }}
      />

      {/* Detail Modal */}
      <DocumentDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        document={selectedDoc}
        onRefresh={fetchDocs}
      />
    </div>
  );
};
