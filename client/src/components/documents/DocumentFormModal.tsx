import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { Upload, X, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../api/client';
import { Department, DocumentType } from '../../types';

export interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'incoming' | 'outgoing';
  onSuccess: () => void;
  initialData?: any;
}

const DEFAULT_LHSE_RESEARCHER = 'ທ່ານ ສຸກສະຫວັນ ດວງດາລາ';
const INITIAL_UNITS = [
  'ໜ່ວຍງານ R&D',
  'ໜ່ວຍງານປະສານງານ',
  'ໜ່ວຍງານວິສະວະກຳ',
];
const STORAGE_KEY_UNITS = 'edoc_custom_units_list';
const DEFAULT_LHSE_UNIT = 'ໜ່ວຍງານ R&D';
const DEFAULT_COMMENT_UNIT = '';
const DEFAULT_COMMENT_DEPUTY_DEPT = '';
const DEFAULT_COMMENT_DEPT_HEAD = '';
const DEFAULT_COMMENT_DEPUTY_DIRECTOR = '';
const DEFAULT_COMMENT_DIRECTOR = '';

const DEFAULT_SIGN_UNIT = 'ທ່ານ ສຸກສະຫວັນ ດວງດາລາ';
const DEFAULT_SIGN_DEPUTY_DEPT = 'ທ່ານ ຄຳແພງ ໄຊຍະວົງ';
const DEFAULT_SIGN_DEPT_HEAD = 'ທ່ານ ນາງ ວິໄລພອນ ແກ້ວມະນີ';
const DEFAULT_SIGN_DEPUTY_DIRECTOR = '';
const getStoredDirectorName = () => {
  try {
    const saved = localStorage.getItem('edoc_org_chart_leadership_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.director?.name) return parsed.director.name;
    }
  } catch (e) {}
  return 'ທ່ານ ບຸນມີ ວົງສະຫວັນ';
};
const DEFAULT_SIGN_DIRECTOR = getStoredDirectorName();

