import React, { useState, useEffect } from 'react';
import { Clock, Shield, Search, Filter } from 'lucide-react';
import { api } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { AuditLog } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';

export const AuditLogPage: React.FC = () => {
  const { t } = useTranslation();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        page,
        limit,
        search: search.trim() || undefined,
        module: moduleFilter || undefined,
        action: actionFilter || undefined,
      });
      if (res.success && res.data) {
        setLogs(res.data);
        setTotal(res.pagination.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, search, moduleFilter, actionFilter]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return <Badge variant="info">ເຂົ້າສູ່ລະບົບ</Badge>;
      case 'LOGOUT':
        return <Badge variant="gray">ອອກຈາກລະບົບ</Badge>;
      case 'CREATE':
        return <Badge variant="success">ສ້າງຂໍ້ມູນໃໝ່</Badge>;
      case 'UPDATE':
        return <Badge variant="warning">ແກ້ໄຂຂໍ້ມູນ</Badge>;
      case 'DELETE':
        return <Badge variant="danger">ລຶບຂໍ້ມູນ</Badge>;
      case 'APPROVE':
        return <Badge variant="success">ອະນຸມັດ</Badge>;
      case 'REJECT':
        return <Badge variant="danger">ປະຕິເສດ</Badge>;
      case 'ASSIGN':
        return <Badge variant="purple">ມອບໝາຍວຽກ</Badge>;
      default:
        return <Badge variant="default">{action}</Badge>;
    }
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'ວັນທີ ແລະ ເວລາ',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">
            {new Date(item.createdAt).toLocaleDateString('lo-LA')}
          </p>
          <p className="text-[10px] text-slate-400">
            {new Date(item.createdAt).toLocaleTimeString('lo-LA')}
          </p>
        </div>
      ),
    },
    {
      key: 'userName',
      header: 'ຜູ້ດຳເນີນການ',
      render: (item) => (
        <span className="font-bold text-slate-900">{item.userName || 'System'}</span>
      ),
    },
    {
      key: 'action',
      header: 'ການກະທຳ (Action)',
      render: (item) => getActionBadge(item.action),
    },
    {
      key: 'module',
      header: 'ໂມດູນ (Module)',
      render: (item) => (
        <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          {item.module}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'ລາຍລະອຽດການເຄື່ອນໄຫວ',
      render: (item) => (
        <p className="text-slate-700 text-xs font-medium max-w-md truncate" title={item.description}>
          {item.description}
        </p>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (item) => (
        <span className="font-mono text-[11px] text-slate-500">{item.ipAddress || '-'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {t.nav.auditLogs}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          ບັນທຶກປະຫວັດການເຄື່ອນໄຫວທັງໝົດໃນລະບົບ (Security & Audit Trail)
        </p>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={logs}
        isLoading={loading}
        searchPlaceholder="ຄົ້ນຫາຜູ້ໃຊ້, ລາຍລະອຽດ, IP..."
        searchValue={search}
        onSearchChange={setSearch}
        filterSlot={
          <div className="flex items-center gap-2 text-xs">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">ທຸກໂມດູນ (All Modules)</option>
              <option value="AUTH">AUTH</option>
              <option value="DOCUMENT">DOCUMENT</option>
              <option value="TASK">TASK</option>
              <option value="USER">USER</option>
              <option value="DEPARTMENT">DEPARTMENT</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">ທຸກການກະທຳ (All Actions)</option>
              <option value="LOGIN">LOGIN</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="APPROVE">APPROVE</option>
              <option value="REJECT">REJECT</option>
              <option value="ASSIGN">ASSIGN</option>
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
    </div>
  );
};
