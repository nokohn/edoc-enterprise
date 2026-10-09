import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, CheckSquare, Users, Building, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Modal } from '../ui/Modal';
import { StatusBadge, PriorityBadge } from '../ui/Badge';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    documents: any[];
    tasks: any[];
    employees: any[];
    departments: any[];
  }>({
    documents: [],
    tasks: [],
    employees: [],
    departments: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ documents: [], tasks: [], employees: [], departments: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ documents: [], tasks: [], employees: [], departments: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.globalSearch(query.trim());
        if (res.success && res.data) {
          setResults(res.data);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    onClose();
    navigate(url);
  };

  const hasAnyResult =
    results.documents.length > 0 ||
    results.tasks.length > 0 ||
    results.employees.length > 0 ||
    results.departments.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="2xl">
      <div className="-mt-1">
        {/* Search Input Box */}
        <div className="relative border-b border-slate-200 pb-3">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="ຄົ້ນຫາເອກະສານ, ເລກທີ, ວຽກງານ, ພະນັກງານ, ພະແນກ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 text-sm sm:text-base border-none outline-none focus:ring-0 bg-transparent placeholder:text-slate-400 text-slate-900"
          />
          {loading && (
            <Loader2 className="w-5 h-5 absolute right-3 top-2.5 text-blue-500 animate-spin" />
          )}
        </div>

        {/* Results Container */}
        <div className="mt-3 max-h-[60vh] overflow-y-auto space-y-4">
          {!query.trim() ? (
            <div className="p-8 text-center text-xs text-slate-400">
              ພິມຄຳຄົ້ນຫາເພື່ອເລີ່ມການຄົ້ນຫາໃນລະບົບ (Documents, Tasks, People, Depts)
            </div>
          ) : !hasAnyResult && !loading ? (
            <div className="p-8 text-center text-xs text-slate-400">
              ບໍ່ພົບຂໍ້ມູນທີ່ກົງກັບ "{query}"
            </div>
          ) : (
            <>
              {/* Documents */}
              {results.documents.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-50/80 px-2.5 py-1.5 rounded-lg border border-blue-200/70 mb-2">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    ເອກະສານ ({results.documents.length})
                  </div>
                  <div className="space-y-1">
                    {results.documents.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() =>
                          handleSelect(
                            doc.flowType === 'INCOMING'
                              ? `/incoming-docs?id=${doc.id}`
                              : doc.flowType === 'OUTGOING'
                              ? `/outgoing-docs?id=${doc.id}`
                              : `/all-docs?id=${doc.id}`
                          )
                        }
                        className="p-2.5 rounded-lg hover:bg-blue-50/60 cursor-pointer transition-colors flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                              {doc.documentNumber}
                            </span>
                            <span className="text-[11px] text-slate-500">{doc.department?.nameLao}</span>
                          </div>
                          <p className="font-medium text-slate-800 truncate">{doc.title}</p>
                        </div>
                        <StatusBadge status={doc.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {results.tasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-200/70 mb-2">
                    <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                    ວຽກງານ ({results.tasks.length})
                  </div>
                  <div className="space-y-1">
                    {results.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleSelect(`/task-tracking?id=${task.id}`)}
                        className="p-2.5 rounded-lg hover:bg-amber-50/60 cursor-pointer transition-colors flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                              {task.taskCode}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ຜູ້ຮັບຜິດຊອບ: {task.assignedTo?.employee?.fullNameLao || 'Staff'}
                            </span>
                          </div>
                          <p className="font-medium text-slate-800 truncate">{task.title}</p>
                        </div>
                        <StatusBadge status={task.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Employees */}
              {results.employees.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800 bg-purple-50/80 px-2.5 py-1.5 rounded-lg border border-purple-200/70 mb-2">
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                    ຜູ້ໃຊ້ງານເຂົ້າລະບົບ ({results.employees.length})
                  </div>
                  <div className="space-y-1">
                    {results.employees.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => handleSelect('/employees')}
                        className="p-2.5 rounded-lg hover:bg-purple-50/60 cursor-pointer transition-colors flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{emp.fullNameLao}</p>
                          <p className="text-[11px] text-slate-500">
                            {emp.position?.nameLao} • {emp.department?.nameLao}
                          </p>
                        </div>
                        <span className="text-slate-400 text-xs">{emp.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Departments */}
              {results.departments.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200/70 mb-2">
                    <Building className="w-3.5 h-3.5 text-emerald-600" />
                    ພະແນກ / ໜ່ວຍງານ ({results.departments.length})
                  </div>
                  <div className="space-y-1">
                    {results.departments.map((dept) => (
                      <div
                        key={dept.id}
                        onClick={() => handleSelect('/departments')}
                        className="p-2.5 rounded-lg hover:bg-emerald-50/60 cursor-pointer transition-colors flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{dept.nameLao}</p>
                          <p className="text-[11px] text-slate-500">{dept.name} ({dept.code})</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
