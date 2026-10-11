import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  FileText,
  CheckCircle2,
  RotateCcw,
  PenTool,
  Stamp,
  Edit3,
  Eye,
  Trash2,
  Calendar,
  Save,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { SignaturePadModal } from '../common/SignaturePadModal';
import { generateLhseStampSvg } from '../common/InlineSealPad';

export interface DocumentTrackingSheetProps {
  document?: any;
  onClose?: () => void;
  defaultType?: 'incoming' | 'outgoing';
  onSave?: (updatedData: any) => void;
}

export const DocumentTrackingSheet: React.FC<DocumentTrackingSheetProps> = ({
  document,
  onClose,
  defaultType,
  onSave,
}) => {
  // Determine if incoming or outgoing based on data or prop
  const isIncomingDoc =
    defaultType === 'incoming' ||
    Boolean(document?.incomingNumber) ||
    document?.flowType === 'INCOMING';

  const [sheetType, setSheetType] = useState<'incoming' | 'outgoing'>(
    defaultType || (isIncomingDoc ? 'incoming' : 'outgoing')
  );

  // Edit Mode toggle: when true, inline inputs and action buttons are active
  const [isEditable, setIsEditable] = useState<boolean>(true);

  // Active Signature Pad Modal
  const [signatureModal, setSignatureModal] = useState<{
    isOpen: boolean;
    fieldKey: string;
    title: string;
    signerName: string;
  } | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Format date helper: returns DD/MM/YYYY
  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Helper to extract workflow comment
  const getWorkflowComment = (keywords: string[]) => {
    const history =
      document?.document?.workflowHistory ||
      document?.workflowHistory ||
      [];
    const match = history.find((h: any) =>
      keywords.some(
        (k) =>
          h.actorPosition?.toLowerCase().includes(k.toLowerCase()) ||
          h.action?.toLowerCase().includes(k.toLowerCase())
      )
    );
    return match;
  };

  // Parse notes if JSON
  const parseNotes = () => {
    const notesText = document?.notes || '';
    try {
      if (notesText.trim().startsWith('{')) {
        return JSON.parse(notesText);
      }
    } catch (e) {}
    return null;
  };

  const parsedNotesObj = parseNotes();

  const getBoxValue = (fieldKey: string, roleKeywords: string[]) => {
    if (parsedNotesObj && parsedNotesObj[fieldKey]) {
      return parsedNotesObj[fieldKey];
    }
    return getWorkflowComment(roleKeywords)?.comment || '';
  };

  const getBoxDateValue = (fieldKey: string, roleKeywords: string[]) => {
    if (parsedNotesObj && parsedNotesObj[fieldKey]) {
      return parsedNotesObj[fieldKey];
    }
    const match = getWorkflowComment(roleKeywords);
    if (match?.createdAt) {
      return formatDate(match.createdAt);
    }
    return '';
  };

  const getSavedImage = (fieldKey: string) => {
    if (parsedNotesObj && parsedNotesObj[fieldKey]) {
      return parsedNotesObj[fieldKey];
    }
    return '';
  };

  // Local interactive form state
  const [formData, setFormData] = useState({
    // Header numbers
    incomingNumber: document?.incomingNumber || '',
    receivedDate: formatDate(document?.receivedDate || document?.createdAt) || '',
    originalDocNumber:
      document?.originalDocNumber || (sheetType === 'incoming' ? document?.docNumber : '') || '',
    outgoingNumber:
      document?.outgoingNumber || (sheetType === 'outgoing' ? document?.docNumber : '') || '',
    docDate: formatDate(document?.docDate) || '',
    docCodeSuffix: document?.docCodeSuffix || '',

    // Subject
    subject: document?.subject || document?.title || '',

    // Organization info
    departmentName: document?.department?.nameLao || 'ພະແນກພັດທະນາ',
    assignedUnit:
      document?.unitName ||
      parsedNotesObj?.unitName ||
      document?.department?.nameLao ||
      'ໜ່ວຍງານ R&D',
    researcherName:
      document?.researcher ||
      parsedNotesObj?.researcher ||
      document?.responsible?.fullNameLao ||
      document?.creator?.fullNameLao ||
      '',

    // Checklist options
    priority: document?.priority || 'NORMAL',
    confidentialLevel: document?.confidentialLevel || 'NORMAL',
    purpose:
      document?.purpose ||
      parsedNotesObj?.purpose ||
      (sheetType === 'incoming' ? 'ຄົ້ນຄວ້າ' : 'ເພື່ອຂໍອະນຸມັດ'),
    otherPurpose: parsedNotesObj?.otherPurpose || '',

    // 5 Approval Columns (Outgoing) & 3 Directive Boxes (Incoming)
    commentUnit: getBoxValue('commentUnit', ['Unit Head', 'ໜ່ວຍງານ']),
    dateUnit: getBoxDateValue('dateUnit', ['Unit Head', 'ໜ່ວຍງານ']),
    signImageUnit: getSavedImage('signImageUnit'),
    sealImageUnit: getSavedImage('sealImageUnit'),

    commentDeputyDept: getBoxValue('commentDeputyDept', ['Deputy Department Head', 'ຮອງຫົວໜ້າພະແນກ']),
    dateDeputyDept: getBoxDateValue('dateDeputyDept', ['Deputy Department Head', 'ຮອງຫົວໜ້າພະແນກ']),
    signImageDeputyDept: getSavedImage('signImageDeputyDept'),
    sealImageDeputyDept: getSavedImage('sealImageDeputyDept'),

    commentDeptHead: getBoxValue('commentDeptHead', ['Department Head', 'ຫົວໜ້າພະແນກ']),
    dateDeptHead: getBoxDateValue('dateDeptHead', ['Department Head', 'ຫົວໜ້າພະແນກ']),
    signImageDeptHead: getSavedImage('signImageDeptHead'),
    sealImageDeptHead: getSavedImage('sealImageDeptHead'),

    commentDeputyDirector: getBoxValue('commentDeputyDirector', ['Deputy Director', 'ຮອງຜູ້ອຳນວຍການ', 'ຮອງ ຜອ']),
    dateDeputyDirector: getBoxDateValue('dateDeputyDirector', ['Deputy Director', 'ຮອງຜູ້ອຳນວຍການ', 'ຮອງ ຜອ']),
    signImageDeputyDirector: getSavedImage('signImageDeputyDirector'),
    sealImageDeputyDirector: getSavedImage('sealImageDeputyDirector'),

    commentDirector: getBoxValue('commentDirector', ['Director', 'ຜູ້ອຳນວຍການ', 'ຜອ']),
    dateDirector: getBoxDateValue('dateDirector', ['Director', 'ຜູ້ອຳນວຍການ', 'ຜອ']),
    signImageDirector: getSavedImage('signImageDirector'),
    sealImageDirector: getSavedImage('sealImageDirector'),
  });

  // Re-sync with document prop if document changes
  useEffect(() => {
    if (document) {
      setFormData((prev) => ({
        ...prev,
        incomingNumber: document.incomingNumber || prev.incomingNumber,
        receivedDate: formatDate(document.receivedDate || document.createdAt) || prev.receivedDate,
        originalDocNumber: document.originalDocNumber || prev.originalDocNumber,
        outgoingNumber: document.outgoingNumber || prev.outgoingNumber,
        docDate: formatDate(document.docDate) || prev.docDate,
        subject: document.subject || document.title || prev.subject,
        departmentName: document.department?.nameLao || prev.departmentName,
        assignedUnit: document.unitName || document.department?.nameLao || prev.assignedUnit,
        researcherName:
          document.researcher ||
          document.responsible?.fullNameLao ||
          document.creator?.fullNameLao ||
          prev.researcherName,
      }));
    }
  }, [document]);

  // Handle direct text updates
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Quick fill today's date into a specific field
  const handleSetToday = (fieldName: string) => {
    const todayStr = formatDate(new Date());
    setFormData((prev) => ({ ...prev, [fieldName]: todayStr }));
  };

  // Open signature modal
  const handleOpenSignature = (fieldKey: string, title: string, signerName: string) => {
    setSignatureModal({
      isOpen: true,
      fieldKey,
      title,
      signerName,
    });
  };

  // Save drawn signature
  const handleSaveSignature = (dataUrl: string) => {
    if (signatureModal) {
      setFormData((prev) => ({
        ...prev,
        [signatureModal.fieldKey]: dataUrl,
      }));
      setSignatureModal(null);
    }
  };

  // Quick Apply LHSE Official Seal
  const handleApplySeal = (fieldKey: string, sealTitle?: string) => {
    const sealSvg = generateLhseStampSvg(
      sealTitle || formData.assignedUnit || 'ພະແນກພັດທະນາ',
      'ກວດກາຖືກຕ້ອງ'
    );
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: sealSvg,
    }));
  };

  // Remove Signature or Seal
  const handleRemoveAsset = (fieldKey: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: '',
    }));
  };

  // Reset entire form to blank
  const handleResetForm = () => {
    setFormData({
      incomingNumber: '',
      receivedDate: '',
      originalDocNumber: '',
      outgoingNumber: '',
      docDate: '',
      docCodeSuffix: '',
      subject: '',
      departmentName: 'ພະແນກພັດທະນາ',
      assignedUnit: 'ພະແນກພັດທະນາ',
      researcherName: '',
      priority: 'NORMAL',
      confidentialLevel: 'NORMAL',
      purpose: sheetType === 'incoming' ? 'ຄົ້ນຄວ້າ' : 'ເພື່ອຂໍອະນຸມັດ',
      otherPurpose: '',
      commentUnit: '',
      dateUnit: '',
      signImageUnit: '',
      sealImageUnit: '',
      commentDeputyDept: '',
      dateDeputyDept: '',
      signImageDeputyDept: '',
      sealImageDeputyDept: '',
      commentDeptHead: '',
      dateDeptHead: '',
      signImageDeptHead: '',
      sealImageDeptHead: '',
      commentDeputyDirector: '',
      dateDeputyDirector: '',
      signImageDeputyDirector: '',
      sealImageDeputyDirector: '',
      commentDirector: '',
      dateDirector: '',
      signImageDirector: '',
      sealImageDirector: '',
    });
    setToastMessage('ລ້າງຂໍ້ມູນໃນຟອມສຳເລັດແລ້ວ (Form reset)');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Save Form Data handler
  const handleSaveForm = () => {
    if (onSave) {
      onSave(formData);
    }
    // Also save in localStorage keyed by document ID or general slip
    const storageKey = document?.id ? `lhse_slip_${document.id}` : 'lhse_slip_draft';
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    } catch (e) {}

    setToastMessage('✅ ບັນທຶກຂໍ້ມູນໃບຕິດຕາມສຳເລັດແລ້ວ');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Native Print A4
  const handlePrint = () => {
    window.print();
  };

  const isUrgent = formData.priority === 'URGENT' || formData.priority === 'HIGH';
  const isSecret =
    formData.confidentialLevel === 'CONFIDENTIAL' || formData.confidentialLevel === 'SECRET';
  const isTopSecret = formData.confidentialLevel === 'TOP_SECRET';

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
        {/* Left: Mode & Type Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-slate-700">ຮູບແບບໃບຕິດຕາມ:</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
            <button
              onClick={() => setSheetType('incoming')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                sheetType === 'incoming'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ໃບຕິດຕາມເອກະສານ (ຂາເຂົ້າ)
            </button>
            <button
              onClick={() => setSheetType('outgoing')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                sheetType === 'outgoing'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ໃບຕິດຕາມເອກະສານ (ຂາອອກ)
            </button>
          </div>

          {/* Edit Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsEditable(!isEditable)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              isEditable
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="ເປີດ/ປິດ ໂໝດປ້ອນຂໍ້ມູນໂດຍກົງເທິງຟອມ"
          >
            {isEditable ? (
              <>
                <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                <span>ໂໝດປ້ອນຂໍ້ມູນ (Edit Mode)</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>ໂໝດພ້ອມພິມ (Preview Mode)</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Actions (Save, Reset, Print, Close) */}
        <div className="flex items-center gap-2">
          {/* Reset button */}
          <button
            type="button"
            onClick={handleResetForm}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
            title="ລ້າງຂໍ້ມູນໃນຟອມທັງໝົດເປັນຄ່າວ່າງ"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ລ້າງຟອມ</span>
          </button>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSaveForm}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            title="ບັນທຶກຂໍ້ມູນທີ່ປ້ອນໄວ້"
          >
            <Save className="w-3.5 h-3.5" />
            <span>ບັນທຶກ</span>
          </button>

          {/* Print button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 shadow-xs"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            ພິມ (Print A4)
          </Button>

          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4 mr-1" />
              ປິດ
            </Button>
          )}
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="no-print p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between animate-in fade-in duration-150">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* PRINTABLE & EDITABLE SHEET VIEWPORT */}
      {/* ======================================================== */}
      <div className="overflow-x-auto pb-4">
        <div
          id="printable-tracking-sheet"
          className="bg-white p-8 sm:p-10 border border-slate-300 text-slate-900 shadow-md max-w-4xl mx-auto font-sans leading-normal print:m-0 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none"
          style={{ minHeight: '600px' }}
        >
          {/* ======================================================== */}
          {/* TEMPLATE 1: ໃບຕິດຕາມເອກະສານ (ຂາເຂົ້າ) */}
          {/* ======================================================== */}
          {sheetType === 'incoming' && (
            <div className="border-2 border-slate-800 p-5 space-y-4 text-xs sm:text-sm">
              {/* Top Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
                {/* Left: Organization & Logo */}
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="LHSE Logo"
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://img2.pic.in.th/ChatGPT-Image-Sep-28-2026-11_11_54-AM.png';
                    }}
                  />
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
                      ລັດວິສາຫະກິດຖືຮຸ້ນລາວ
                    </h3>
                    {isEditable ? (
                      <input
                        type="text"
                        name="departmentName"
                        value={formData.departmentName}
                        onChange={handleChange}
                        placeholder="ພະແນກ..."
                        className="font-semibold text-xs sm:text-sm text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500 w-44"
                      />
                    ) : (
                      <p className="font-semibold text-xs sm:text-sm text-slate-800">
                        {formData.departmentName || 'ພະແນກພັດທະນາ'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Center Title */}
                <div className="text-center pt-2">
                  <h2 className="font-extrabold text-base sm:text-xl text-slate-900 tracking-wide">
                    ໃບຕິດຕາມເອກະສານ (ຂາເຂົ້າ)
                  </h2>
                </div>

                {/* Right: Numbers */}
                <div className="text-right text-[11px] sm:text-xs space-y-1 min-w-[200px]">
                  {/* ເລກຂາເຂົ້າ */}
                  <p className="flex items-center justify-end gap-1">
                    <span className="font-medium whitespace-nowrap">• ເລກຂາເຂົ້າ: </span>
                    {isEditable ? (
                      <input
                        type="text"
                        name="incomingNumber"
                        value={formData.incomingNumber}
                        onChange={handleChange}
                        placeholder="........"
                        className="font-bold border-b border-dotted border-slate-700 bg-transparent px-1 text-center w-20 focus:outline-none focus:border-blue-600"
                      />
                    ) : (
                      <span className="font-bold border-b border-dotted border-slate-700 px-1 inline-block min-w-[60px] text-center">
                        {formData.incomingNumber || '........'}
                      </span>
                    )}
                    <span>/ ລຮລ</span>
                  </p>

                  {/* ວັນທີຮັບ */}
                  <p className="flex items-center justify-end gap-1">
                    <span className="font-medium whitespace-nowrap">ວັນທີ: </span>
                    {isEditable ? (
                      <div className="relative inline-flex items-center">
                        <input
                          type="text"
                          name="receivedDate"
                          value={formData.receivedDate}
                          onChange={handleChange}
                          placeholder="..../..../2026"
                          className="border-b border-dotted border-slate-700 bg-transparent px-1 text-center w-24 font-medium focus:outline-none focus:border-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleSetToday('receivedDate')}
                          className="no-print text-[9px] bg-slate-100 hover:bg-slate-200 px-1 rounded ml-1 text-slate-600"
                          title="ໃສ່ວັນທີມື້ນີ້"
                        >
                          ມື້ນີ້
                        </button>
                      </div>
                    ) : (
                      <span className="border-b border-dotted border-slate-700 px-1 inline-block min-w-[80px] text-center font-medium">
                        {formData.receivedDate || '..../..../2026'}
                      </span>
                    )}
                  </p>

                  {/* ເລກທີຂາເຂົ້າ (ເດີມ) */}
                  <p className="flex items-center justify-end gap-1">
                    <span className="font-medium whitespace-nowrap">• ເລກທີຂາເຂົ້າ: </span>
                    {isEditable ? (
                      <input
                        type="text"
                        name="originalDocNumber"
                        value={formData.originalDocNumber}
                        onChange={handleChange}
                        placeholder="........"
                        className="font-bold border-b border-dotted border-slate-700 bg-transparent px-1 text-center w-20 focus:outline-none focus:border-blue-600"
                      />
                    ) : (
                      <span className="font-bold border-b border-dotted border-slate-700 px-1 inline-block min-w-[60px] text-center">
                        {formData.originalDocNumber || '........'}
                      </span>
                    )}
                    {formData.docCodeSuffix ? ` / ${formData.docCodeSuffix}` : ''}
                  </p>

                  {/* ລົງວັນທີ */}
                  <p className="flex items-center justify-end gap-1">
                    <span className="font-medium whitespace-nowrap">ລົງວັນທີ: </span>
                    {isEditable ? (
                      <div className="relative inline-flex items-center">
                        <input
                          type="text"
                          name="docDate"
                          value={formData.docDate}
                          onChange={handleChange}
                          placeholder="..../..../2026"
                          className="border-b border-dotted border-slate-700 bg-transparent px-1 text-center w-24 font-medium focus:outline-none focus:border-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleSetToday('docDate')}
                          className="no-print text-[9px] bg-slate-100 hover:bg-slate-200 px-1 rounded ml-1 text-slate-600"
                          title="ໃສ່ວັນທີມື້ນີ້"
                        >
                          ມື້ນີ້
                        </button>
                      </div>
                    ) : (
                      <span className="border-b border-dotted border-slate-700 px-1 inline-block min-w-[80px] text-center font-medium">
                        {formData.docDate || '..../..../2026'}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Subject Row */}
              <div className="flex items-start gap-2 border-b border-slate-700 pb-2">
                <span className="font-bold whitespace-nowrap pt-0.5">ເລື່ອງ:</span>
                {isEditable ? (
                  <textarea
                    name="subject"
                    rows={2}
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="ພິມຫົວຂໍ້ / ເລື່ອງເອກະສານ..."
                    className="font-semibold text-slate-900 leading-snug flex-1 bg-transparent border-b border-dotted border-slate-400 focus:outline-none focus:border-blue-600 resize-y p-0"
                  />
                ) : (
                  <span className="font-semibold text-slate-900 leading-snug flex-1">
                    {formData.subject ||
                      '....................................................................................................................................................................'}
                  </span>
                )}
              </div>

              {/* Control Checklist Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-700 pb-3 text-xs">
                {/* ລະດັບ */}
                <div className="flex items-center gap-3">
                  <span className="font-bold whitespace-nowrap">ລະດັບ:</span>
                  <label
                    onClick={() =>
                      isEditable &&
                      setFormData((p) => ({
                        ...p,
                        priority: 'NORMAL',
                        confidentialLevel: 'NORMAL',
                      }))
                    }
                    className="inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center ${
                        !isUrgent && !isSecret ? 'bg-slate-900' : ''
                      }`}
                    >
                      {!isUrgent && !isSecret && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <span>🔹 ທຳມະດາ</span>
                  </label>
                  <label
                    onClick={() =>
                      isEditable &&
                      setFormData((p) => ({ ...p, priority: 'URGENT' }))
                    }
                    className="inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center ${
                        isUrgent ? 'bg-red-600 border-red-600' : ''
                      }`}
                    >
                      {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className={isUrgent ? 'font-bold text-red-700' : ''}>⚡ ດ່ວນ</span>
                  </label>
                  <label
                    onClick={() =>
                      isEditable &&
                      setFormData((p) => ({
                        ...p,
                        confidentialLevel: isSecret ? 'NORMAL' : 'CONFIDENTIAL',
                      }))
                    }
                    className="inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center ${
                        isSecret ? 'bg-slate-900' : ''
                      }`}
                    >
                      {isSecret && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span>ລັບ</span>
                  </label>
                  <label
                    onClick={() =>
                      isEditable &&
                      setFormData((p) => ({
                        ...p,
                        confidentialLevel: isTopSecret ? 'NORMAL' : 'TOP_SECRET',
                      }))
                    }
                    className="inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center ${
                        isTopSecret ? 'bg-red-700 border-red-700' : ''
                      }`}
                    >
                      {isTopSecret && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span>ລັບທີ່ສຸດ</span>
                  </label>
                </div>

                {/* ຈຸດປະສົງ */}
                <div className="flex items-center gap-3">
                  <span className="font-bold whitespace-nowrap">ຈຸດປະສົງ:</span>
                  <label
                    onClick={() =>
                      isEditable && setFormData((p) => ({ ...p, purpose: 'ຄົ້ນຄວ້າ' }))
                    }
                    className="inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center ${
                        formData.purpose === 'ຄົ້ນຄວ້າ' ? 'bg-slate-900' : ''
                      }`}
                    >
                      {formData.purpose === 'ຄົ້ນຄວ້າ' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <span>ຄົ້ນຄວ້າ</span>
                  </label>
                  <label
                    onClick={() =>
                      isEditable && setFormData((p) => ({ ...p, purpose: 'ຮັບຊາບ' }))
                    }
                    className="inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center ${
                        formData.purpose === 'ຮັບຊາບ' ? 'bg-slate-900' : ''
                      }`}
                    >
                      {formData.purpose === 'ຮັບຊາບ' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <span>ຮັບຊາບ</span>
                  </label>
                  <div className="inline-flex items-center gap-1">
                    <span
                      onClick={() =>
                        isEditable && setFormData((p) => ({ ...p, purpose: 'ອື່ນໆ' }))
                      }
                      className={`w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center cursor-pointer ${
                        formData.purpose === 'ອື່ນໆ' ? 'bg-slate-900' : ''
                      }`}
                    >
                      {formData.purpose === 'ອື່ນໆ' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <span>ອື່ນໆ:</span>
                    {isEditable ? (
                      <input
                        type="text"
                        name="otherPurpose"
                        value={formData.otherPurpose}
                        onChange={(e) => {
                          setFormData((p) => ({
                            ...p,
                            purpose: 'ອື່ນໆ',
                            otherPurpose: e.target.value,
                          }));
                        }}
                        placeholder="..............."
                        className="border-b border-dotted border-slate-700 bg-transparent px-1 w-24 focus:outline-none focus:border-blue-600"
                      />
                    ) : (
                      <span>{formData.otherPurpose || '.................'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3 Directive Boxes Table (Incoming) */}
              <div className="border border-slate-700 divide-y border-collapse">
                {/* 1. ທິດຊີ້ນຳຂອງຫົວໜ້າພະແນກ */}
                <div className="p-3 min-h-[130px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-slate-900">ທິດຊີ້ນຳຂອງຫົວໜ້າພະແນກ:</p>
                      {isEditable && (
                        <div className="no-print flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenSignature(
                                'signImageDeptHead',
                                'ເຊັນລາຍເຊັນ: ຫົວໜ້າພະແນກ',
                                'ຫົວໜ້າພະແນກ'
                              )
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                          >
                            <PenTool className="w-3 h-3 text-blue-600" />
                            <span>✍️ ເຊັນ</span>
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditable ? (
                      <textarea
                        name="commentDeptHead"
                        rows={2}
                        value={formData.commentDeptHead}
                        onChange={handleChange}
                        placeholder="ພິມທິດຊີ້ນຳຂອງຫົວໜ້າພະແນກ..."
                        className="w-full text-xs text-slate-800 bg-transparent border border-dashed border-slate-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <div className="text-xs text-slate-700 italic pl-3 whitespace-pre-wrap">
                        {formData.commentDeptHead ||
                          '...................................................................................................................................................................................'}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-end text-[11px] text-slate-600 pt-3 border-t border-slate-100 mt-2">
                    <span className="flex items-center gap-1">
                      <span>ວັນທີ:</span>
                      {isEditable ? (
                        <div className="relative inline-flex items-center">
                          <input
                            type="text"
                            name="dateDeptHead"
                            value={formData.dateDeptHead}
                            onChange={handleChange}
                            placeholder="..... / ..... / 2026"
                            className="border-b border-dotted border-slate-700 bg-transparent px-1 text-center w-28 focus:outline-none focus:border-blue-600 font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => handleSetToday('dateDeptHead')}
                            className="no-print text-[9px] bg-slate-100 hover:bg-slate-200 px-1 rounded ml-1 text-slate-600"
                          >
                            ມື້ນີ້
                          </button>
                        </div>
                      ) : (
                        <span className="font-medium text-slate-900">
                          {formData.dateDeptHead || '..... / ..... / 2026'}
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <span>ລາຍເຊັນ:</span>
                      {formData.signImageDeptHead ? (
                        <span className="relative inline-flex items-center group">
                          <img
                            src={formData.signImageDeptHead}
                            alt="ລາຍເຊັນ"
                            className="h-8 max-w-[110px] object-contain"
                          />
                          {isEditable && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset('signImageDeptHead')}
                              className="no-print ml-1 text-rose-500 hover:text-rose-700 p-0.5"
                              title="ລຶບລາຍເຊັນ"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ) : (
                        '.......................................'
                      )}
                    </span>
                  </div>
                </div>

                {/* 2. ທິດຊີ້ນຳຂອງຮອງຫົວໜ້າພະແນກ ຜູ້ຊີ້ນຳໜ່ວຍງານ */}
                <div className="p-3 min-h-[130px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-slate-900">
                        ທິດຊີ້ນຳຂອງຮອງຫົວໜ້າພະແນກ ຜູ້ຊີ້ນຳໜ່ວຍງານ:
                      </p>
                      {isEditable && (
                        <div className="no-print flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenSignature(
                                'signImageDeputyDept',
                                'ເຊັນລາຍເຊັນ: ຮອງຫົວໜ້າພະແນກ ຜູ້ຊີ້ນຳໜ່ວຍງານ',
                                'ຮອງຫົວໜ້າພະແນກ ຜູ້ຊີ້ນຳໜ່ວຍງານ'
                              )
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                          >
                            <PenTool className="w-3 h-3 text-blue-600" />
                            <span>✍️ ເຊັນ</span>
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditable ? (
                      <textarea
                        name="commentDeputyDept"
                        rows={2}
                        value={formData.commentDeputyDept}
                        onChange={handleChange}
                        placeholder="ພິມທິດຊີ້ນຳຂອງຮອງຫົວໜ້າພະແນກ ຜູ້ຊີ້ນຳໜ່ວຍງານ..."
                        className="w-full text-xs text-slate-800 bg-transparent border border-dashed border-slate-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <div className="text-xs text-slate-700 italic pl-3 whitespace-pre-wrap">
                        {formData.commentDeputyDept ||
                          '...................................................................................................................................................................................'}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-end text-[11px] text-slate-600 pt-3 border-t border-slate-100 mt-2">
                    <span className="flex items-center gap-1">
                      <span>ວັນທີ:</span>
                      {isEditable ? (
                        <div className="relative inline-flex items-center">
                          <input
                            type="text"
                            name="dateDeputyDept"
                            value={formData.dateDeputyDept}
                            onChange={handleChange}
                            placeholder="..... / ..... / 2026"
                            className="border-b border-dotted border-slate-700 bg-transparent px-1 text-center w-28 focus:outline-none focus:border-blue-600 font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => handleSetToday('dateDeputyDept')}
                            className="no-print text-[9px] bg-slate-100 hover:bg-slate-200 px-1 rounded ml-1 text-slate-600"
                          >
                            ມື້ນີ້
                          </button>
                        </div>
                      ) : (
                        <span className="font-medium text-slate-900">
                          {formData.dateDeputyDept || '..... / ..... / 2026'}
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <span>ລາຍເຊັນ:</span>
                      {formData.signImageDeputyDept ? (
                        <span className="relative inline-flex items-center group">
                          <img
                            src={formData.signImageDeputyDept}
                            alt="ລາຍເຊັນ"
                            className="h-8 max-w-[110px] object-contain"
                          />
                          {isEditable && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset('signImageDeputyDept')}
                              className="no-print ml-1 text-rose-500 hover:text-rose-700 p-0.5"
                              title="ລຶບລາຍເຊັນ"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ) : (
                        '.......................................'
                      )}
                    </span>
                  </div>
                </div>

                {/* 3. ທິດຊີ້ນຳຂອງຄະນະໜ່ວຍງານ */}
                <div className="p-3 min-h-[130px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-slate-900">ທິດຊີ້ນຳຂອງຄະນະໜ່ວຍງານ:</p>
                      {isEditable && (
                        <div className="no-print flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenSignature(
                                'signImageUnit',
                                'ເຊັນລາຍເຊັນ: ຄະນະໜ່ວຍງານ',
                                'ຄະນະໜ່ວຍງານ'
                              )
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                          >
                            <PenTool className="w-3 h-3 text-blue-600" />
                            <span>✍️ ເຊັນ</span>
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditable ? (
                      <textarea
                        name="commentUnit"
                        rows={2}
                        value={formData.commentUnit}
                        onChange={handleChange}
                        placeholder="ພິມທິດຊີ້ນຳຂອງຄະນະໜ່ວຍງານ..."
                        className="w-full text-xs text-slate-800 bg-transparent border border-dashed border-slate-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <div className="text-xs text-slate-700 italic pl-3 whitespace-pre-wrap">
                        {formData.commentUnit ||
                          '...................................................................................................................................................................................'}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-end text-[11px] text-slate-600 pt-3 border-t border-slate-100 mt-2">
                    <span className="flex items-center gap-1">
                      <span>ວັນທີ:</span>
                      {isEditable ? (
                        <div className="relative inline-flex items-center">
                          <input
                            type="text"
                            name="dateUnit"
                            value={formData.dateUnit}
                            onChange={handleChange}
                            placeholder="..... / ..... / 2026"
                            className="border-b border-dotted border-slate-700 bg-transparent px-1 text-center w-28 focus:outline-none focus:border-blue-600 font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => handleSetToday('dateUnit')}
                            className="no-print text-[9px] bg-slate-100 hover:bg-slate-200 px-1 rounded ml-1 text-slate-600"
                          >
                            ມື້ນີ້
                          </button>
                        </div>
                      ) : (
                        <span className="font-medium text-slate-900">
                          {formData.dateUnit || '..... / ..... / 2026'}
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <span>ລາຍເຊັນ:</span>
                      {formData.signImageUnit ? (
                        <span className="relative inline-flex items-center group">
                          <img
                            src={formData.signImageUnit}
                            alt="ລາຍເຊັນ"
                            className="h-8 max-w-[110px] object-contain"
                          />
                          {isEditable && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset('signImageUnit')}
                              className="no-print ml-1 text-rose-500 hover:text-rose-700 p-0.5"
                              title="ລຶບລາຍເຊັນ"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ) : (
                        '.......................................'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TEMPLATE 2: ໃບຕິດຕາມເອກະສານ (ຂາອອກ) - INTERACTIVE 5 COLUMNS */}
          {/* ======================================================== */}
          {sheetType === 'outgoing' && (
            <div className="border-2 border-slate-800 p-5 space-y-4 text-xs sm:text-sm">
              {/* Top Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
                {/* Left: Organization & Logo */}
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="LHSE Logo"
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://img2.pic.in.th/ChatGPT-Image-Sep-28-2026-11_11_54-AM.png';
                    }}
                  />
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
                      ລັດວິສາຫະກິດຖືຮຸ້ນລາວ
                    </h3>
                    {isEditable ? (
                      <input
                        type="text"
                        name="departmentName"
                        value={formData.departmentName}
                        onChange={handleChange}
                        placeholder="ພະແນກ..."
                        className="font-semibold text-xs sm:text-sm text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500 w-44"
                      />
                    ) : (
                      <p className="font-semibold text-xs sm:text-sm text-slate-800">
                        {formData.departmentName || 'ພະແນກພັດທະນາ'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Center Title */}
                <div className="text-center pt-2">
                  <h2 className="font-extrabold text-base sm:text-xl text-slate-900 tracking-wide">
                    ໃບຕິດຕາມເອກະສານ (ຂາອອກ)
                  </h2>
                </div>

                {/* Right: Numbers */}
                <div className="text-right text-[11px] sm:text-xs space-y-1 min-w-[200px]">
                  {/* ເລກທີຂາອອກ */}
                  <p className="flex items-center justify-end gap-1">
                    <span className="font-medium whitespace-nowrap">ເລກທີຂາອອກ: </span>
                    {isEditable ? (
                      <input
                        type="text"
                        name="outgoingNumber"
                        value={formData.outgoingNumber}
                        onChange={handleChange}
                        placeholder="........"
                        className="font-bold border-b border-dotted border-slate-700 bg-transparent px-1 text-center w-24 focus:outline-none focus:border-blue-600"
                      />
                    ) : (
                      <span className="font-bold border-b border-dotted border-slate-700 px-1 inline-block min-w-[70px] text-center">
                        {formData.outgoingNumber || '........'}
                      </span>
                    )}
                    {formData.docCodeSuffix ? ` / ${formData.docCodeSuffix}` : ''}
                  </p>

                  {/* ລົງວັນທີ */}
                  <p className="flex items-center justify-end gap-1">
                    <span className="font-medium whitespace-nowrap">ລົງວັນທີ: </span>
                    {isEditable ? (
                      <div className="relative inline-flex items-center">
                        <input
                          type="text"
                          name="docDate"
                          value={formData.docDate}
                          onChange={handleChange}
                          placeholder="..../..../2026"
                          className="border-b border-dotted border-slate-700 bg-transparent px-1 text-center w-24 font-medium focus:outline-none focus:border-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleSetToday('docDate')}
                          className="no-print text-[9px] bg-slate-100 hover:bg-slate-200 px-1 rounded ml-1 text-slate-600"
                          title="ໃສ່ວັນທີມື້ນີ້"
                        >
                          ມື້ນີ້
                        </button>
                      </div>
                    ) : (
                      <span className="border-b border-dotted border-slate-700 px-1 inline-block min-w-[80px] text-center font-medium">
                        {formData.docDate || '..../..../2026'}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Subject Row */}
              <div className="flex items-start gap-2 border-b border-slate-700 pb-2">
                <span className="font-bold whitespace-nowrap pt-0.5">ເລື່ອງ:</span>
                {isEditable ? (
                  <textarea
                    name="subject"
                    rows={2}
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="ພິມຫົວຂໍ້ / ເລື່ອງເອກະສານຂາອອກ..."
                    className="font-semibold text-slate-900 leading-snug flex-1 bg-transparent border-b border-dotted border-slate-400 focus:outline-none focus:border-blue-600 resize-y p-0"
                  />
                ) : (
                  <span className="font-semibold text-slate-900 leading-snug flex-1">
                    {formData.subject ||
                      '....................................................................................................................................................................'}
                  </span>
                )}
              </div>

              {/* Control Checklist Row: ລະດັບ & ຈຸດປະສົງ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-700 pb-3 text-xs">
                {/* ລະດັບ */}
                <div className="flex items-center gap-3">
                  <span className="font-bold whitespace-nowrap">ລະດັບ:</span>
                  <label
                    onClick={() =>
                      isEditable && setFormData((p) => ({ ...p, priority: 'NORMAL' }))
                    }
                    className="inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center ${
                        !isUrgent ? 'bg-slate-900' : ''
                      }`}
                    >
                      {!isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span>🔹 ທຳມະດາ</span>
                  </label>
                  <label
                    onClick={() =>
                      isEditable && setFormData((p) => ({ ...p, priority: 'URGENT' }))
                    }
                    className="inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center ${
                        isUrgent ? 'bg-red-600 border-red-600' : ''
                      }`}
                    >
                      {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className={isUrgent ? 'font-bold text-red-700' : ''}>⚡ ດ່ວນ</span>
                  </label>
                </div>

                {/* ຈຸດປະສົງ */}
                <div className="flex items-center gap-3">
                  <span className="font-bold whitespace-nowrap">ຈຸດປະສົງ:</span>
                  <label
                    onClick={() =>
                      isEditable && setFormData((p) => ({ ...p, purpose: 'ເພື່ອປະຊຸມ' }))
                    }
                    className="inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center ${
                        formData.purpose === 'ເພື່ອປະຊຸມ' ? 'bg-slate-900' : ''
                      }`}
                    >
                      {formData.purpose === 'ເພື່ອປະຊຸມ' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <span>ເພື່ອປະຊຸມ</span>
                  </label>
                  <label
                    onClick={() =>
                      isEditable && setFormData((p) => ({ ...p, purpose: 'ເພື່ອຂໍຄຳເຫັນ' }))
                    }
                    className="inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center ${
                        formData.purpose === 'ເພື່ອຂໍຄຳເຫັນ' ? 'bg-slate-900' : ''
                      }`}
                    >
                      {formData.purpose === 'ເພື່ອຂໍຄຳເຫັນ' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <span>ເພື່ອຂໍຄຳເຫັນ</span>
                  </label>
                  <label
                    onClick={() =>
                      isEditable && setFormData((p) => ({ ...p, purpose: 'ເພື່ອຂໍອະນຸມັດ' }))
                    }
                    className="inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center ${
                        formData.purpose === 'ເພື່ອຂໍອະນຸມັດ' || !formData.purpose
                          ? 'bg-slate-900'
                          : ''
                      }`}
                    >
                      {(formData.purpose === 'ເພື່ອຂໍອະນຸມັດ' || !formData.purpose) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <span className="font-semibold text-slate-900">ເພື່ອຂໍອະນຸມັດ</span>
                  </label>
                </div>
              </div>

              {/* ຜູ້ຄົ້ນຄວ້າ & ໜ່ວຍງານ */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-700 pb-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-bold whitespace-nowrap">ຜູ້ຄົ້ນຄວ້າ: </span>
                  {isEditable ? (
                    <input
                      type="text"
                      name="researcherName"
                      value={formData.researcherName}
                      onChange={handleChange}
                      placeholder="ຊື່ ແລະ ນາມສະກຸນ ຜູ້ຄົ້ນຄວ້າ..."
                      className="border-b border-dotted border-slate-700 bg-transparent px-2 font-medium flex-1 focus:outline-none focus:border-blue-600"
                    />
                  ) : (
                    <span className="border-b border-dotted border-slate-700 px-2 font-medium flex-1">
                      {formData.researcherName || '................................................................'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold whitespace-nowrap">ໜ່ວຍງານ: </span>
                  {isEditable ? (
                    <>
                      <input
                        type="text"
                        name="assignedUnit"
                        list="tracking-sheet-unit-options"
                        value={formData.assignedUnit}
                        onChange={handleChange}
                        placeholder="ເລືອກ ຫຼື ພິມໜ່ວຍງານ..."
                        className="border-b border-dotted border-slate-700 bg-transparent px-2 font-medium flex-1 focus:outline-none focus:border-blue-600"
                      />
                      <datalist id="tracking-sheet-unit-options">
                        <option value="ໜ່ວຍງານ R&D" />
                        <option value="ໜ່ວຍງານປະສານງານ" />
                        <option value="ໜ່ວຍງານວິສະວະກຳ" />
                      </datalist>
                    </>
                  ) : (
                    <span className="border-b border-dotted border-slate-700 px-2 font-medium flex-1">
                      {formData.assignedUnit || '................................................................'}
                    </span>
                  )}
                </div>
              </div>

              {/* 5 APPROVAL COLUMNS - EXACT 1-TO-1 MATCH OF IMAGE 2, FULLY EDITABLE */}
              <div className="border border-slate-700 grid grid-cols-5 divide-x divide-slate-700 text-xs min-h-[410px]">
                {/* ---------------------------------------------------- */}
                {/* 1. ຄຳເຫັນຂອງຄະນະໜ່ວຍງານ */}
                {/* ---------------------------------------------------- */}
                <div className="p-2.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <p className="font-bold text-[11px] sm:text-xs text-slate-900 leading-tight border-b border-slate-300 pb-1">
                      ຄຳເຫັນຂອງຄະນະໜ່ວຍງານ:
                    </p>
                    {isEditable ? (
                      <textarea
                        name="commentUnit"
                        rows={6}
                        value={formData.commentUnit}
                        onChange={handleChange}
                        placeholder="ພິມຄຳເຫັນ..."
                        className="w-full text-[11px] text-slate-800 bg-slate-50/40 p-1.5 rounded border border-dashed border-slate-300 focus:outline-none focus:border-blue-500 resize-none font-sans"
                      />
                    ) : (
                      <div className="text-[11px] text-slate-700 italic whitespace-pre-wrap min-h-[90px]">
                        {formData.commentUnit || ''}
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-600 pt-2 border-t border-slate-200 space-y-1.5">
                    {/* Date */}
                    <div>
                      <span className="text-slate-500 block">ວັນທີ: </span>
                      {isEditable ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <input
                            type="text"
                            name="dateUnit"
                            value={formData.dateUnit}
                            onChange={handleChange}
                            placeholder="...../...../2026"
                            className="font-medium text-slate-800 border-b border-dotted border-slate-400 bg-transparent w-full text-[10px] focus:outline-none focus:border-blue-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleSetToday('dateUnit')}
                            className="no-print text-[8px] bg-slate-100 hover:bg-slate-200 px-1 py-0.5 rounded text-slate-600 shrink-0"
                          >
                            ມື້ນີ້
                          </button>
                        </div>
                      ) : (
                        <span className="font-medium text-slate-800">
                          {formData.dateUnit || '...../...../2026'}
                        </span>
                      )}
                    </div>

                    {/* Signature & Seal Area */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[9px] block">ລາຍເຊັນ & ກາປະທັບ:</span>
                        {isEditable && (
                          <div className="no-print flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenSignature(
                                  'signImageUnit',
                                  'ເຊັນລາຍເຊັນ: ຄະນະໜ່ວຍງານ',
                                  'ຄະນະໜ່ວຍງານ'
                                )
                              }
                              className="text-[9px] text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                              title="ເຊັນດ້ວຍປາກກາອອນລາຍ"
                            >
                              <PenTool className="w-2.5 h-2.5" />
                              ເຊັນ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplySeal('sealImageUnit')}
                              className="text-[9px] text-rose-600 hover:underline flex items-center gap-0.5 font-bold"
                              title="ໃສ່ກາປະທັບແດງ"
                            >
                              <Stamp className="w-2.5 h-2.5" />
                              ກາ
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Render Visual Stamp & Signature Overlay */}
                      <div className="relative flex items-center justify-center min-h-[55px] w-full my-1">
                        {formData.signImageUnit && (
                          <img
                            src={formData.signImageUnit}
                            alt="ລາຍເຊັນ"
                            className="h-9 max-w-[85px] object-contain relative z-10"
                          />
                        )}
                        {formData.sealImageUnit && (
                          <img
                            src={formData.sealImageUnit}
                            alt="ກາປະທັບ"
                            className="h-11 max-w-[70px] object-contain absolute opacity-85 rotate-[-4deg] pointer-events-none -right-1 -top-1"
                          />
                        )}
                        {!formData.signImageUnit && !formData.sealImageUnit && (
                          <div className="min-h-[44px] w-full border border-dashed border-slate-200 rounded flex items-center justify-center text-[9px] text-slate-300">
                            ຊ່ອງເຊັນ
                          </div>
                        )}
                      </div>

                      {/* Clear controls when editable */}
                      {isEditable && (formData.signImageUnit || formData.sealImageUnit) && (
                        <div className="no-print flex items-center justify-center gap-2 pt-0.5">
                          {formData.signImageUnit && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset('signImageUnit')}
                              className="text-[8px] text-slate-400 hover:text-rose-600"
                            >
                              ລຶບເຊັນ
                            </button>
                          )}
                          {formData.sealImageUnit && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset('sealImageUnit')}
                              className="text-[8px] text-slate-400 hover:text-rose-600"
                            >
                              ລຶບກາ
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* 2. ຄຳເຫັນຂອງຮອງຫົວໜ້າພະແນກ ຜູ້ຊີ້ນຳໜ່ວຍງານ */}
                {/* ---------------------------------------------------- */}
                <div className="p-2.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <p className="font-bold text-[11px] sm:text-xs text-slate-900 leading-tight border-b border-slate-300 pb-1">
                      ຄຳເຫັນຂອງຮອງຫົວໜ້າພະແນກ ຜູ້ຊີ້ນຳໜ່ວຍງານ:
                    </p>
                    {isEditable ? (
                      <textarea
                        name="commentDeputyDept"
                        rows={6}
                        value={formData.commentDeputyDept}
                        onChange={handleChange}
                        placeholder="ພິມຄຳເຫັນ..."
                        className="w-full text-[11px] text-slate-800 bg-slate-50/40 p-1.5 rounded border border-dashed border-slate-300 focus:outline-none focus:border-blue-500 resize-none font-sans"
                      />
                    ) : (
                      <div className="text-[11px] text-slate-700 italic whitespace-pre-wrap min-h-[90px]">
                        {formData.commentDeputyDept || ''}
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-600 pt-2 border-t border-slate-200 space-y-1.5">
                    {/* Date */}
                    <div>
                      <span className="text-slate-500 block">ວັນທີ: </span>
                      {isEditable ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <input
                            type="text"
                            name="dateDeputyDept"
                            value={formData.dateDeputyDept}
                            onChange={handleChange}
                            placeholder="...../...../2026"
                            className="font-medium text-slate-800 border-b border-dotted border-slate-400 bg-transparent w-full text-[10px] focus:outline-none focus:border-blue-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleSetToday('dateDeputyDept')}
                            className="no-print text-[8px] bg-slate-100 hover:bg-slate-200 px-1 py-0.5 rounded text-slate-600 shrink-0"
                          >
                            ມື້ນີ້
                          </button>
                        </div>
                      ) : (
                        <span className="font-medium text-slate-800">
                          {formData.dateDeputyDept || '...../...../2026'}
                        </span>
                      )}
                    </div>

                    {/* Signature & Seal Area */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[9px] block">ລາຍເຊັນ & ກາປະທັບ:</span>
                        {isEditable && (
                          <div className="no-print flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenSignature(
                                  'signImageDeputyDept',
                                  'ເຊັນລາຍເຊັນ: ຮອງຫົວໜ້າພະແນກ ຜູ້ຊີ້ນຳໜ່ວຍງານ',
                                  'ຮອງຫົວໜ້າພະແນກ ຜູ້ຊີ້ນຳໜ່ວຍງານ'
                                )
                              }
                              className="text-[9px] text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                              title="ເຊັນດ້ວຍປາກກາອອນລາຍ"
                            >
                              <PenTool className="w-2.5 h-2.5" />
                              ເຊັນ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplySeal('sealImageDeputyDept')}
                              className="text-[9px] text-rose-600 hover:underline flex items-center gap-0.5 font-bold"
                              title="ໃສ່ກາປະທັບແດງ"
                            >
                              <Stamp className="w-2.5 h-2.5" />
                              ກາ
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Render Visual Stamp & Signature Overlay */}
                      <div className="relative flex items-center justify-center min-h-[55px] w-full my-1">
                        {formData.signImageDeputyDept && (
                          <img
                            src={formData.signImageDeputyDept}
                            alt="ລາຍເຊັນ"
                            className="h-9 max-w-[85px] object-contain relative z-10"
                          />
                        )}
                        {formData.sealImageDeputyDept && (
                          <img
                            src={formData.sealImageDeputyDept}
                            alt="ກາປະທັບ"
                            className="h-11 max-w-[70px] object-contain absolute opacity-85 rotate-[-4deg] pointer-events-none -right-1 -top-1"
                          />
                        )}
                        {!formData.signImageDeputyDept && !formData.sealImageDeputyDept && (
                          <div className="min-h-[44px] w-full border border-dashed border-slate-200 rounded flex items-center justify-center text-[9px] text-slate-300">
                            ຊ່ອງເຊັນ
                          </div>
                        )}
                      </div>

                      {/* Clear controls when editable */}
                      {isEditable && (formData.signImageDeputyDept || formData.sealImageDeputyDept) && (
                        <div className="no-print flex items-center justify-center gap-2 pt-0.5">
                          {formData.signImageDeputyDept && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset('signImageDeputyDept')}
                              className="text-[8px] text-slate-400 hover:text-rose-600"
                            >
                              ລຶບເຊັນ
                            </button>
                          )}
                          {formData.sealImageDeputyDept && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset('sealImageDeputyDept')}
                              className="text-[8px] text-slate-400 hover:text-rose-600"
                            >
                              ລຶບກາ
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* 3. ຄຳເຫັນຂອງຫົວໜ້າພະແນກ */}
                {/* ---------------------------------------------------- */}
                <div className="p-2.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <p className="font-bold text-[11px] sm:text-xs text-slate-900 leading-tight border-b border-slate-300 pb-1">
                      ຄຳເຫັນຂອງຫົວໜ້າພະແນກ:
                    </p>
                    {isEditable ? (
                      <textarea
                        name="commentDeptHead"
                        rows={6}
                        value={formData.commentDeptHead}
                        onChange={handleChange}
                        placeholder="ພິມຄຳເຫັນ..."
                        className="w-full text-[11px] text-slate-800 bg-slate-50/40 p-1.5 rounded border border-dashed border-slate-300 focus:outline-none focus:border-blue-500 resize-none font-sans"
                      />
                    ) : (
                      <div className="text-[11px] text-slate-700 italic whitespace-pre-wrap min-h-[90px]">
                        {formData.commentDeptHead || ''}
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-600 pt-2 border-t border-slate-200 space-y-1.5">
                    {/* Date */}
                    <div>
                      <span className="text-slate-500 block">ວັນທີ: </span>
                      {isEditable ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <input
                            type="text"
                            name="dateDeptHead"
                            value={formData.dateDeptHead}
                            onChange={handleChange}
                            placeholder="...../...../2026"
                            className="font-medium text-slate-800 border-b border-dotted border-slate-400 bg-transparent w-full text-[10px] focus:outline-none focus:border-blue-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleSetToday('dateDeptHead')}
                            className="no-print text-[8px] bg-slate-100 hover:bg-slate-200 px-1 py-0.5 rounded text-slate-600 shrink-0"
                          >
                            ມື້ນີ້
                          </button>
                        </div>
                      ) : (
                        <span className="font-medium text-slate-800">
                          {formData.dateDeptHead || '...../...../2026'}
                        </span>
                      )}
                    </div>

                    {/* Signature & Seal Area */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[9px] block">ລາຍເຊັນ & ກາປະທັບ:</span>
                        {isEditable && (
                          <div className="no-print flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenSignature(
                                  'signImageDeptHead',
                                  'ເຊັນລາຍເຊັນ: ຫົວໜ້າພະແນກ',
                                  'ຫົວໜ້າພະແນກ'
                                )
                              }
                              className="text-[9px] text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                              title="ເຊັນດ້ວຍປາກກາອອນລາຍ"
                            >
                              <PenTool className="w-2.5 h-2.5" />
                              ເຊັນ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplySeal('sealImageDeptHead')}
                              className="text-[9px] text-rose-600 hover:underline flex items-center gap-0.5 font-bold"
                              title="ໃສ່ກາປະທັບແດງ"
                            >
                              <Stamp className="w-2.5 h-2.5" />
                              ກາ
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Render Visual Stamp & Signature Overlay */}
                      <div className="relative flex items-center justify-center min-h-[55px] w-full my-1">
                        {formData.signImageDeptHead && (
                          <img
                            src={formData.signImageDeptHead}
                            alt="ລາຍເຊັນ"
                            className="h-9 max-w-[85px] object-contain relative z-10"
                          />
                        )}
                        {formData.sealImageDeptHead && (
                          <img
                            src={formData.sealImageDeptHead}
                            alt="ກາປະທັບ"
                            className="h-11 max-w-[70px] object-contain absolute opacity-85 rotate-[-4deg] pointer-events-none -right-1 -top-1"
                          />
                        )}
                        {!formData.signImageDeptHead && !formData.sealImageDeptHead && (
                          <div className="min-h-[44px] w-full border border-dashed border-slate-200 rounded flex items-center justify-center text-[9px] text-slate-300">
                            ຊ່ອງເຊັນ
                          </div>
                        )}
                      </div>

                      {/* Clear controls when editable */}
                      {isEditable && (formData.signImageDeptHead || formData.sealImageDeptHead) && (
                        <div className="no-print flex items-center justify-center gap-2 pt-0.5">
                          {formData.signImageDeptHead && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset('signImageDeptHead')}
                              className="text-[8px] text-slate-400 hover:text-rose-600"
                            >
                              ລຶບເຊັນ
                            </button>
                          )}
                          {formData.sealImageDeptHead && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset('sealImageDeptHead')}
                              className="text-[8px] text-slate-400 hover:text-rose-600"
                            >
                              ລຶບກາ
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* 4. ຄຳເຫັນຂອງ ຮອງ ຜອ ຜູ້ຊີ້ນຳພະແນກ */}
                {/* ---------------------------------------------------- */}
                <div className="p-2.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <p className="font-bold text-[11px] sm:text-xs text-slate-900 leading-tight border-b border-slate-300 pb-1">
                      ຄຳເຫັນຂອງ ຮອງ ຜອ ຜູ້ຊີ້ນຳພະແນກ:
                    </p>
                    {isEditable ? (
                      <textarea
                        name="commentDeputyDirector"
                        rows={6}
                        value={formData.commentDeputyDirector}
                        onChange={handleChange}
                        placeholder="ພິມຄຳເຫັນ..."
                        className="w-full text-[11px] text-slate-800 bg-slate-50/40 p-1.5 rounded border border-dashed border-slate-300 focus:outline-none focus:border-blue-500 resize-none font-sans"
                      />
                    ) : (
                      <div className="text-[11px] text-slate-700 italic whitespace-pre-wrap min-h-[90px]">
                        {formData.commentDeputyDirector || ''}
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-600 pt-2 border-t border-slate-200 space-y-1.5">
                    {/* Date */}
                    <div>
                      <span className="text-slate-500 block">ວັນທີ: </span>
                      {isEditable ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <input
                            type="text"
                            name="dateDeputyDirector"
                            value={formData.dateDeputyDirector}
                            onChange={handleChange}
                            placeholder="...../...../2026"
                            className="font-medium text-slate-800 border-b border-dotted border-slate-400 bg-transparent w-full text-[10px] focus:outline-none focus:border-blue-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleSetToday('dateDeputyDirector')}
                            className="no-print text-[8px] bg-slate-100 hover:bg-slate-200 px-1 py-0.5 rounded text-slate-600 shrink-0"
                          >
                            ມື້ນີ້
                          </button>
                        </div>
                      ) : (
                        <span className="font-medium text-slate-800">
                          {formData.dateDeputyDirector || '...../...../2026'}
                        </span>
                      )}
                    </div>

                    {/* Signature & Seal Area */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[9px] block">ລາຍເຊັນ & ກາປະທັບ:</span>
                        {isEditable && (
                          <div className="no-print flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenSignature(
                                  'signImageDeputyDirector',
                                  'ເຊັນລາຍເຊັນ: ຮອງ ຜອ ຜູ້ຊີ້ນຳພະແນກ',
                                  'ຮອງ ຜອ ຜູ້ຊີ້ນຳພະແນກ'
                                )
                              }
                              className="text-[9px] text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                              title="ເຊັນດ້ວຍປາກກາອອນລາຍ"
                            >
                              <PenTool className="w-2.5 h-2.5" />
                              ເຊັນ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplySeal('sealImageDeputyDirector', 'ຄະນະຜູ້ອຳນວຍການ')}
                              className="text-[9px] text-rose-600 hover:underline flex items-center gap-0.5 font-bold"
                              title="ໃສ່ກາປະທັບແດງ"
                            >
                              <Stamp className="w-2.5 h-2.5" />
                              ກາ
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Render Visual Stamp & Signature Overlay */}
                      <div className="relative flex items-center justify-center min-h-[55px] w-full my-1">
                        {formData.signImageDeputyDirector && (
                          <img
                            src={formData.signImageDeputyDirector}
                            alt="ລາຍເຊັນ"
                            className="h-9 max-w-[85px] object-contain relative z-10"
                          />
                        )}
                        {formData.sealImageDeputyDirector && (
                          <img
                            src={formData.sealImageDeputyDirector}
                            alt="ກາປະທັບ"
                            className="h-11 max-w-[70px] object-contain absolute opacity-85 rotate-[-4deg] pointer-events-none -right-1 -top-1"
                          />
                        )}
                        {!formData.signImageDeputyDirector && !formData.sealImageDeputyDirector && (
                          <div className="min-h-[44px] w-full border border-dashed border-slate-200 rounded flex items-center justify-center text-[9px] text-slate-300">
                            ຊ່ອງເຊັນ
                          </div>
                        )}
                      </div>

                      {/* Clear controls when editable */}
                      {isEditable && (formData.signImageDeputyDirector || formData.sealImageDeputyDirector) && (
                        <div className="no-print flex items-center justify-center gap-2 pt-0.5">
                          {formData.signImageDeputyDirector && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset('signImageDeputyDirector')}
                              className="text-[8px] text-slate-400 hover:text-rose-600"
                            >
                              ລຶບເຊັນ
                            </button>
                          )}
                          {formData.sealImageDeputyDirector && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset('sealImageDeputyDirector')}
                              className="text-[8px] text-slate-400 hover:text-rose-600"
                            >
                              ລຶບກາ
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* 5. ຄຳເຫັນຂອງ ຜອ */}
                {/* ---------------------------------------------------- */}
                <div className="p-2.5 flex flex-col justify-between bg-slate-50/50">
                  <div className="space-y-1.5">
                    <p className="font-bold text-[11px] sm:text-xs text-slate-900 leading-tight border-b border-slate-300 pb-1">
                      ຄຳເຫັນຂອງ ຜອ:
                    </p>
                    {isEditable ? (
                      <textarea
                        name="commentDirector"
                        rows={6}
                        value={formData.commentDirector}
                        onChange={handleChange}
                        placeholder="ພິມຄຳເຫັນ..."
                        className="w-full text-[11px] text-slate-800 bg-white p-1.5 rounded border border-dashed border-slate-300 focus:outline-none focus:border-blue-500 resize-none font-sans"
                      />
                    ) : (
                      <div className="text-[11px] text-slate-700 italic whitespace-pre-wrap min-h-[90px]">
                        {formData.commentDirector || ''}
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-600 pt-2 border-t border-slate-200 space-y-1.5">
                    {/* Date */}
                    <div>
                      <span className="text-slate-500 block">ວັນທີ: </span>
                      {isEditable ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <input
                            type="text"
                            name="dateDirector"
                            value={formData.dateDirector}
                            onChange={handleChange}
                            placeholder="...../...../2026"
                            className="font-medium text-slate-800 border-b border-dotted border-slate-400 bg-transparent w-full text-[10px] focus:outline-none focus:border-blue-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleSetToday('dateDirector')}
                            className="no-print text-[8px] bg-slate-100 hover:bg-slate-200 px-1 py-0.5 rounded text-slate-600 shrink-0"
                          >
                            ມື້ນີ້
                          </button>
                        </div>
                      ) : (
                        <span className="font-medium text-slate-800">
                          {formData.dateDirector || '...../...../2026'}
                        </span>
                      )}
                    </div>

                    {/* Signature & Seal Area */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[9px] block">ລາຍເຊັນ & ກາປະທັບ:</span>
                        {isEditable && (
                          <div className="no-print flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenSignature(
                                  'signImageDirector',
                                  'ເຊັນລາຍເຊັນ: ຜູ້ອຳນວຍການ',
                                  'ຜູ້ອຳນວຍການໃຫຍ່'
                                )
                              }
                              className="text-[9px] text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                              title="ເຊັນດ້ວຍປາກກາອອນລາຍ"
                            >
                              <PenTool className="w-2.5 h-2.5" />
                              ເຊັນ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplySeal('sealImageDirector', 'ຄະນະຜູ້ອຳນວຍການ')}
                              className="text-[9px] text-rose-600 hover:underline flex items-center gap-0.5 font-bold"
                              title="ໃສ່ກາປະທັບແດງ"
                            >
                              <Stamp className="w-2.5 h-2.5" />
                              ກາ
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Render Visual Stamp & Signature Overlay */}
                      <div className="relative flex items-center justify-center min-h-[55px] w-full my-1">
                        {formData.signImageDirector && (
                          <img
                            src={formData.signImageDirector}
                            alt="ລາຍເຊັນ"
                            className="h-9 max-w-[85px] object-contain relative z-10"
                          />
                        )}
                        {formData.sealImageDirector && (
                          <img
                            src={formData.sealImageDirector}
                            alt="ກາປະທັບ"
                            className="h-11 max-w-[70px] object-contain absolute opacity-85 rotate-[-4deg] pointer-events-none -right-1 -top-1"
                          />
                        )}
                        {!formData.signImageDirector && !formData.sealImageDirector && (
                          <div className="min-h-[44px] w-full border border-dashed border-slate-200 rounded flex items-center justify-center text-[9px] text-slate-300">
                            ຊ່ອງເຊັນ
                          </div>
                        )}
                      </div>

                      {/* Clear controls when editable */}
                      {isEditable && (formData.signImageDirector || formData.sealImageDirector) && (
                        <div className="no-print flex items-center justify-center gap-2 pt-0.5">
                          {formData.signImageDirector && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset('signImageDirector')}
                              className="text-[8px] text-slate-400 hover:text-rose-600"
                            >
                              ລຶບເຊັນ
                            </button>
                          )}
                          {formData.sealImageDirector && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset('sealImageDirector')}
                              className="text-[8px] text-slate-400 hover:text-rose-600"
                            >
                              ລຶບກາ
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Signature Pad Modal Integration */}
      {signatureModal && (
        <SignaturePadModal
          isOpen={signatureModal.isOpen}
          onClose={() => setSignatureModal(null)}
          title={signatureModal.title}
          signerName={signatureModal.signerName}
          initialSignature={formData[signatureModal.fieldKey as keyof typeof formData] as string}
          onSave={handleSaveSignature}
        />
      )}
    </div>
  );
};
