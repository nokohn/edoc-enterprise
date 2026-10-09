import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Key,
  Shield,
  Phone,
  Mail,
  Building,
  Camera,
  Upload,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { User, Role, Position, Department } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export const EmployeesPage: React.FC = () => {
  const { t } = useTranslation();

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  // Form Modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    employeeCode: '',
    username: '',
    password: '',
    fullNameLao: '',
    fullNameEn: '',
    email: '',
    phone: '',
    roleId: '',
    departmentId: '',
    positionId: '',
    avatarUrl: '',
  });

  const fetchUsers = async (
    targetPage = page,
    targetSearch = search,
    targetDept = selectedDept
  ) => {
    try {
      setLoading(true);
      const res = await api.getUsers({
        page: targetPage,
        limit,
        search: targetSearch.trim() || undefined,
        departmentId: targetDept || undefined,
      });
      if (res.success && res.data) {
        setUsers(res.data);
        setTotal(res.pagination.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [deptRes, roleRes, posRes] = await Promise.all([
        api.getDepartments(),
        api.getRoles(),
        api.getPositions(),
      ]);
      if (deptRes.success) setDepartments(deptRes.data);
      if (roleRes.success) setRoles(roleRes.data);
      if (posRes.success) setPositions(posRes.data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchUsers(page, search, selectedDept);
  }, [page, search, selectedDept]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'ໄຟລ໌ໃຫຍ່ເກີນໄປ',
        text: 'ກະລຸນາເລືອກຮູບທີ່ມີຂະໜາດບໍ່ເກີນ 5MB',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((prev) => ({ ...prev, avatarUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      employeeCode: '',
      username: '',
      password: '',
      fullNameLao: '',
      fullNameEn: '',
      email: '',
      phone: '',
      roleId: roles[0]?.id || '',
      departmentId: departments[0]?.id || '',
      positionId: positions[0]?.id || '',
      avatarUrl: '',
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      employeeCode: u.employee?.employeeCode || '',
      username: u.username,
      password: '',
      fullNameLao: u.employee?.fullNameLao || u.username,
      fullNameEn: u.employee?.fullNameEn || '',
      email: u.email || '',
      phone: u.phone || '',
      roleId: u.roleId,
      departmentId: u.departmentId || '',
      positionId: u.positionId || '',
      avatarUrl: u.avatarUrl || u.employee?.avatarUrl || '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.fullNameLao || !formData.roleId) {
      Swal.fire({
        icon: 'warning',
        title: 'ແຈ້ງເຕືອນ',
        text: 'ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້, ຊື່ພາສາລາວ, ແລະ ເລືອກສິດການນຳໃຊ້ (Role)',
      });
      return;
    }

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
        Swal.fire({
          icon: 'success',
          title: 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ',
          timer: 1500,
          showConfirmButton: false,
        });
        setFormOpen(false);
        await fetchUsers(page, search, selectedDept);
      } else {
        if (!formData.password) {
          Swal.fire({
            icon: 'warning',
            title: 'ແຈ້ງເຕືອນ',
            text: 'ກະລຸນາປ້ອນລະຫັດຜ່ານສຳລັບຜູ້ໃຊ້ໃໝ່',
          });
          return;
        }
        await api.createUser(formData);
        Swal.fire({
          icon: 'success',
          title: 'ເພີ່ມຜູ້ໃຊ້ສຳເລັດ',
          timer: 1500,
          showConfirmButton: false,
        });
        setFormOpen(false);
        // Reset filters and page to 1 so the new user immediately appears at the top
        setSearch('');
        setSelectedDept('');
        setPage(1);
        await fetchUsers(1, '', '');
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'ເກີດຂໍ້ຜິດພາດ',
        text: err.message || 'ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້',
      });
    }
  };

  const handleDelete = async (u: User) => {
    const result = await Swal.fire({
      title: '⚠️ ຢືນຢັນການລຶບ / ລະງັບຜູ້ໃຊ້?',
      text: `ທ່ານຕ້ອງການລະງັບການນຳໃຊ້ຂອງ "${u.username} - ${u.employee?.fullNameLao || ''}" ແທ້ບໍ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ລະງັບຜູ້ໃຊ້',
      cancelButtonText: 'ຍົກເລີກ',
    });

    if (result.isConfirmed) {
      try {
        await api.deleteUser(u.id);
        Swal.fire({
          icon: 'success',
          title: 'ລະງັບຜູ້ໃຊ້ສຳເລັດ',
          timer: 1500,
          showConfirmButton: false,
        });
        fetchUsers();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'ເກີດຂໍ້ຜິດພາດ',
          text: err.message || 'ບໍ່ສາມາດລະງັບຜູ້ໃຊ້ໄດ້',
        });
      }
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'ຊື່ ແລະ ນາມສະກຸນ',
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.avatarUrl || item.employee?.avatarUrl ? (
            <img
              src={item.avatarUrl || item.employee?.avatarUrl || ''}
              alt={item.employee?.fullNameLao || item.username}
              className="w-7 h-[42px] rounded object-cover shrink-0 shadow-2xs border border-slate-200"
              title="ຮູບຂະໜາດ 2x3 cm"
            />
          ) : (
            <div className="w-7 h-[42px] rounded bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {item.employee?.fullNameLao?.charAt(0) || item.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-slate-900">
                {item.employee?.fullNameLao || item.username}
              </p>
              {item.employee?.employeeCode && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded border border-blue-200">
                  {item.employee.employeeCode}
                </span>
              )}
            </div>
            {item.employee?.fullNameEn && (
              <p className="text-[11px] text-slate-400">{item.employee.fullNameEn}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'username',
      header: 'ຊື່ຜູ້ໃຊ້ (Username)',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {item.username}
        </span>
      ),
    },
    {
      key: 'department',
      header: 'ພະແນກ',
      render: (item) => (
        <span className="text-slate-800 font-medium text-xs">
          {item.department?.nameLao || '-'}
        </span>
      ),
    },
    {
      key: 'position',
      header: 'ຕຳແໜ່ງ',
      render: (item) => (
        <span className="text-slate-700 text-xs font-medium">
          {item.position?.nameLao || '-'}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'ສິດທິ (Role)',
      render: (item) => (
        <span className="inline-flex items-center gap-1 font-semibold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
          <Shield className="w-3 h-3" />
          {item.role?.nameLao || item.role?.name}
        </span>
      ),
    },
    {
      key: 'contact',
      header: 'ຕິດຕໍ່',
      render: (item) => (
        <div className="text-slate-500 text-xs space-y-0.5">
          {item.phone && <p>{item.phone}</p>}
          {item.email && <p className="text-[10px] text-slate-400">{item.email}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'ສະຖານະ',
      render: (item) =>
        item.isActive ? (
          <Badge variant="success" size="sm">
            ເປີດໃຊ້ງານ
          </Badge>
        ) : (
          <Badge variant="danger" size="sm">
            ລະງັບ
          </Badge>
        ),
    },
    {
      key: 'actions',
      header: 'ຈັດການ',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleOpenEdit(item)}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="ແກ້ໄຂ"
          >
            <Edit className="w-4 h-4" />
          </button>
          {item.username !== 'admin' && (
            <button
              onClick={() => handleDelete(item)}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="ລຶບ / ລະງັບ"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-sky-50/90 via-blue-50/60 to-indigo-50/40 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-sky-200/70 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-white via-sky-50 to-blue-100 border-2 border-sky-300/80 shadow-md shadow-sky-500/15 flex items-center justify-center p-0.5 flex-shrink-0 group hover:scale-105 transition-all duration-300 overflow-hidden">
            <img
              src="/icons/employees-icon.png?v=1"
              alt="Icon ຜູ້ໃຊ້ງານເຂົ້າລະບົບ"
              className="w-full h-full object-contain rounded-full drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.nav.employees}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              ຄຸ້ມຄອງບັນຊີຜູ້ໃຊ້ງານເຂົ້າລະບົບ, ຂໍ້ມູນພະນັກງານ ແລະ ການກຳນົດສິດ (RBAC)
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          className="text-[16px] font-semibold py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700/30 shadow-md shadow-blue-600/20"
        >
          <Plus className="w-5 h-5 mr-1 text-white" />
          ເພີ່ມຜູ້ໃຊ້ໃໝ່
        </Button>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={loading}
        searchPlaceholder="ຄົ້ນຫາຊື່, ຊື່ຜູ້ໃຊ້, ເບີໂທ..."
        searchValue={search}
        onSearchChange={setSearch}
        filterSlot={
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">ພະແນກ (ທັງໝົດ)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nameLao}
              </option>
            ))}
          </select>
        }
        pagination={{
          total,
          page,
          limit,
          onPageChange: setPage,
        }}
      />

      {/* Create / Edit User Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingUser ? 'ແກ້ໄຂຂໍ້ມູນຜູ້ໃຊ້' : 'ເພີ່ມຜູ້ໃຊ້ໃໝ່'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Avatar / Photo Upload Field (2x3 cm) */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50/90 rounded-2xl border border-slate-200">
            <div className="relative group shrink-0">
              <div className="w-[76px] h-[114px] min-w-[76px] min-h-[114px] rounded-lg overflow-hidden border-2 border-dashed border-blue-400 bg-white flex flex-col items-center justify-center shadow-xs p-0.5">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt="ຮູບຂະໜາດ 2x3 cm"
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <div className="text-center p-1 text-slate-400">
                    <Camera className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                    <span className="text-[10px] font-bold text-slate-700 block leading-tight">2x3 cm</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">ຂະໜາດຕິດບັດ</span>
                  </div>
                )}
              </div>

              {formData.avatarUrl && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, avatarUrl: '' })}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md ring-2 ring-white"
                  title="ລຶບຮູບ"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <label className="text-xs font-bold text-slate-800">
                  ຮູບປະຈຳຕົວຜູ້ໃຊ້ (ຂະໜາດມາດຕະຖານ 2x3 cm)
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                  2x3 cm
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                ອັບໂຫລດຮູບໜ້າກົງຂະໜາດຕິດບັດ 2x3 cm (ອັດຕາສ່ວນ 2:3) ສຳລັບຕິດບັດພະນັກງານ ແລະ ສະແດງໃນລະບົບ
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>ເລືອກຮູບ 2x3 cm...</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                </label>
                {formData.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, avatarUrl: '' })}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50"
                  >
                    ລຶບຮູບອອກ
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="ລະຫັດພະນັກງານ (Employee Code)"
              value={formData.employeeCode}
              onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
              placeholder={editingUser ? 'EMP-XXXX' : 'ອັດຕະໂນມັດ (EMP-XXXX)'}
              disabled={Boolean(editingUser)}
            />

            <Input
              label="ຊື່ຜູ້ໃຊ້ (Username) *"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="ເຊັ່ນ: somsack"
              required
            />

            <Input
              label={editingUser ? 'ລະຫັດຜ່ານໃໝ່ (ປະວ່າງຫາກບໍ່ປ່ຽນ)' : 'ລະຫັດຜ່ານ (Password)'}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required={!editingUser}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="ຊື່ ແລະ ນາມສະກຸນ (ພາສາລາວ)"
              value={formData.fullNameLao}
              onChange={(e) => setFormData({ ...formData, fullNameLao: e.target.value })}
              placeholder="ເຊັ່ນ: ທ່ານ ສົມສັກ ສີສຸວັນ"
              required
            />

            <Input
              label="Full Name (English)"
              value={formData.fullNameEn}
              onChange={(e) => setFormData({ ...formData, fullNameEn: e.target.value })}
              placeholder="e.g. Mr. Somsack Sisuvanh"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ສິດທິໃນລະບົບ (Role) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white"
                required
              >
                <option value="">-- ເລືອກ Role --</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nameLao} ({r.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ພະແນກ
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white"
              >
                <option value="">-- ເລືອກພະແນກ --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameLao}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ຕຳແໜ່ງ
              </label>
              <select
                value={formData.positionId}
                onChange={(e) => setFormData({ ...formData, positionId: e.target.value })}
                className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white"
              >
                <option value="">-- ເລືອກຕຳແໜ່ງ --</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameLao}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="ເບີໂທລະສັບ"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="020 XXXXXXXX"
            />
            <Input
              label="ອີເມວ"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@eoffice.la"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              ຍົກເລີກ
            </Button>
            <Button type="submit" variant="primary">
              {editingUser ? 'ບັນທຶກການແກ້ໄຂ' : 'ສ້າງຜູ້ໃຊ້ໃໝ່'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