export const DocumentFormModal: React.FC<DocumentFormModalProps> = ({
  isOpen,
  onClose,
  type,
  onSuccess,
  initialData,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  // Units list state (seeded with R&D, Coordination, Engineering, persisted in localStorage)
  const [unitList, setUnitList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNITS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set([...INITIAL_UNITS, ...parsed.map((s: any) => String(s).trim()).filter(Boolean)]));
        }
      }
    } catch (e) {}
    return INITIAL_UNITS;
  });
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    originalDocNumber: '',
    docNumber: '',
    docDate: new Date().toISOString().split('T')[0],
    receivedDate: new Date().toISOString().split('T')[0],
    receivedTime: '08:30',
    senderOrg: '',
    senderName: '',
    recipientOrg: '',
    recipientName: '',
    subject: '',
    typeId: '',
    priority: 'NORMAL',
    confidentialLevel: 'NORMAL',
    departmentId: '',
    description: '',
    dueDate: '',
    notes: '',
    purpose: type === 'incoming' ? 'ຄົ້ນຄວ້າ' : 'ເພື່ອຂໍອະນຸມັດ',
    researcher: DEFAULT_LHSE_RESEARCHER,
    unitName: DEFAULT_LHSE_UNIT,
    commentUnit: DEFAULT_COMMENT_UNIT,
    commentDeputyDept: DEFAULT_COMMENT_DEPUTY_DEPT,
    commentDeptHead: DEFAULT_COMMENT_DEPT_HEAD,
    commentDeputyDirector: DEFAULT_COMMENT_DEPUTY_DIRECTOR,
    commentDirector: DEFAULT_COMMENT_DIRECTOR,
    signUnit: DEFAULT_SIGN_UNIT,
    dateUnit: new Date().toISOString().split('T')[0],
    signImageUnit: '',
    sealImageUnit: '',
    signDeputyDept: DEFAULT_SIGN_DEPUTY_DEPT,
    dateDeputyDept: new Date().toISOString().split('T')[0],
    signImageDeputyDept: '',
    sealImageDeputyDept: '',
    signDeptHead: DEFAULT_SIGN_DEPT_HEAD,
    dateDeptHead: new Date().toISOString().split('T')[0],
    signImageDeptHead: '',
    sealImageDeptHead: '',
    signDeputyDirector: DEFAULT_SIGN_DEPUTY_DIRECTOR,
    dateDeputyDirector: '',
    signImageDeputyDirector: '',
    sealImageDeputyDirector: '',
    signDirector: DEFAULT_SIGN_DIRECTOR,
    dateDirector: new Date().toISOString().split('T')[0],
    signImageDirector: '',
    sealImageDirector: '',
  });

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [deptRes, typeRes] = await Promise.all([
          api.getDepartments(),
          api.getDocumentTypes(),
        ]);
        if (deptRes.success && deptRes.data) {
          setDepartments(deptRes.data);
          if (deptRes.data.length > 0) {
            setFormData(prev => ({
              ...prev,
              departmentId: prev.departmentId || deptRes.data[0].id
            }));
          }
        }
        if (typeRes.success && typeRes.data) {
          setDocTypes(typeRes.data);
          if (typeRes.data.length > 0) {
            setFormData(prev => ({
              ...prev,
              typeId: prev.typeId || typeRes.data[0].id
            }));
          }
        }
      } catch (e) {
        // ignore
      }
    };
    if (isOpen) {
      fetchMeta();
      if (!initialData) {
        setSelectedFile(null);
        setFormData({
          originalDocNumber: '',
          docNumber: '',
          docDate: new Date().toISOString().split('T')[0],
          receivedDate: new Date().toISOString().split('T')[0],
          receivedTime: '08:30',
          senderOrg: '',
          senderName: '',
          recipientOrg: '',
          recipientName: '',
          subject: '',
          typeId: docTypes[0]?.id || '',
          priority: 'NORMAL',
          confidentialLevel: 'NORMAL',
          departmentId: departments[0]?.id || '',
          description: '',
          dueDate: '',
          notes: '',
          purpose: type === 'incoming' ? 'ຄົ້ນຄວ້າ' : 'ເພື່ອຂໍອະນຸມັດ',
          researcher: DEFAULT_LHSE_RESEARCHER,
          unitName: DEFAULT_LHSE_UNIT,
          commentUnit: DEFAULT_COMMENT_UNIT,
          commentDeputyDept: DEFAULT_COMMENT_DEPUTY_DEPT,
          commentDeptHead: DEFAULT_COMMENT_DEPT_HEAD,
          commentDeputyDirector: DEFAULT_COMMENT_DEPUTY_DIRECTOR,
          commentDirector: DEFAULT_COMMENT_DIRECTOR,
          signUnit: DEFAULT_SIGN_UNIT,
          dateUnit: new Date().toISOString().split('T')[0],
          signImageUnit: '',
          sealImageUnit: '',
          signDeputyDept: DEFAULT_SIGN_DEPUTY_DEPT,
          dateDeputyDept: new Date().toISOString().split('T')[0],
          signImageDeputyDept: '',
          sealImageDeputyDept: '',
          signDeptHead: DEFAULT_SIGN_DEPT_HEAD,
          dateDeptHead: new Date().toISOString().split('T')[0],
          signImageDeptHead: '',
          sealImageDeptHead: '',
          signDeputyDirector: DEFAULT_SIGN_DEPUTY_DIRECTOR,
          dateDeputyDirector: '',
          signImageDeputyDirector: '',
          sealImageDeputyDirector: '',
          signDirector: DEFAULT_SIGN_DIRECTOR,
          dateDirector: new Date().toISOString().split('T')[0],
          signImageDirector: '',
          sealImageDirector: '',
        });
      } else {
        const rawNotes = initialData.notes || '';
        let parsedPurpose = type === 'incoming' ? 'ຄົ້ນຄວ້າ' : 'ເພື່ອຂໍອະນຸມັດ';
        let parsedResearcher = DEFAULT_LHSE_RESEARCHER;
        let parsedUnit = DEFAULT_LHSE_UNIT;
        let parsedCommentUnit = DEFAULT_COMMENT_UNIT;
        let parsedCommentDeputyDept = DEFAULT_COMMENT_DEPUTY_DEPT;
        let parsedCommentDeptHead = DEFAULT_COMMENT_DEPT_HEAD;
        let parsedCommentDeputyDirector = DEFAULT_COMMENT_DEPUTY_DIRECTOR;
        let parsedCommentDirector = DEFAULT_COMMENT_DIRECTOR;
        let parsedSignUnit = DEFAULT_SIGN_UNIT;
        let parsedDateUnit = new Date().toISOString().split('T')[0];
        let parsedSignImageUnit = '';
        let parsedSealImageUnit = '';
        let parsedSignDeputyDept = DEFAULT_SIGN_DEPUTY_DEPT;
        let parsedDateDeputyDept = new Date().toISOString().split('T')[0];
        let parsedSignImageDeputyDept = '';
        let parsedSealImageDeputyDept = '';
        let parsedSignDeptHead = DEFAULT_SIGN_DEPT_HEAD;
        let parsedDateDeptHead = new Date().toISOString().split('T')[0];
        let parsedSignImageDeptHead = '';
        let parsedSealImageDeptHead = '';
        let parsedSignDeputyDirector = DEFAULT_SIGN_DEPUTY_DIRECTOR;
        let parsedDateDeputyDirector = '';
        let parsedSignImageDeputyDirector = '';
        let parsedSealImageDeputyDirector = '';
        let parsedSignDirector = DEFAULT_SIGN_DIRECTOR;
        let parsedDateDirector = new Date().toISOString().split('T')[0];
        let parsedSignImageDirector = '';
        let parsedSealImageDirector = '';
        let cleanNotes = rawNotes;

        try {
          if (rawNotes.trim().startsWith('{')) {
            const parsedObj = JSON.parse(rawNotes);
            if (parsedObj.purpose) parsedPurpose = parsedObj.purpose;
            if (parsedObj.researcher) parsedResearcher = parsedObj.researcher;
            if (parsedObj.unitName) parsedUnit = parsedObj.unitName;
            if (parsedObj.commentUnit !== undefined) parsedCommentUnit = parsedObj.commentUnit;
            if (parsedObj.commentDeputyDept !== undefined) parsedCommentDeputyDept = parsedObj.commentDeputyDept;
            if (parsedObj.commentDeptHead !== undefined) parsedCommentDeptHead = parsedObj.commentDeptHead;
            if (parsedObj.commentDeputyDirector !== undefined) parsedCommentDeputyDirector = parsedObj.commentDeputyDirector;
            if (parsedObj.commentDirector !== undefined) parsedCommentDirector = parsedObj.commentDirector;
            if (parsedObj.signUnit !== undefined) parsedSignUnit = parsedObj.signUnit;
            if (parsedObj.dateUnit !== undefined) parsedDateUnit = parsedObj.dateUnit;
            if (parsedObj.signImageUnit !== undefined) parsedSignImageUnit = parsedObj.signImageUnit;
            if (parsedObj.sealImageUnit !== undefined) parsedSealImageUnit = parsedObj.sealImageUnit;
            if (parsedObj.signDeputyDept !== undefined) parsedSignDeputyDept = parsedObj.signDeputyDept;
            if (parsedObj.dateDeputyDept !== undefined) parsedDateDeputyDept = parsedObj.dateDeputyDept;
            if (parsedObj.signImageDeputyDept !== undefined) parsedSignImageDeputyDept = parsedObj.signImageDeputyDept;
            if (parsedObj.sealImageDeputyDept !== undefined) parsedSealImageDeputyDept = parsedObj.sealImageDeputyDept;
            if (parsedObj.signDeptHead !== undefined) parsedSignDeptHead = parsedObj.signDeptHead;
            if (parsedObj.dateDeptHead !== undefined) parsedDateDeptHead = parsedObj.dateDeptHead;
            if (parsedObj.signImageDeptHead !== undefined) parsedSignImageDeptHead = parsedObj.signImageDeptHead;
            if (parsedObj.sealImageDeptHead !== undefined) parsedSealImageDeptHead = parsedObj.sealImageDeptHead;
            if (parsedObj.signDeputyDirector !== undefined) parsedSignDeputyDirector = parsedObj.signDeputyDirector;
            if (parsedObj.dateDeputyDirector !== undefined) parsedDateDeputyDirector = parsedObj.dateDeputyDirector;
            if (parsedObj.signImageDeputyDirector !== undefined) parsedSignImageDeputyDirector = parsedObj.signImageDeputyDirector;
            if (parsedObj.sealImageDeputyDirector !== undefined) parsedSealImageDeputyDirector = parsedObj.sealImageDeputyDirector;
            if (parsedObj.signDirector !== undefined) parsedSignDirector = parsedObj.signDirector;
            if (parsedObj.dateDirector !== undefined) parsedDateDirector = parsedObj.dateDirector;
            if (parsedObj.signImageDirector !== undefined) parsedSignImageDirector = parsedObj.signImageDirector;
            if (parsedObj.sealImageDirector !== undefined) parsedSealImageDirector = parsedObj.sealImageDirector;
            if (parsedObj.userNotes !== undefined) cleanNotes = parsedObj.userNotes;
          }
        } catch (e) {}

        if (rawNotes.includes('[LHSE_PURPOSE:')) {
          parsedPurpose = rawNotes.split('[LHSE_PURPOSE:')[1]?.split(']')[0] || parsedPurpose;
          cleanNotes = cleanNotes.replace(/\[LHSE_PURPOSE:.*?\]/g, '').trim();
        }
        if (rawNotes.includes('[LHSE_RESEARCHER:')) {
          parsedResearcher = rawNotes.split('[LHSE_RESEARCHER:')[1]?.split(']')[0] || parsedResearcher;
          cleanNotes = cleanNotes.replace(/\[LHSE_RESEARCHER:.*?\]/g, '').trim();
        }
        if (rawNotes.includes('[LHSE_UNIT:')) {
          parsedUnit = rawNotes.split('[LHSE_UNIT:')[1]?.split(']')[0] || parsedUnit;
          cleanNotes = cleanNotes.replace(/\[LHSE_UNIT:.*?\]/g, '').trim();
        }

        setFormData({
          originalDocNumber: initialData.originalDocNumber || '',
          docNumber: initialData.docNumber || '',
          docDate: initialData.docDate ? initialData.docDate.split('T')[0] : '',
          receivedDate: initialData.receivedDate ? initialData.receivedDate.split('T')[0] : '',
          receivedTime: initialData.receivedTime || '08:30',
          senderOrg: initialData.senderOrg || '',
          senderName: initialData.senderName || '',
          recipientOrg: initialData.recipientOrg || '',
          recipientName: initialData.recipientName || '',
          subject: initialData.subject || '',
          typeId: initialData.typeId || '',
          priority: initialData.priority || 'NORMAL',
          confidentialLevel: initialData.confidentialLevel || 'NORMAL',
          departmentId: initialData.departmentId || '',
          description: initialData.description || '',
          dueDate: initialData.dueDate ? initialData.dueDate.split('T')[0] : '',
          notes: cleanNotes,
          purpose: parsedPurpose,
          researcher: parsedResearcher,
          unitName: parsedUnit,
          commentUnit: parsedCommentUnit,
          commentDeputyDept: parsedCommentDeputyDept,
          commentDeptHead: parsedCommentDeptHead,
          commentDeputyDirector: parsedCommentDeputyDirector,
          commentDirector: parsedCommentDirector,
          signUnit: parsedSignUnit,
          dateUnit: parsedDateUnit,
          signImageUnit: parsedSignImageUnit,
          sealImageUnit: parsedSealImageUnit || '',
          signDeputyDept: parsedSignDeputyDept,
          dateDeputyDept: parsedDateDeputyDept,
          signImageDeputyDept: parsedSignImageDeputyDept,
          sealImageDeputyDept: parsedSealImageDeputyDept || '',
          signDeptHead: parsedSignDeptHead,
          dateDeptHead: parsedDateDeptHead,
          signImageDeptHead: parsedSignImageDeptHead,
          sealImageDeptHead: parsedSealImageDeptHead || '',
          signDeputyDirector: parsedSignDeputyDirector,
          dateDeputyDirector: parsedDateDeputyDirector,
          signImageDeputyDirector: parsedSignImageDeputyDirector,
          sealImageDeputyDirector: parsedSealImageDeputyDirector || '',
          signDirector: parsedSignDirector,
          dateDirector: parsedDateDirector,
          signImageDirector: parsedSignImageDirector,
          sealImageDirector: parsedSealImageDirector || '',
        });
      }
    }
  }, [isOpen, initialData]);

  // Displayed units includes current unitName if not in list
  const displayedUnits = useMemo(() => {
    if (formData.unitName && !unitList.includes(formData.unitName)) {
      return [...unitList, formData.unitName];
    }
    return unitList;
  }, [unitList, formData.unitName]);

  const handleAddNewUnit = (nameToAdd?: string) => {
    const trimmed = (nameToAdd || newUnitName).trim();
    if (!trimmed) {
      Swal.fire({
        icon: 'warning',
        title: 'ແຈ້ງເຕືອນ',
        text: 'ກະລຸນາປ້ອນຊື່ໜ່ວຍງານໃໝ່',
        confirmButtonText: 'ຕົກລົງ',
      });
      return;
    }
    const updated = Array.from(new Set([...unitList, trimmed]));
    setUnitList(updated);
    try {
      localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(updated));
    } catch (e) {}
    setFormData((prev) => ({ ...prev, unitName: trimmed }));
    setNewUnitName('');
    setIsAddingUnit(false);
    Swal.fire({
      icon: 'success',
      title: 'ສຳເລັດ',
      text: `ເພີ່ມ "${trimmed}" ເຂົ້າໃນລາຍການໜ່ວຍງານຮຽບຮ້ອຍແລ້ວ`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleDeleteCustomUnit = (unitToDelete: string) => {
    if (INITIAL_UNITS.includes(unitToDelete)) return;
    Swal.fire({
      title: 'ຢືນຢັນການລຶບ?',
      text: `ທ່ານຕ້ອງການລຶບ "${unitToDelete}" ອອກຈາກລາຍການໜ່ວຍງານບໍ່?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ແມ່ນ, ລຶບອອກ',
      cancelButtonText: 'ຍົກເລີກ',
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = unitList.filter((u) => u !== unitToDelete);
        setUnitList(updated);
        try {
          localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(updated));
        } catch (e) {}
        if (formData.unitName === unitToDelete) {
          setFormData((prev) => ({ ...prev, unitName: INITIAL_UNITS[0] }));
        }
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'ແຈ້ງເຕືອນ',
        text: 'ກະລຸນາປ້ອນຫົວຂໍ້ເອກະສານ',
        confirmButtonText: 'ຕົກລົງ',
      });
      return;
    }

    if (type === 'incoming' && !formData.senderOrg.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'ແຈ້ງເຕືອນ',
        text: 'ກະລຸນາປ້ອນໜ່ວຍງານສົ່ງ',
        confirmButtonText: 'ຕົກລົງ',
      });
      return;
    }

    if (type === 'outgoing' && !formData.recipientOrg.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'ແຈ້ງເຕືອນ',
        text: 'ກະລຸນາປ້ອນໜ່ວຍງານຮັບ',
        confirmButtonText: 'ຕົກລົງ',
      });
      return;
    }

    const resolvedDeptId = formData.departmentId || departments[0]?.id || '';
    const resolvedTypeId = formData.typeId || docTypes[0]?.id || '';

    if (!resolvedDeptId) {
      Swal.fire({
        icon: 'warning',
        title: 'ແຈ້ງເຕືອນ',
        text: 'ກະລຸນາເລືອກພະແນກກ່ຽວຂ້ອງ',
        confirmButtonText: 'ຕົກລົງ',
      });
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        if (val) data.append(key, val);
      });
      data.set('departmentId', resolvedDeptId);
      data.set('typeId', resolvedTypeId);
      const packedNotesObj = {
        purpose: formData.purpose,
        researcher: formData.researcher,
        unitName: formData.unitName,
        commentUnit: formData.commentUnit,
        commentDeputyDept: formData.commentDeputyDept,
        commentDeptHead: formData.commentDeptHead,
        commentDeputyDirector: formData.commentDeputyDirector,
        commentDirector: formData.commentDirector,
        signUnit: formData.signUnit,
        dateUnit: formData.dateUnit,
        signImageUnit: formData.signImageUnit,
        sealImageUnit: formData.sealImageUnit,
        signDeputyDept: formData.signDeputyDept,
        dateDeputyDept: formData.dateDeputyDept,
        signImageDeputyDept: formData.signImageDeputyDept,
        sealImageDeputyDept: formData.sealImageDeputyDept,
        signDeptHead: formData.signDeptHead,
        dateDeptHead: formData.dateDeptHead,
        signImageDeptHead: formData.signImageDeptHead,
        sealImageDeptHead: formData.sealImageDeptHead,
        signDeputyDirector: formData.signDeputyDirector,
        dateDeputyDirector: formData.dateDeputyDirector,
        signImageDeputyDirector: formData.signImageDeputyDirector,
        sealImageDeputyDirector: formData.sealImageDeputyDirector,
        signDirector: formData.signDirector,
        dateDirector: formData.dateDirector,
        signImageDirector: formData.signImageDirector,
        sealImageDirector: formData.sealImageDirector,
        userNotes: formData.notes,
      };
      data.set('notes', JSON.stringify(packedNotesObj));
      if (selectedFile) {
        data.append('attachment', selectedFile);
      }

      if (type === 'incoming') {
        if (initialData?.id) {
          await api.updateIncomingDoc(initialData.id, data);
        } else {
          await api.createIncomingDoc(data);
        }
      } else {
        if (initialData?.id) {
          await api.updateOutgoingDoc(initialData.id, data);
        } else {
          await api.createOutgoingDoc(data);
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'ບັນທຶກຂໍ້ມູນສຳເລັດ',
        text: type === 'incoming' ? 'ລົງທະບຽນເອກະສານຂາເຂົ້າຮຽບຮ້ອຍແລ້ວ' : 'ສ້າງຮ່າງເອກະສານຂາອອກຮຽບຮ້ອຍແລ້ວ',
        timer: 2000,
        showConfirmButton: false,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'ເກີດຂໍ້ຜິດພາດ',
        text: err.message || 'ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້',
        confirmButtonText: 'ຕົກລົງ',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        type === 'incoming'
          ? initialData ? 'ແກ້ໄຂເອກະສານຂາເຂົ້າ' : 'ລົງທະບຽນເອກະສານຂາເຂົ້າໃໝ່'
          : initialData ? 'ແກ້ໄຂເອກະສານຂາອອກ' : 'ສ້າງຮ່າງເອກະສານຂາອອກໃໝ່'
      }
      subtitle="ກະລຸນາຕື່ມຂໍ້ມູນເອກະສານໃຫ້ຄົບຖ້ວນ ແລະ ຊັດເຈນ"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Row 1: Document Number & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label={type === 'incoming' ? 'ເລກທີເອກະສານຕົ້ນສະບັບ' : 'ເລກທີເອກະສານ'}
            name={type === 'incoming' ? 'originalDocNumber' : 'docNumber'}
            value={type === 'incoming' ? formData.originalDocNumber : formData.docNumber}
            onChange={handleChange}
            placeholder="ເຊັ່ນ: 108/ສນຍ"
          />

          <Input
            type="date"
            label="ລົງວັນທີເອກະສານ"
            name="docDate"
            value={formData.docDate}
            onChange={handleChange}
          />

          {type === 'incoming' ? (
            <Input
              type="date"
              label="ວັນທີຮັບເອກະສານ"
              name="receivedDate"
              value={formData.receivedDate}
              onChange={handleChange}
              required
            />
          ) : (
            <Input
              type="date"
              label="ກຳນົດສົ່ງ"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
            />
          )}
        </div>

        {/* Row 2: Sender / Recipient Org & Person */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {type === 'incoming' ? (
            <>
              <Input
                label="ໜ່ວຍງານສົ່ງ (ຈາກໃຜ)"
                name="senderOrg"
                value={formData.senderOrg}
                onChange={handleChange}
                placeholder="ເຊັ່ນ: ຫ້ອງວ່າການສຳນັກງານນາຍົກລັດຖະມົນຕີ"
                required
              />
              <Input
                label="ຜູ້ສົ່ງ / ລົງລາຍເຊັນ"
                name="senderName"
                value={formData.senderName}
                onChange={handleChange}
                placeholder="ເຊັ່ນ: ທ່ານ ສອນໄຊ ສີພັນດອນ"
              />
            </>
          ) : (
            <>
              <Input
                label="ໜ່ວຍງານຮັບ (ເຖິງໃຜ)"
                name="recipientOrg"
                value={formData.recipientOrg}
                onChange={handleChange}
                placeholder="ເຊັ່ນ: ກະຊວງພະລັງງານ ແລະ ບໍ່ແຮ່"
                required
              />
              <Input
                label="ຜູ້ຮັບ / ຕຳແໜ່ງ"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleChange}
                placeholder="ເຊັ່ນ: ຫົວໜ້າຫ້ອງການກະຊວງ"
              />
            </>
          )}
        </div>

        {/* Row 3: Subject */}
        <div>
          <Input
            label="ຫົວຂໍ້ / ເນື້ອໃນຫຍໍ້ເອກະສານ"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="ປ້ອນຫົວຂໍ້ ຫຼື ເນື້ອໃນສຳຄັນຂອງເອກະສານ..."
            required
          />
        </div>

        {/* Row 4: Type, Priority, Department */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ປະເພດເອກະສານ <span className="text-red-500">*</span>
            </label>
            <select
              name="typeId"
              value={formData.typeId}
              onChange={handleChange}
              className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">-- ເລືອກປະເພດ --</option>
              {docTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.nameLao} ({dt.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ລະດັບຄວາມສຳຄັນ
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ພະແນກກ່ຽວຂ້ອງ <span className="text-red-500">*</span>
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
        </div>

        {/* Row: LHSE Routing Slip Fields (Purpose, Researcher, Unit) */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              📋 ຂໍ້ມູນໃບຕິດຕາມ (LHSE Routing Slip)
            </span>
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  researcher: DEFAULT_LHSE_RESEARCHER,
                  unitName: DEFAULT_LHSE_UNIT,
                }));
              }}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline"
            >
              ຕັ້ງຄ່າເລີ່ມຕົ້ນຕາມໃບຕິດຕາມ LHSE
            </button>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ຈຸດປະສົງເອກະສານ
            </label>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              {type === 'outgoing' ? (
                <>
                  {['ເພື່ອປະຊຸມ', 'ເພື່ອຂໍຄຳເຫັນ', 'ເພື່ອຂໍອະນຸມັດ'].map((p) => (
                    <label key={p} className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="purpose"
                        value={p}
                        checked={formData.purpose === p}
                        onChange={handleChange}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{p}</span>
                    </label>
                  ))}
                </>
              ) : (
                <>
                  {['ຄົ້ນຄວ້າ', 'ຮັບຊາບ', 'ອື່ນໆ'].map((p) => (
                    <label key={p} className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="purpose"
                        value={p}
                        checked={formData.purpose === p}
                        onChange={handleChange}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{p}</span>
                    </label>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Researcher & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
            <Input
              label="ຜູ້ຄົ້ນຄວ້າ"
              name="researcher"
              value={formData.researcher}
              onChange={handleChange}
              placeholder="ຊື່ ແລະ ນາມສະກຸນ ຜູ້ຄົ້ນຄວ້າ..."
            />
            
            {/* Unit Dropdown Menu & Dynamic Add */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  ໜ່ວຍງານ <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {formData.unitName && !INITIAL_UNITS.includes(formData.unitName) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomUnit(formData.unitName)}
                      className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-0.5"
                      title="ລຶບໜ່ວຍງານນີ້ອອກຈາກລາຍການ"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>ລຶບ</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsAddingUnit((prev) => !prev)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
                    title="ເພີ່ມໜ່ວຍງານໃໝ່ໃສ່ຕາມຫຼັງ"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ເພີ່ມໜ່ວຍງານ</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <select
                  name="unitName"
                  value={formData.unitName}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsAddingUnit(true);
                    } else {
                      setFormData((prev) => ({ ...prev, unitName: e.target.value }));
                    }
                  }}
                  className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                >
                  <option value="">-- ເລືອກໜ່ວຍງານ --</option>
                  {displayedUnits.map((u) => (
                    <option key={u} value={u}>
                      🏢 {u}
                    </option>
                  ))}
                  <option value="__add_new__" className="text-blue-600 font-bold bg-blue-50">
                    ➕ ເພີ່ມໜ່ວຍງານໃໝ່ໃສ່ຕາມຫຼັງ...
                  </option>
                </select>

                {/* Inline Add New Unit Form */}
                {isAddingUnit && (
                  <div className="p-2.5 bg-blue-50/90 border border-blue-200 rounded-xl space-y-2 shadow-xs animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                        🏢 ເພີ່ມຊື່ໜ່ວຍງານໃໝ່:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingUnit(false);
                          setNewUnitName('');
                        }}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        placeholder="ເຊັ່ນ: ໜ່ວຍງານບໍລິຫານ, ໜ່ວຍງານການເງິນ..."
                        className="flex-1 py-1.5 px-3 text-xs bg-white rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewUnit();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddNewUnit()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs shrink-0"
                      >
                        ບັນທຶກ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingUnit(false);
                          setNewUnitName('');
                        }}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg shrink-0"
                      >
                        ຍົກເລີກ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Row 5: Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            ລາຍລະອຽດເພີ່ມເຕີມ
          </label>
          <textarea
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="ລາຍລະອຽດ, ເຫດຜົນ, ຫຼື ຄຳແນະນຳ..."
            className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Row 6: File Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            ໄຟລ໌ຄັດຕິດ (PDF, Word, Excel, ຮູບພາບ)
          </label>
          <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/50 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-xs text-slate-600 mb-1">
              {selectedFile ? (
                <span className="font-semibold text-blue-600">{selectedFile.name}</span>
              ) : (
                'ຄລິກເພື່ອເລືອກໄຟລ໌ ຫຼື ລາກໄຟລ໌ມາໃສ່ບ່ອນນີ້'
              )}
            </p>
            <p className="text-[11px] text-slate-400">ຮອງຮັບ: PDF, DOCX, XLSX, JPG, PNG (ສູງສຸດ 50MB)</p>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-2 text-xs"
              accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.zip"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>
            ຍົກເລີກ
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            {initialData ? 'ບັນທຶກການແກ້ໄຂ' : 'ບັນທຶກເອກະສານ'}
          </Button>
        </div>
      </form>

    </Modal>
  );
};
