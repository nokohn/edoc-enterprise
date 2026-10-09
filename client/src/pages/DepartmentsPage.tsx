import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  Building,
  Plus,
  Edit,
  Trash2,
  Users,
  Network,
  List,
  UserCheck,
  FileText,
  CheckSquare,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { Department, User } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export interface OrgLeader {
  id: string;
  title: string;       // e.g. "ຄະນະຜູ້ອຳນວຍການ"
  name: string;        // e.g. "ທ່ານ ບຸນມີ ວົງສະຫວັນ"
  position: string;    // e.g. "ຜູ້ອຳນວຍການໃຫຍ່ (Managing Director)"
  userId?: string;
}

export interface OrgChartConfig {
  director: OrgLeader;
  deputies: OrgLeader[];
}

export const STORAGE_KEY_ORG_CHART = 'edoc_org_chart_leadership_config';

const DEFAULT_ORG_LEADERSHIP: OrgChartConfig = {
  director: {
    id: 'director',
    title: 'ຄະນະຜູ້ອຳນວຍການ',
    name: 'ທ່ານ ບຸນມີ ວົງສະຫວັນ',
    position: 'ຜູ້ອຳນວຍການໃຫຍ່ (Managing Director)',
  },
  deputies: [
    {
      id: 'deputy-1',
      title: 'ຮອງຜູ້ອຳນວຍການ',
      name: 'ທ່ານ ຄຳແພງ ໄຊຍະວົງ',
      position: 'ຮອງຜູ້ອຳນວຍການໃຫຍ່',
    },
  ],
};

