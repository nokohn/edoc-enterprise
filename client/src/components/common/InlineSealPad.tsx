import React, { useRef, useState } from 'react';
import { Stamp, Upload, Trash2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export interface InlineSealPadProps {
  value?: string;
  onChange: (sealDataUrl: string) => void;
  label?: string;
  height?: number; // In pixels, default: 95
  departmentName?: string;
}

// Generate an authentic Lao official red circular stamp SVG as Data URL
export const generateLhseStampSvg = (
  deptName = 'ພະແນກພັດທະນາ',
  stampStatus = 'ກວດກາຖືກຕ້ອງ'
): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <circle cx="100" cy="100" r="92" fill="none" stroke="#dc2626" stroke-width="4.5"/>
    <circle cx="100" cy="100" r="82" fill="none" stroke="#dc2626" stroke-width="1.8"/>
    <defs>
      <path id="topCurve" d="M 24,100 A 76,76 0 0,1 176,100" fill="none"/>
      <path id="bottomCurve" d="M 174,100 A 74,74 0 0,1 26,100" fill="none"/>
    </defs>
    <text font-family="'Noto Sans Lao', system-ui, sans-serif" font-size="11.5" font-weight="bold" fill="#dc2626">
      <textPath href="#topCurve" startOffset="50%" text-anchor="middle">
        ★ ລັດວິສາຫະກິດຖືຮຸ້ນລາວ ★
      </textPath>
    </text>
    <text font-family="'Noto Sans Lao', system-ui, sans-serif" font-size="11" font-weight="bold" fill="#dc2626">
      <textPath href="#bottomCurve" startOffset="50%" text-anchor="middle">
        ${deptName} • LHSE
      </textPath>
    </text>
    <g transform="translate(100, 80)">
      <polygon points="0,-14 4,-3 15,-3 6,4 9,15 0,8 -9,15 -6,4 -15,-3 -4,-3" fill="#dc2626" />
    </g>
    <rect x="36" y="98" width="128" height="28" rx="4" fill="none" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3,1"/>
    <text x="100" y="117" font-family="'Noto Sans Lao', system-ui, sans-serif" font-size="12.5" font-weight="bold" fill="#dc2626" text-anchor="middle">
      ${stampStatus}
    </text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const generateRectStampSvg = (
  title = 'ລັດວິສາຫະກິດຖືຮຸ້ນລາວ',
  subText = 'ຮັບຮອງຖືກຕ້ອງຕາມລະບຽບ'
): string => {
  const dateStr = new Date().toLocaleDateString('lo-LA');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 100" width="240" height="100">
    <rect x="4" y="4" width="232" height="92" rx="8" fill="none" stroke="#dc2626" stroke-width="3"/>
    <rect x="9" y="9" width="222" height="82" rx="5" fill="none" stroke="#dc2626" stroke-width="1.2" stroke-dasharray="4,2"/>
    <text x="120" y="32" font-family="'Noto Sans Lao', system-ui, sans-serif" font-size="12" font-weight="bold" fill="#dc2626" text-anchor="middle">
      ★ ${title} ★
    </text>
    <text x="120" y="55" font-family="'Noto Sans Lao', system-ui, sans-serif" font-size="13" font-weight="extrabold" fill="#b91c1c" text-anchor="middle">
      [ ${subText} ]
    </text>
    <text x="120" y="78" font-family="'Noto Sans Lao', system-ui, sans-serif" font-size="9.5" fill="#dc2626" text-anchor="middle">
      ວັນທີ: ${dateStr}
    </text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const InlineSealPad: React.FC<InlineSealPadProps> = ({
  value = '',
  onChange,
  label = '🔴 ຊ່ອງທີ 2: ກາປະທັບເອເລັກໂຕນິກ (E-Stamp):',
  height = 95,
  departmentName = 'ພະແນກພັດທະນາ',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = (type: 'dept' | 'rect' | 'director') => {
    if (type === 'dept') {
      const stamp = generateLhseStampSvg(departmentName || 'ພະແນກພັດທະນາ', 'ກວດກາຖືກຕ້ອງ');
      onChange(stamp);
    } else if (type === 'director') {
      const stamp = generateLhseStampSvg('ຄະນະຜູ້ອຳນວຍການ', 'ອະນຸມັດແລ້ວ');
      onChange(stamp);
    } else {
      const stamp = generateRectStampSvg('ລັດວິສາຫະກິດຖືຮຸ້ນລາວ', 'ກວດກາແລ້ວ');
      onChange(stamp);
    }
    setShowPresets(false);
  };

  return (
    <div className="space-y-1.5 w-full">
      {/* Label and Controls */}
      <div className="flex items-center justify-between text-xs">
        <label className="font-bold text-slate-700 flex items-center gap-1.5">
          <Stamp className="w-3.5 h-3.5 text-rose-600" />
          {label}
        </label>

        <div className="flex items-center gap-1.5">
          {/* Preset Stamps Dropdown Toggle */}
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
            title="ເລືອກກາປະທັບສຳເລັດຮູບ LHSE"
          >
            <Sparkles className="w-3 h-3 text-rose-600" />
            ກາປະທັບ LHSE
          </button>

          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1 text-slate-500 hover:text-slate-800 rounded transition-colors"
            title="ອັບໂຫລດຮູບກາປະທັບ (PNG/JPG)"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          {/* Clear Button */}
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1 text-rose-500 hover:text-rose-700 rounded transition-colors"
              title="ລຶບກາປະທັບ"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Preset Stamps Quick Selector Popup */}
      {showPresets && (
        <div className="p-2.5 bg-rose-50/90 rounded-xl border border-rose-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs shadow-xs animate-in fade-in duration-150">
          <button
            type="button"
            onClick={() => handleApplyPreset('dept')}
            className="p-2 bg-white rounded-lg border border-rose-200 hover:border-rose-400 hover:bg-rose-50/50 flex flex-col items-center text-center gap-1 transition-all"
          >
            <span className="font-bold text-rose-700 text-[11px]">ກາປະທັບ ພະແນກພັດທະນາ</span>
            <span className="text-[10px] text-slate-500">ຮູບວົງມົນແດງ LHSE</span>
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('director')}
            className="p-2 bg-white rounded-lg border border-rose-200 hover:border-rose-400 hover:bg-rose-50/50 flex flex-col items-center text-center gap-1 transition-all"
          >
            <span className="font-bold text-rose-700 text-[11px]">ກາປະທັບ ຜູ້ອຳນວຍການ</span>
            <span className="text-[10px] text-slate-500">ອະນຸມັດແລ້ວ</span>
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('rect')}
            className="p-2 bg-white rounded-lg border border-rose-200 hover:border-rose-400 hover:bg-rose-50/50 flex flex-col items-center text-center gap-1 transition-all"
          >
            <span className="font-bold text-rose-700 text-[11px]">ກາປະທັບ ກວດກາແລ້ວ</span>
            <span className="text-[10px] text-slate-500">ຮູບສີ່ຫຼ່ຽມແດງ</span>
          </button>
        </div>
      )}

      {/* Visible Seal Box */}
      <div
        className="relative w-full rounded-xl border-2 border-dashed border-rose-300 bg-rose-50/20 hover:bg-rose-50/40 transition-colors overflow-hidden flex items-center justify-center p-2 shadow-2xs group"
        style={{ height: `${height}px` }}
      >
        {value ? (
          <div className="relative flex items-center justify-center h-full w-full">
            <img
              src={value}
              alt="ກາປະທັບເອເລັກໂຕນິກ"
              className="h-full max-h-[82px] object-contain drop-shadow-xs rotate-[-2deg] transition-transform group-hover:scale-105"
            />
            <span className="absolute bottom-1 right-2 text-[10px] font-semibold text-rose-700 bg-white/90 px-1.5 py-0.5 rounded border border-rose-200 shadow-2xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-rose-600" />
              ກາປະທັບແລ້ວ
            </span>
          </div>
        ) : (
          <div className="text-center space-y-1 select-none">
            <div className="flex items-center justify-center gap-1.5 text-rose-400">
              <Stamp className="w-5 h-5 opacity-70" />
              <span className="text-xs font-semibold text-rose-700">
                ກົດປຸ່ມ "ກາປະທັບ LHSE" ຫຼື ອັບໂຫລດຮູບກາປະທັບ
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              ຮອງຮັບໄຟລ໌ກາປະທັບ PNG (ພື້ນຫຼັງໂປ່ງໃສ) ຫຼື ເລືອກກາປະທັບທາງການ LHSE
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
