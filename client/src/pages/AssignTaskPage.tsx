import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  Pin,
  Plus,
  Users,
  Building,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { api } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Department, User, Document } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const AssignTaskPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    documentId: '',
    assignedToId: '',
    departmentId: '',
    priority: 'NORMAL',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [deptRes, userRes, docRes] = await Promise.all([
          api.getDepartments(),
          api.getUsers({ limit: 100 }),
          api.getAllDocuments({ limit: 50 }),
        ]);
        if (deptRes.success) setDepartments(deptRes.data);
        if (userRes.success) setUsers(userRes.data);
        if (docRes.success) setDocuments(docRes.data);
      } catch (e) {
        // ignore
      }
    };
    loadMetadata();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDocSelect = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      setFormData((prev) => ({
        ...prev,
        documentId: doc.id,
        title: `ດຳເນີນການຕາມເອກະສານ: ${doc.documentNumber} - ${doc.title}`,
        departmentId: doc.departmentId || prev.departmentId,
        description: doc.description || prev.description,
      }));
    } else {
      setFormData((prev) => ({ ...prev, documentId: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.assignedToId || !formData.departmentId) {
      Swal.fire({
        icon: 'warning',
        title: 'ແຈ້ງເຕືອນ',
        text: 'ກະລຸນາປ້ອນ: ຫົວຂໍ້ວຽກ, ຜູ້ຮັບຜິດຊອບ, ແລະ ພະແນກ',
        confirmButtonText: 'ຕົກລົງ',
      });
      return;
    }

    setLoading(true);

    try {
      await api.createTask(formData);

      await Swal.fire({
        icon: 'success',
        title: 'ມອບໝາຍວຽກສຳເລັດ',
        text: 'ລະບົບໄດ້ບັນທຶກການມອບໝາຍ ແລະ ແຈ້ງເຕືອນຜູ້ຮັບຜິດຊອບຮຽບຮ້ອຍແລ້ວ',
        timer: 2000,
        showConfirmButton: false,
      });

      setFormData({
        title: '',
        documentId: '',
        assignedToId: '',
        departmentId: '',
        priority: 'NORMAL',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        description: '',
        notes: '',
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'ເກີດຂໍ້ຜິດພາດ',
        text: err.message || 'ບໍ່ສາມາດມອບໝາຍວຽກໄດ້',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = formData.departmentId
    ? users.filter((u) => u.departmentId === formData.departmentId)
    : users;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/40 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-blue-200/70 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-indigo-300/80 shadow-md shadow-indigo-500/15 flex items-center justify-center p-1.5 flex-shrink-0 group hover:scale-105 transition-all duration-300 overflow-hidden">
            <img
              src="/icons/assign-task-icon.png?v=2"
              alt="Icon ມອບໝາຍວຽກງານໃໝ່"
              className="w-full h-full object-contain rounded-xl drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.tasks.assignTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              ມອບໝາຍວຽກງານຕາມສາຍການບັງຄັບບັນຊາ ແລະ ລະບົບລຳດັບຊັ້ນອົງກອນ (Director → Dept Head → Unit Head → Officer)
            </p>
          </div>
        </div>
      </div>

      {/* Main Assignment Form Card */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5 text-xs sm:text-sm">
          {/* Related Document Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>ເອກະສານກ່ຽວຂ້ອງ (ທາງເລືອກ)</span>
            </label>
            <select
              value={formData.documentId}
              onChange={(e) => handleDocSelect(e.target.value)}
              className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">-- ເລືອກເອກະສານທີ່ຜູກພັນກັບວຽກນີ້ --</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.documentNumber}] {d.title} ({d.department?.nameLao})
                </option>
              ))}
            </select>
          </div>

          {/* Task Title */}
          <div>
            <Input
              label="ຫົວຂໍ້ວຽກງານທີ່ມອບໝາຍ"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="ເຊັ່ນ: ກວດກາ ແລະ ສັງລວມບົດລາຍງານການເງິນໄຕມາດ 4..."
              required
            />
          </div>

          {/* Department & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-600" />
                <span>ພະແນກຮັບຜິດຊອບ</span> <span className="text-red-500">*</span>
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                required
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span>ມອບໝາຍໃຫ້ (ຜູ້ໃຊ້ງານເຂົ້າລະບົບ)</span> <span className="text-red-500">*</span>
              </label>
              <select
                name="assignedToId"
                value={formData.assignedToId}
                onChange={handleChange}
                className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">-- ເລືອກຜູ້ຮັບຜິດຊອບ --</option>
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.employee?.fullNameLao || u.username} ({u.role?.nameLao})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority, Start Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ລະດັບຄວາມຮີບດ່ວນ
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="NORMAL">🔹 ປົກກະຕິ (Normal)</option>
                <option value="HIGH">🔺 ສູງ (High)</option>
                <option value="URGENT">⚡ ຮີບດ່ວນ (Urgent)</option>
                <option value="URGENTEST">🚨 ຮີບດ່ວນທີ່ສຸດ (Most Urgent)</option>
                <option value="LOW">🔽 ຕ່ຳ (Low)</option>
              </select>
            </div>

            <Input
              type="date"
              label="ວັນທີເລີ່ມປະຕິບັດ"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
            />

            <Input
              type="date"
              label="ກຳນົດສົ່ງ (Due Date)"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
            />
          </div>

          {/* Description & Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ເນື້ອໃນວຽກ / ຄຳແນະນຳໃນການຈັດຕັ້ງປະຕິບັດ
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="ອະທິບາຍຂອບເຂດວຽກງານ, ເປົ້າໝາຍ, ແລະ ຄຳແນະນຳລະອຽດ..."
              className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <Input
              label="ໝາຍເຫດເພີ່ມເຕີມ"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="ໝາຍເຫດ..."
            />
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
            <Button type="submit" variant="primary" size="lg" isLoading={loading}>
              <Pin className="w-4 h-4 mr-1.5" />
              ຢືນຢັນການມອບໝາຍວຽກ
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
