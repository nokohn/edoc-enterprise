import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../api/client';
import { Department, User, Document } from '../../types';

export interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDocument?: any;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDocument,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    documentId: '',
    assignedToId: '',
    departmentId: '',
    priority: 'NORMAL',
    dueDate: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptRes, userRes] = await Promise.all([
          api.getDepartments(),
          api.getUsers({ limit: 100 }),
        ]);
        if (deptRes.success) setDepartments(deptRes.data);
        if (userRes.success) setUsers(userRes.data);
      } catch (e) {
        // ignore
      }
    };

    if (isOpen) {
      fetchMetadata();
      if (initialDocument) {
        setFormData((prev) => ({
          ...prev,
          title: `ດຳເນີນການຕາມເອກະສານ: ${initialDocument.incomingNumber || initialDocument.documentNumber} - ${initialDocument.subject || initialDocument.title}`,
          documentId: initialDocument.documentId || initialDocument.id,
          departmentId: initialDocument.departmentId || '',
          description: initialDocument.description || '',
          dueDate: initialDocument.dueDate ? initialDocument.dueDate.split('T')[0] : '',
        }));
      } else {
        setFormData({
          title: '',
          documentId: '',
          assignedToId: '',
          departmentId: '',
          priority: 'NORMAL',
          dueDate: '',
          description: '',
          notes: '',
        });
      }
    }
  }, [isOpen, initialDocument]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

      Swal.fire({
        icon: 'success',
        title: 'ມອບໝາຍວຽກສຳເລັດ',
        text: 'ລະບົບໄດ້ບັນທຶກການມອບໝາຍ ແລະ ແຈ້ງເຕືອນຜູ້ຮັບຜິດຊອບຮຽບຮ້ອຍແລ້ວ',
        timer: 2000,
        showConfirmButton: false,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'ເກີດຂໍ້ຜິດພາດ',
        text: err.message || 'ບໍ່ສາມາດມອບໝາຍວຽກໄດ້',
        confirmButtonText: 'ຕົກລົງ',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter users by selected department if department is selected
  const filteredUsers = formData.departmentId
    ? users.filter((u) => u.departmentId === formData.departmentId)
    : users;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white border border-indigo-200/80 shadow-xs flex items-center justify-center p-1 shrink-0 overflow-hidden">
            <img
              src="/icons/assign-task-icon.png?v=2"
              alt="Icon ມອບໝາຍວຽກງານໃໝ່"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold text-slate-900 block leading-tight">
              ມອບໝາຍວຽກງານໃໝ່ (Assign Work)
            </span>
          </div>
        </div>
      }
      subtitle="ມອບໝາຍວຽກງານຕາມສາຍການບັງຄັບບັນຊາ ແລະ ລະບົບລຳດັບຊັ້ນອົງກອນ"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Title */}
        <div>
          <Input
            label="ຫົວຂໍ້ວຽກງານ"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="ເຊັ່ນ: ຄົ້ນຄວ້າ ແລະ ສັງລວມບົດລາຍງານ..."
            required
          />
        </div>

        {/* Department & Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ພະແນກຮັບຜິດຊອບ <span className="text-red-500">*</span>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ມອບໝາຍໃຫ້ (ຜູ້ໃຊ້ງານເຂົ້າລະບົບ) <span className="text-red-500">*</span>
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

        {/* Priority & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            label="ກຳນົດສົ່ງ (Due Date)"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
          />
        </div>

        {/* Description / Instructions */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            ເນື້ອໃນວຽກ / ຄຳແນະນຳໃນການປະຕິບັດ
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

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>
            ຍົກເລີກ
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            ຢືນຢັນການມອບໝາຍ
          </Button>
        </div>
      </form>
    </Modal>
  );
};
