import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Check, PenTool, Upload, Trash2, Eraser } from 'lucide-react';
import { Button } from '../ui/Button';

export interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  title?: string;
  initialSignature?: string;
  signerName?: string;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title = 'ເຊັນລາຍເຊັນອອນລາຍ (Digital Signature Pad)',
  initialSignature = '',
  signerName = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<string>('#0f2d6b'); // Official Lao ink blue
  const [penWidth, setPenWidth] = useState<number>(3);
  const [history, setHistory] = useState<ImageData[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Setup canvas with high DPI for sharp handwriting
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;

    // If there's an existing signature (e.g. data URL), load it onto canvas
    if (initialSignature && initialSignature.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
        saveHistory();
      };
      img.src = initialSignature;
    } else {
      ctx.clearRect(0, 0, rect.width, rect.height);
      setHistory([]);
      setHasDrawn(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Small timeout to ensure DOM rect is calculated after modal opens
      const timer = setTimeout(() => {
        setupCanvas();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialSignature]);

  // Update pen settings on context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
  }, [penColor, penWidth]);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), currentData]);
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    saveHistory();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;

    const coords = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch (err) {}

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setHistory([]);
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // Remove current
    const previous = newHistory[newHistory.length - 1];

    if (previous) {
      ctx.putImageData(previous, 0, 0);
      setHistory(newHistory);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHistory([]);
      setHasDrawn(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        saveHistory();
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!hasDrawn) {
      onSave('');
      onClose();
      return;
    }

    // Convert to transparent PNG
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100/70 text-blue-700 rounded-xl">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-snug">
                {title}
              </h3>
              {signerName && (
                <p className="text-xs text-slate-500 font-medium">
                  ຜູ້ລົງລາຍເຊັນ: <span className="text-blue-700 font-bold">{signerName}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            {/* Ink Colors */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-medium mr-1">ສີປາກກາ:</span>
              <button
                type="button"
                onClick={() => setPenColor('#0f2d6b')}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  penColor === '#0f2d6b' ? 'scale-110 border-blue-600 shadow-xs' : 'border-transparent'
                }`}
                style={{ backgroundColor: '#0f2d6b' }}
                title="ສີນ້ຳເງິນທາງການ (Office Blue)"
              />
              <button
                type="button"
                onClick={() => setPenColor('#09090b')}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  penColor === '#09090b' ? 'scale-110 border-slate-900 shadow-xs' : 'border-transparent'
                }`}
                style={{ backgroundColor: '#09090b' }}
                title="ສີດຳ (Classic Black)"
              />
              <button
                type="button"
                onClick={() => setPenColor('#b91c1c')}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  penColor === '#b91c1c' ? 'scale-110 border-red-600 shadow-xs' : 'border-transparent'
                }`}
                style={{ backgroundColor: '#b91c1c' }}
                title="ສີແດງ (Red Ink)"
              />
            </div>

            {/* Pen Stroke Width */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-medium mr-1">ຂະໜາດ:</span>
              <button
                type="button"
                onClick={() => setPenWidth(2)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                  penWidth === 2 ? 'bg-white border-blue-500 text-blue-700 shadow-xs' : 'border-slate-200 text-slate-600'
                }`}
              >
                ບາງ (2px)
              </button>
              <button
                type="button"
                onClick={() => setPenWidth(3.5)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                  penWidth === 3.5 ? 'bg-white border-blue-500 text-blue-700 shadow-xs' : 'border-slate-200 text-slate-600'
                }`}
              >
                ປານກາງ (3.5px)
              </button>
              <button
                type="button"
                onClick={() => setPenWidth(5)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                  penWidth === 5 ? 'bg-white border-blue-500 text-blue-700 shadow-xs' : 'border-slate-200 text-slate-600'
                }`}
              >
                ໜາ (5px)
              </button>
            </div>
          </div>

          {/* Canvas Signature Pad */}
          <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden shadow-inner touch-none">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-full h-56 cursor-crosshair block touch-none"
              style={{ touchAction: 'none' }}
            />

            {/* Guide line for realistic signature placement */}
            <div className="pointer-events-none absolute bottom-9 left-6 right-6 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-300 font-mono select-none">
              <span>✍️ ເຊັນລາຍເຊັນຢູ່ເທິງເສັ້ນນີ້ (Sign here)</span>
              <span>X</span>
            </div>

            {/* Watermark help text when untouched */}
            {!hasDrawn && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-300 select-none pb-4">
                <PenTool className="w-8 h-8 mb-1.5 opacity-40 animate-pulse" />
                <span className="text-xs font-medium">ໃຊ້ປາກກາ, ນິ້ວມື ຫຼື ເມົາສ໌ ແຕ້ມລາຍເຊັນໃສ່ບ່ອນນີ້</span>
              </div>
            )}
          </div>

          {/* Quick Actions (Undo, Clear, Upload) */}
          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                title="ຍົກເລີກເສັ້ນລ່າສຸດ"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                ຍົກເລີກເສັ້ນ
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg font-medium transition-colors"
                title="ລຶບແຕ້ມໃໝ່ທັງໝົດ"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ລຶບໃໝ່
              </button>
            </div>

            <div>
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
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                title="ເລືອກຮູບລາຍເຊັນຈາກຄອມພິວເຕີ"
              >
                <Upload className="w-3.5 h-3.5" />
                ອັບໂຫລດຮູບ
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-slate-100 bg-slate-50/70">
          <Button variant="outline" size="sm" onClick={onClose}>
            ຍົກເລີກ
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveSignature}
            className="bg-blue-600 hover:bg-blue-700 shadow-xs"
          >
            <Check className="w-4 h-4 mr-1.5" />
            ບັນທຶກລາຍເຊັນ
          </Button>
        </div>
      </div>
    </div>
  );
};
