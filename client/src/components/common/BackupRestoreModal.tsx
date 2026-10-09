import React, { useState, useRef } from 'react';
import { X, Database, Download, Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../../api/client';
import { Button } from '../ui/Button';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  scope: 'INCOMING' | 'OUTGOING' | 'ALL';
  onSuccess?: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  scope,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const scopeTitle =
    scope === 'INCOMING'
      ? 'ເອກະສານຂາເຂົ້າ'
      : scope === 'OUTGOING'
      ? 'ເອກະສານຂາອອກ'
      : 'ເອກະສານທັງໝົດ';

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const res = await api.exportBackup(scope);
      if (res.success && res.data) {
        const jsonStr = JSON.stringify(res.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.href = url;
        a.download = `backup_${scope.toLowerCase()}_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Swal.fire({
          icon: 'success',
          title: 'ສຳຮອງຂໍ້ມູນສຳເລັດ!',
          text: `ດາວໂຫລດໄຟລ໌ສຳຮອງ ${scopeTitle} ຈຳນວນ ${res.data.totalCount} ລາຍການ ຮຽບຮ້ອຍແລ້ວ`,
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'ເກີດຂໍ້ຜິດພາດໃນການ BackUp',
        text: err.message || 'ບໍ່ສາມາດສົ່ງອອກໄຟລ໌ສຳຮອງຂໍ້ມູນໄດ້',
        confirmButtonText: 'ຕົກລົງ',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      Swal.fire({
        icon: 'warning',
        title: 'ໄຟລ໌ບໍ່ຖືກຕ້ອງ',
        text: 'ກະລຸນາເລືອກໄຟລ໌ນາມສະກຸນ .json ເທົ່ານັ້ນ',
        confirmButtonText: 'ຕົກລົງ',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setSelectedFile(file);
        setFileContent(parsed);
      } catch (parseError) {
        Swal.fire({
          icon: 'error',
          title: 'ອ່ານໄຟລ໌ບໍ່ສຳເລັດ',
          text: 'ໂຄງສ້າງໄຟລ໌ JSON ເສຍຫາຍ ຫຼື ບໍ່ຖືກຕ້ອງຕາມມາດຕະຖານ',
          confirmButtonText: 'ຕົກລົງ',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleRestore = async () => {
    if (!fileContent) {
      Swal.fire({
        icon: 'warning',
        title: 'ແຈ້ງເຕືອນ',
        text: 'ກະລຸນາເລືອກໄຟລ໌ສຳຮອງຂໍ້ມູນ (.json) ກ່ອນ',
        confirmButtonText: 'ຕົກລົງ',
      });
      return;
    }

    const incomingCount = fileContent.incomingDocs?.length || fileContent.data?.incomingDocs?.length || 0;
    const outgoingCount = fileContent.outgoingDocs?.length || fileContent.data?.outgoingDocs?.length || 0;
    const totalCount = fileContent.totalCount || incomingCount + outgoingCount;

    const confirmResult = await Swal.fire({
      title: 'ຢືນຢັນການກູ້ຄືນຂໍ້ມູນ?',
      text: `ພົບຂໍ້ມູນທັງໝົດ ${totalCount} ລາຍການ (ຂາເຂົ້າ: ${incomingCount}, ຂາອອກ: ${outgoingCount}). ທ່ານຕ້ອງການກູ້ຄືນຂໍ້ມູນເຂົ້າສູ່ລະບົບແທ້ບໍ່?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ຢືນຢັນກູ້ຄືນ',
      cancelButtonText: 'ຍົກເລີກ',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#94a3b8',
    });

    if (!confirmResult.isConfirmed) return;

    try {
      setIsRestoring(true);
      const res = await api.restoreBackup(fileContent);
      if (res.success) {
        await Swal.fire({
          icon: 'success',
          title: 'ກູ້ຄືນຂໍ້ມູນສຳເລັດ!',
          text: res.message,
          timer: 3500,
          showConfirmButton: false,
        });
        setSelectedFile(null);
        setFileContent(null);
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'ເກີດຂໍ້ຜິດພາດໃນການ Restore',
        text: err.message || 'ບໍ່ສາມາດກູ້ຄືນຂໍ້ມູນໄດ້',
        confirmButtonText: 'ຕົກລົງ',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden transform transition-all">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">BackUp & Restore</h2>
              <p className="text-xs text-slate-500">
                ຈັດການສຳຮອງ ແລະ ກູ້ຄືນຂໍ້ມູນ: <span className="font-semibold text-blue-600">{scopeTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'backup'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Download className="w-4 h-4" />
            ສຳຮອງຂໍ້ມູນ (BackUp)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'restore'
                ? 'bg-white text-amber-700 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Upload className="w-4 h-4" />
            ກູ້ຄືນຂໍ້ມູນ (Restore)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'backup' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-blue-950">ລະບົບຈະສ້າງໄຟລ໌ສຳຮອງແບບ JSON</p>
                  <p className="text-blue-800 leading-relaxed">
                    ໄຟລ໌ສຳຮອງຈະບັນຈຸຂໍ້ມູນເອກະສານ, ປະຫວັດ, ຂໍ້ມູນໄຟລ໌ແນບ, ເລກທີ, ແລະ ຂໍ້ມູນລະບົບທັງໝົດ ເພື່ອໃຫ້ທ່ານສາມາດນຳມາກູ້ຄືນໄດ້ທຸກເວລາ.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center py-6 text-center">
                <Database className="w-12 h-12 text-blue-500/80 mb-2 animate-pulse" />
                <h3 className="font-bold text-slate-800 text-sm">ສຳຮອງຂໍ້ມູນ: {scopeTitle}</h3>
                <p className="text-xs text-slate-500 mt-0.5">ກົດປຸ່ມດ້ານລຸ່ມເພື່ອດາວໂຫລດໄຟລ໌ສຳຮອງ</p>
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleExport}
                isLoading={isExporting}
                className="w-full font-bold shadow-lg shadow-blue-600/20"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'ກຳລັງສ້າງໄຟລ໌...' : 'ດາວໂຫລດໄຟລ໌ BackUp (.json)'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-950">ຄຳແນະນຳການກູ້ຄືນ</p>
                  <p className="text-amber-800 leading-relaxed">
                    ກະລຸນາເລືອກໄຟລ໌ທີ່ເຄີຍ BackUp ຈາກລະບົບ E-Document Management. ລະບົບຈະກວດສອບຄວາມຖືກຕ້ອງ ແລະ ນຳເຂົ້າຂໍ້ມູນຢ່າງປອດໄພ.
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30"
              >
                <Upload className="w-10 h-10 text-slate-400 mb-2" />
                {selectedFile ? (
                  <div>
                    <p className="text-xs font-bold text-blue-700">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB • ກົດເພື່ອປ່ຽນໄຟລ໌
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-700">ຄລິກເພື່ອເລືອກໄຟລ໌ສຳຮອງ (.json)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">ຮອງຮັບໄຟລ໌ JSON ຈາກລະບົບ</p>
                  </div>
                )}
              </div>

              {fileContent && (
                <div className="p-3.5 rounded-xl bg-slate-100 text-xs text-slate-700 flex items-center justify-between">
                  <span className="font-medium">ຈຳນວນຂໍ້ມູນໃນໄຟລ໌:</span>
                  <span className="font-bold text-blue-700">
                    {fileContent.totalCount ||
                      (fileContent.incomingDocs?.length || 0) + (fileContent.outgoingDocs?.length || 0)}{' '}
                    ລາຍການ
                  </span>
                </div>
              )}

              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleRestore}
                isLoading={isRestoring}
                disabled={!fileContent}
                className="w-full font-bold shadow-lg shadow-amber-600/20 bg-amber-600 hover:bg-amber-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {isRestoring ? 'ກຳລັງກູ້ຄືນຂໍ້ມູນ...' : 'ເລີ່ມການກູ້ຄືນຂໍ້ມູນ (Restore Now)'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