export const DepartmentsPage: React.FC = () => {
  const { t } = useTranslation();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');

  // Leadership Org Chart State (Director & Deputies)
  const [orgLeadership, setOrgLeadership] = useState<OrgChartConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORG_CHART);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.director) return parsed;
      }
    } catch (e) {}
    return DEFAULT_ORG_LEADERSHIP;
  });

  // Leadership Edit Modal State
  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [editingLeaderTarget, setEditingLeaderTarget] = useState<'director' | string>('director');
  const [leaderFormData, setLeaderFormData] = useState({
    title: '',
    name: '',
    position: '',
    userId: '',
  });

  // Department Head Dedicated Edit Modal State
  const [headModalOpen, setHeadModalOpen] = useState(false);
  const [editingHeadDept, setEditingHeadDept] = useState<Department | null>(null);
  const [headFormData, setHeadFormData] = useState({
    headId: '',
    headName: '',
    phone: '',
    email: '',
  });

  // Department Form Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameLao: '',
    description: '',
    headId: '',
    headName: '',
  });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.getDepartments();
      if (res.success && res.data) {
        setDepartments(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    api.getUsers({ limit: 100 }).then((res) => {
      if (res.success && res.data) setUsers(res.data);
    });
    api.getSettings().then((res) => {
      if (res.success && res.data) {
        const found = res.data.find((s: any) => s.key === 'ORG_CHART_LEADERSHIP');
        if (found?.value) {
          try {
            const parsed = JSON.parse(found.value);
            if (parsed && parsed.director) {
              setOrgLeadership(parsed);
              localStorage.setItem(STORAGE_KEY_ORG_CHART, JSON.stringify(parsed));
            }
          } catch (e) {}
        }
      }
    });
  }, []);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setFormData({
      code: `DEP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      name: '',
      nameLao: '',
      description: '',
      headId: '',
      headName: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      code: dept.code,
      name: dept.name,
      nameLao: dept.nameLao,
      description: dept.description || '',
      headId: dept.headId || '',
      headName: dept.head?.employee?.fullNameLao || '',
    });
    setModalOpen(true);
  };

  // Dedicated Head Edit Handlers (e.g. ນາງ ວຽງໂຂງ or any department head)
  const handleOpenEditHead = (dept: Department) => {
    setEditingHeadDept(dept);
    const headUser = dept.head;
    setHeadFormData({
      headId: dept.headId || '',
      headName: headUser?.employee?.fullNameLao || '',
      phone: headUser?.phone || headUser?.employee?.phone || '',
      email: headUser?.email || headUser?.employee?.email || '',
    });
    setHeadModalOpen(true);
  };

  const handleHeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHeadDept) return;

    try {
      // 1. If headId has changed or unassigned, update department
      if (headFormData.headId !== (editingHeadDept.headId || '')) {
        await api.updateDepartment(editingHeadDept.id, {
          code: editingHeadDept.code,
          name: editingHeadDept.name,
          nameLao: editingHeadDept.nameLao,
          description: editingHeadDept.description,
          headId: headFormData.headId || null,
        });
      }

      // 2. If headId is assigned and headName is edited, update User & Employee fullNameLao
      if (headFormData.headId && headFormData.headName.trim()) {
        const targetUser = users.find((u) => u.id === headFormData.headId) || editingHeadDept.head;
        if (targetUser) {
          await api.updateUser(targetUser.id, {
            fullNameLao: headFormData.headName.trim(),
            phone: headFormData.phone || undefined,
            email: headFormData.email || undefined,
          });
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'ບັນທຶກສຳເລັດ',
        text: `ອັບເດດຂໍ້ມູນຫົວໜ້າພະແນກ "${editingHeadDept.nameLao}" ຮຽບຮ້ອຍແລ້ວ`,
        timer: 1500,
        showConfirmButton: false,
      });

      setHeadModalOpen(false);
      await Promise.all([
        fetchDepartments(),
        api.getUsers({ limit: 100 }).then((res) => {
          if (res.success && res.data) setUsers(res.data);
        }),
      ]);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'ເກີດຂໍ້ຜິດພາດ',
        text: err.message || 'ບໍ່ສາມາດບັນທຶກຂໍ້ມູນຫົວໜ້າພະແນກໄດ້',
      });
    }
  };

  // Leadership Edit Handlers
  const handleOpenEditDirector = () => {
    setEditingLeaderTarget('director');
    setLeaderFormData({
      title: orgLeadership.director.title || 'ຄະນະຜູ້ອຳນວຍການ',
      name: orgLeadership.director.name || '',
      position: orgLeadership.director.position || 'ຜູ້ອຳນວຍການໃຫຍ່ (Managing Director)',
      userId: orgLeadership.director.userId || '',
    });
    setLeaderModalOpen(true);
  };

  const handleOpenEditDeputy = (deputy: OrgLeader) => {
    setEditingLeaderTarget(deputy.id);
    setLeaderFormData({
      title: deputy.title || 'ຮອງຜູ້ອຳນວຍການ',
      name: deputy.name || '',
      position: deputy.position || 'ຮອງຜູ້ອຳນວຍການໃຫຍ່',
      userId: deputy.userId || '',
    });
    setLeaderModalOpen(true);
  };

  const handleAddDeputy = () => {
    const newDeputy: OrgLeader = {
      id: `deputy-${Date.now()}`,
      title: 'ຮອງຜູ້ອຳນວຍການ',
      name: 'ທ່ານ ຮອງຜູ້ອຳນວຍການ',
      position: 'ຮອງຜູ້ອຳນວຍການໃຫຍ່',
    };
    const updated: OrgChartConfig = {
      ...orgLeadership,
      deputies: [...(orgLeadership.deputies || []), newDeputy],
    };
    saveLeadership(updated);
    handleOpenEditDeputy(newDeputy);
  };

  const handleDeleteDeputy = (deputyId: string, name: string) => {
    Swal.fire({
      title: 'ຢືນຢັນການລຶບ?',
      text: `ທ່ານຕ້ອງການລຶບ "${name}" ອອກຈາກໂຄງຮ່າງບໍ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ລຶບອອກ',
      cancelButtonText: 'ຍົກເລີກ',
    }).then((result) => {
      if (result.isConfirmed) {
        const updated: OrgChartConfig = {
          ...orgLeadership,
          deputies: (orgLeadership.deputies || []).filter((d) => d.id !== deputyId),
        };
        saveLeadership(updated);
      }
    });
  };

  const saveLeadership = async (newConfig: OrgChartConfig) => {
    setOrgLeadership(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY_ORG_CHART, JSON.stringify(newConfig));
    } catch (e) {}

    try {
      await api.updateSettings([
        { key: 'ORG_CHART_LEADERSHIP', value: JSON.stringify(newConfig) },
      ]);
    } catch (e) {
      // ignore
    }
  };

  const handleLeaderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderFormData.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'ແຈ້ງເຕືອນ',
        text: 'ກະລຸນາປ້ອນຊື່ຜູ້ດຳລົງຕຳແໜ່ງ',
      });
      return;
    }

    let updated: OrgChartConfig;
    if (editingLeaderTarget === 'director') {
      updated = {
        ...orgLeadership,
        director: {
          ...orgLeadership.director,
          title: leaderFormData.title,
          name: leaderFormData.name,
          position: leaderFormData.position,
          userId: leaderFormData.userId,
        },
      };
    } else {
      updated = {
        ...orgLeadership,
        deputies: (orgLeadership.deputies || []).map((d) =>
          d.id === editingLeaderTarget
            ? {
                ...d,
                title: leaderFormData.title,
                name: leaderFormData.name,
                position: leaderFormData.position,
                userId: leaderFormData.userId,
              }
            : d
        ),
      };
    }

    await saveLeadership(updated);
    setLeaderModalOpen(false);
    Swal.fire({
      icon: 'success',
      title: 'ບັນທຶກສຳເລັດ',
      text: 'ອັບເດດຂໍ້ມູນໂຄງຮ່າງການຈັດຕັ້ງຮຽບຮ້ອຍແລ້ວ',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleResetLeadership = () => {
    Swal.fire({
      title: 'ຣີເຊັດຄ່າເລີ່ມຕົ້ນ?',
      text: 'ທ່ານຕ້ອງການກັບຄືນສູ່ຄ່າເລີ່ມຕົ້ນຂອງຄະນະຜູ້ອຳນວຍການບໍ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ຣີເຊັດ',
      cancelButtonText: 'ຍົກເລີກ',
    }).then((res) => {
      if (res.isConfirmed) {
        saveLeadership(DEFAULT_ORG_LEADERSHIP);
        Swal.fire({
          icon: 'success',
          title: 'ຣີເຊັດສຳເລັດ',
          timer: 1200,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.nameLao) {
      Swal.fire({
        icon: 'warning',
        title: 'ແຈ້ງເຕືອນ',
        text: 'ກະລຸນາປ້ອນລະຫັດ ແລະ ຊື່ພະແນກພາສາລາວ',
      });
      return;
    }

    try {
      const payload: any = {
        code: formData.code,
        name: formData.name,
        nameLao: formData.nameLao,
        description: formData.description,
        headId: formData.headId || null,
      };

      if (editingDept) {
        await api.updateDepartment(editingDept.id, payload);
        // If headName was customized, also update the User/Employee
        if (formData.headId && formData.headName.trim()) {
          const u = users.find((x) => x.id === formData.headId) || editingDept.head;
          if (u) {
            await api.updateUser(u.id, { fullNameLao: formData.headName.trim() });
          }
        }
        Swal.fire({
          icon: 'success',
          title: 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await api.createDepartment(payload);
        Swal.fire({
          icon: 'success',
          title: 'ເພີ່ມພະແນກສຳເລັດ',
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setModalOpen(false);
      await Promise.all([
        fetchDepartments(),
        api.getUsers({ limit: 100 }).then((res) => {
          if (res.success && res.data) setUsers(res.data);
        }),
      ]);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'ເກີດຂໍ້ຜິດພາດ',
        text: err.message || 'ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້',
      });
    }
  };

  const handleDelete = async (dept: Department) => {
    const result = await Swal.fire({
      title: '⚠️ ຢືນຢັນການລຶບ?',
      text: `ທ່ານຕ້ອງການລຶບພະແນກ "${dept.nameLao}" ແທ້ບໍ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ລຶບຂໍ້ມູນ',
      cancelButtonText: 'ຍົກເລີກ',
    });

    if (result.isConfirmed) {
      try {
        await api.deleteDepartment(dept.id);
        Swal.fire({
          icon: 'success',
          title: 'ລຶບພະແນກສຳເລັດ',
          timer: 1500,
          showConfirmButton: false,
        });
        fetchDepartments();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'ເກີດຂໍ້ຜິດພາດ',
          text: err.message || 'ບໍ່ສາມາດລຶບພະແນກໄດ້',
        });
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.nav.departments}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ໂຄງຮ່າງການຈັດຕັ້ງ, ພະແນກການ, ໜ່ວຍງານ ແລະ ຫົວໜ້າຮັບຜິດຊອບ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Grid List</span>
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'tree'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Org Chart</span>
            </button>
          </div>

          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-1" />
            ເພີ່ມພະແນກໃໝ່
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Card key={dept.id} className="relative group">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                      {dept.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{dept.nameLao}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(dept)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(dept)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                {dept.description || dept.name || 'ບໍ່ມີລາຍລະອຽດເພີ່ມເຕີມ'}
              </p>

              {/* Department Head Card */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-2.5 mb-4 text-xs">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {dept.head?.employee?.fullNameLao?.charAt(0) || 'H'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-slate-400">ຫົວໜ້າພະແນກ</p>
                    <p className="font-bold text-slate-800 truncate" title={dept.head?.employee?.fullNameLao || 'ຍັງບໍ່ໄດ້ແຕ່ງຕັ້ງ'}>
                      {dept.head?.employee?.fullNameLao || 'ຍັງບໍ່ໄດ້ແຕ່ງຕັ້ງ'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenEditHead(dept)}
                  className="p-1.5 text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 rounded-lg border border-blue-200 shrink-0 flex items-center justify-center shadow-2xs transition-colors"
                  title="ແກ້ໄຂຫົວໜ້າພະແນກ (ປ່ຽນຊື່, ຕຳແໜ່ງ ຫຼື ແຕ່ງຕັ້ງ)"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Stats Footer */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
                <div>
                  <p className="text-[10px] text-slate-400">ຜູ້ໃຊ້ງານເຂົ້າລະບົບ</p>
                  <p className="font-bold text-slate-800">{dept._count?.employees || 0} ຄົນ</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">ເອກະສານ</p>
                  <p className="font-bold text-slate-800">{dept._count?.documents || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">ວຽກງານ</p>
                  <p className="font-bold text-slate-800">{dept._count?.tasks || 0}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Org Hierarchy Tree View (Editable) */
        <Card className="p-6">
          {/* Org Chart Top Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Network className="w-4 h-4 text-blue-600" />
                ໂຄງຮ່າງການຈັດຕັ້ງ (Organization Chart)
              </span>
              <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                ຄລິກ "ແກ້ໄຂ" ເພື່ອປ່ຽນຊື່ ຫຼື ຕຳແໜ່ງໄດ້ທຸກຈຸດ
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEditDirector}
                className="text-xs"
              >
                <Edit className="w-3.5 h-3.5 mr-1 text-blue-600" />
                ແກ້ໄຂ ຜອ
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddDeputy}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                ເພີ່ມຮອງ ຜອ
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCreate}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                ເພີ່ມພະແນກໃໝ່
              </Button>
              <button
                type="button"
                onClick={handleResetLeadership}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline px-1 py-1"
                title="ກັບຄືນສູ່ຄ່າເລີ່ມຕົ້ນ"
              >
                ຣີເຊັດເລີ່ມຕົ້ນ
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-6">
            {/* Top Level: Managing Director (ທ່ານ ບຸນມີ ວົງສະຫວັນ - ສາມາດແກ້ໄຂໄດ້) */}
            <div className="relative group/director">
              <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white rounded-2xl shadow-md border border-blue-600/40 text-center min-w-[260px] sm:min-w-[320px] transition-all duration-200 hover:shadow-xl hover:scale-[1.02]">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full">
                    {orgLeadership.director.title || 'ຄະນະຜູ້ອຳນວຍການ'}
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenEditDirector}
                    className="flex items-center gap-1 text-[11px] font-semibold text-white bg-white/20 hover:bg-white/35 px-2.5 py-1 rounded-lg transition-colors shadow-xs"
                    title="ແກ້ໄຂຕຳແໜ່ງຜູ້ອຳນວຍການໃຫຍ່"
                  >
                    <Edit className="w-3 h-3" />
                    <span>ແກ້ໄຂ</span>
                  </button>
                </div>
                <h3 className="font-black text-base sm:text-lg tracking-tight mt-1 text-white">
                  {orgLeadership.director.name}
                </h3>
                <p className="text-xs text-blue-100/90 font-medium mt-0.5">
                  {orgLeadership.director.position}
                </p>
              </div>
            </div>

            {/* Connecting Vertical Line */}
            <div className="w-0.5 h-6 bg-slate-300" />

            {/* Deputy Managing Director(s) */}
            <div className="flex flex-wrap items-center justify-center gap-4 max-w-4xl">
              {(orgLeadership.deputies || []).map((deputy) => (
                <div
                  key={deputy.id}
                  className="p-3.5 bg-gradient-to-b from-blue-50/90 to-slate-50 border border-blue-200 text-slate-900 rounded-xl text-center min-w-[220px] sm:min-w-[260px] shadow-xs hover:shadow-md transition-all duration-200 relative group/deputy"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                      {deputy.title || 'ຮອງຜູ້ອຳນວຍການ'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditDeputy(deputy)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 px-2 py-0.5 rounded-md transition-colors"
                        title="ແກ້ໄຂຕຳແໜ່ງຮອງ ຜອ"
                      >
                        <Edit className="w-3 h-3" />
                        <span>ແກ້ໄຂ</span>
                      </button>
                      {(orgLeadership.deputies || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDeputy(deputy.id, deputy.name)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="ລຶບຮອງ ຜອ"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800 mt-1">
                    {deputy.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {deputy.position}
                  </p>
                </div>
              ))}

              {/* Add Deputy Button */}
              <button
                type="button"
                onClick={handleAddDeputy}
                className="p-3 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl text-slate-500 hover:text-blue-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[78px] min-w-[130px]"
                title="ເພີ່ມຕຳແໜ່ງຮອງຜູ້ອຳນວຍການ"
              >
                <Plus className="w-4 h-4" />
                <span>+ ເພີ່ມຮອງ ຜອ</span>
              </button>
            </div>

            {/* Connecting Horizontal Line to Departments */}
            <div className="w-full max-w-5xl relative my-2">
              <div className="absolute top-0 left-8 right-8 h-0.5 bg-slate-300" />
            </div>

            {/* Department Level Cards (ແກ້ໄຂໄດ້ທຸກພະແນກ) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all text-center space-y-1.5 relative group before:absolute before:-top-8 before:left-1/2 before:w-0.5 before:h-8 before:bg-slate-300"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                      {dept.code}
                    </span>
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(dept)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="ແກ້ໄຂພະແນກ / ຫົວໜ້າພະແນກ"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(dept)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="ລຶບພະແນກ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h5 className="font-bold text-xs text-slate-800 line-clamp-1" title={dept.nameLao}>
                    {dept.nameLao}
                  </h5>
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                    <div className="text-left overflow-hidden">
                      <span className="text-[10px] text-slate-400 block">ຫົວໜ້າພະແນກ:</span>
                      <span className="font-bold text-slate-800 truncate block max-w-[105px]" title={dept.head?.employee?.fullNameLao || 'ຍັງບໍ່ໄດ້ແຕ່ງຕັ້ງ'}>
                        {dept.head?.employee?.fullNameLao || 'ຍັງບໍ່ໄດ້ແຕ່ງຕັ້ງ'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenEditHead(dept)}
                      className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors shrink-0 flex items-center justify-center shadow-2xs"
                      title="ແກ້ໄຂຫົວໜ້າພະແນກນີ້"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Department Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDept ? 'ແກ້ໄຂຂໍ້ມູນພະແນກ' : 'ເພີ່ມພະແນກໃໝ່'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <Input
              label="ລະຫັດພະແນກ (Department Code)"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="ເຊັ່ນ: DEP-ACC"
              required
            />
          </div>

          <div>
            <Input
              label="ຊື່ພະແນກ (ພາສາລາວ)"
              value={formData.nameLao}
              onChange={(e) => setFormData({ ...formData, nameLao: e.target.value })}
              placeholder="ເຊັ່ນ: ບໍລິຫານບັນຊີ-ການເງິນ"
              required
            />
          </div>

          <div>
            <Input
              label="Department Name (English)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Accounting and Finance"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ຫົວໜ້າພະແນກ
            </label>
            <select
              value={formData.headId}
              onChange={(e) => {
                const selectedId = e.target.value;
                const foundUser = users.find((u) => u.id === selectedId);
                setFormData({
                  ...formData,
                  headId: selectedId,
                  headName: foundUser?.employee?.fullNameLao || '',
                });
              }}
              className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">-- ເລືອກຫົວໜ້າພະແນກ --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.employee?.fullNameLao || u.username} ({u.role?.nameLao})
                </option>
              ))}
            </select>
          </div>

          {formData.headId && (
            <div>
              <Input
                label="✍️ ຊື່ ແລະ ນາມສະກຸນ ຫົວໜ້າພະແນກ (ສາມາດແກ້ໄຂໄດ້)"
                value={formData.headName}
                onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                placeholder="ເຊັ່ນ: ນາງ ວຽງໂຂງ"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ລາຍລະອຽດພາລະບົດບາດ
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="ພາລະບົດບາດ ແລະ ຄວາມຮັບຜິດຊອບ..."
              className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              ຍົກເລີກ
            </Button>
            <Button type="submit" variant="primary">
              {editingDept ? 'ບັນທຶກການແກ້ໄຂ' : 'ສ້າງພະແນກໃໝ່'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Leadership Position Edit Modal (Director & Deputies) */}
      <Modal
        isOpen={leaderModalOpen}
        onClose={() => setLeaderModalOpen(false)}
        title={
          editingLeaderTarget === 'director'
            ? 'ແກ້ໄຂຕຳແໜ່ງຜູ້ອຳນວຍການໃຫຍ່ (Managing Director)'
            : 'ແກ້ໄຂຕຳແໜ່ງຮອງຜູ້ອຳນວຍການໃຫຍ່ (Deputy Director)'
        }
        subtitle="ປັບປຸງຊື່, ຕຳແໜ່ງ ແລະ ພາກສ່ວນ ໃນໂຄງຮ່າງການຈັດຕັ້ງ"
        maxWidth="md"
      >
        <form onSubmit={handleLeaderSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Quick pick from existing users */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
            <label className="block text-xs font-bold text-blue-900">
              👥 ເລືອກຈາກລາຍຊື່ຜູ້ໃຊ້ໃນລະບົບ (ທາງເລືອກ):
            </label>
            <select
              value={leaderFormData.userId}
              onChange={(e) => {
                const selectedId = e.target.value;
                const u = users.find((item) => item.id === selectedId);
                if (u) {
                  setLeaderFormData((prev) => ({
                    ...prev,
                    userId: selectedId,
                    name: u.employee?.fullNameLao || u.username,
                  }));
                } else {
                  setLeaderFormData((prev) => ({ ...prev, userId: '' }));
                }
              }}
              className="w-full py-1.5 px-3 rounded-lg border border-blue-300 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- ເລືອກເພື່ອດຶງຊື່ອັດຕະໂນມັດ ຫຼື ພິມເອງດ້ານລຸ່ມ --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.employee?.fullNameLao || u.username} ({u.employee?.position?.nameLao || u.role?.nameLao || 'ພະນັກງານ'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="ຊື່ ແລະ ນາມສະກຸນ ຜູ້ດຳລົງຕຳແໜ່ງ *"
              value={leaderFormData.name}
              onChange={(e) => setLeaderFormData({ ...leaderFormData, name: e.target.value })}
              placeholder="ເຊັ່ນ: ທ່ານ ບຸນມີ ວົງສະຫວັນ"
              required
            />
          </div>

          <div>
            <Input
              label="ຊື່ຕຳແໜ່ງ (Position Title) *"
              value={leaderFormData.position}
              onChange={(e) => setLeaderFormData({ ...leaderFormData, position: e.target.value })}
              placeholder="ເຊັ່ນ: ຜູ້ອຳນວຍການໃຫຍ່ (Managing Director)"
              required
            />
          </div>

          <div>
            <Input
              label="ພາກສ່ວນ / ໜ່ວຍງານ (Division / Group)"
              value={leaderFormData.title}
              onChange={(e) => setLeaderFormData({ ...leaderFormData, title: e.target.value })}
              placeholder="ເຊັ່ນ: ຄະນະຜູ້ອຳນວຍການ ຫຼື ຮອງຜູ້ອຳນວຍການ"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setLeaderModalOpen(false)}>
              ຍົກເລີກ
            </Button>
            <Button type="submit" variant="primary">
              ບັນທຶກຕຳແໜ່ງ
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dedicated Department Head Edit Modal (e.g. ນາງ ວຽງໂຂງ) */}
      <Modal
        isOpen={headModalOpen}
        onClose={() => setHeadModalOpen(false)}
        title={`ແກ້ໄຂຫົວໜ້າພະແນກ: ${editingHeadDept?.nameLao || ''}`}
        subtitle="ປັບປຸງຊື່-ນາມສະກຸນ, ປ່ຽນຜູ້ຮັບຜິດຊອບ ຫຼື ຂໍ້ມູນຕິດຕໍ່"
        maxWidth="md"
      >
        <form onSubmit={handleHeadSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Select User Dropdown */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
            <label className="block text-xs font-bold text-blue-900">
              👥 ແຕ່ງຕັ້ງ / ເລືອກຈາກລາຍຊື່ຜູ້ໃຊ້ໃນລະບົບ:
            </label>
            <select
              value={headFormData.headId}
              onChange={(e) => {
                const selectedId = e.target.value;
                const u = users.find((item) => item.id === selectedId);
                if (u) {
                  setHeadFormData((prev) => ({
                    ...prev,
                    headId: selectedId,
                    headName: u.employee?.fullNameLao || u.username,
                    phone: u.phone || u.employee?.phone || prev.phone,
                    email: u.email || u.employee?.email || prev.email,
                  }));
                } else {
                  setHeadFormData((prev) => ({
                    ...prev,
                    headId: '',
                    headName: '',
                  }));
                }
              }}
              className="w-full py-2 px-3 rounded-lg border border-blue-300 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">-- ຍັງບໍ່ໄດ້ແຕ່ງຕັ້ງ (Unassign) --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.employee?.fullNameLao || u.username} ({u.employee?.position?.nameLao || u.role?.nameLao || 'ພະນັກງານ'})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-blue-600">
              💡 ທ່ານສາມາດເລືອກພະນັກງານໃນລະບົບ ຫຼື ພິມຊື່ແກ້ໄຂໂດຍກົງດ້ານລຸ່ມ
            </p>
          </div>

          <div>
            <Input
              label="ຊື່ ແລະ ນາມສະກຸນ ຫົວໜ້າພະແນກ *"
              value={headFormData.headName}
              onChange={(e) => setHeadFormData({ ...headFormData, headName: e.target.value })}
              placeholder="ເຊັ່ນ: ນາງ ວຽງໂຂງ"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="ເບີໂທລະສັບ (Phone)"
              value={headFormData.phone}
              onChange={(e) => setHeadFormData({ ...headFormData, phone: e.target.value })}
              placeholder="ເຊັ່ນ: 020 55334455"
            />
            <Input
              label="ອີເມວ (Email)"
              value={headFormData.email}
              onChange={(e) => setHeadFormData({ ...headFormData, email: e.target.value })}
              placeholder="ເຊັ່ນ: viengkhoh@eoffice.la"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setHeadModalOpen(false)}>
              ຍົກເລີກ
            </Button>
            <Button type="submit" variant="primary">
              ບັນທຶກຫົວໜ້າພະແນກ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
