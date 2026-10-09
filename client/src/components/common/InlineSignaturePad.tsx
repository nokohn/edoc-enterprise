import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Trash2, Upload, Maximize2, PenTool } from 'lucide-react';

export interface InlineSignaturePadProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  height?: number; // In pixels, default: 110
  onExpandModal?: () => void;
}

export const InlineSignaturePad: React.FC<InlineSignaturePadProps> = ({
  value = '',
  onChange,
  label = '✍️ ຊ່ອງລົງລາຍເຊັນດ້ວຍປາກກາ (Digital Signature):',
  height = 110,
  onExpandModal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<string>('#0f2d6b'); // Official Lao ink blue
  const [penWidth] = useState<number>(3);
  const [history, setHistory] = useState<ImageData[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = (height || 110) * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;

    if (value && value.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, height);
        ctx.drawImage(img, 0, 0, rect.width, height);
        setHasDrawn(true);
      };
      img.src = value;
    } else {
      ctx.clearRect(0, 0, rect.width, height);
      setHistory([]);
      setHasDrawn(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setupCanvas();
    }, 50);

    const handleResize = () => {
      setupCanvas();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [value, height]);

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
    setHistory((prev) => [...prev.slice(-10), currentData]);
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

    // Emit updated signature data URL immediately
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setHistory([]);
    onChange('');
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop();
    const previous = newHistory[newHistory.length - 1];

    if (previous) {
      ctx.putImageData(previous, 0, 0);
      setHistory(newHistory);
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHistory([]);
      setHasDrawn(false);
      onChange('');
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
        ctx.clearRect(0, 0, rect.width, height);
        ctx.drawImage(img, 0, 0, rect.width, height);
        setHasDrawn(true);
        onChange(canvas.toDataURL('image/png'));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div ref={containerRef} className="space-y-1.5 w-full">
      {/* Label and Quick Controls */}
      <div className="flex items-center justify-between text-xs">
        <label className="font-bold text-slate-700 flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-blue-600" />
          {label}
        </label>

        {/* Ink Colors & Tools */}
        <div className="flex items-center gap-2">
          {/* Color pickers */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
            <button
              type="button"
              onClick={() => setPenColor('#0f2d6b')}
              className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                penColor === '#0f2d6b' ? 'scale-125 border-blue-600 shadow-2xs' : 'border-transparent'
              }`}
              style={{ backgroundColor: '#0f2d6b' }}
              title="ສີນ້ຳເງິນທາງການ"
            />
            <button
              type="button"
              onClick={() => setPenColor('#09090b')}
              className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                penColor === '#09090b' ? 'scale-125 border-slate-900 shadow-2xs' : 'border-transparent'
              }`}
              style={{ backgroundColor: '#09090b' }}
              title="ສີດຳ"
            />
            <button
              type="button"
              onClick={() => setPenColor('#b91c1c')}
              className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                penColor === '#b91c1c' ? 'scale-125 border-red-600 shadow-2xs' : 'border-transparent'
              }`}
              style={{ backgroundColor: '#b91c1c' }}
              title="ສີແດງ"
            />
          </div>

          {/* Undo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
            title="ຍົກເລີກເສັ້ນລ່າສຸດ"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasDrawn && !value}
            className="p-1 text-rose-500 hover:text-rose-700 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
            title="ລຶບແຕ້ມໃໝ່"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Upload */}
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
            title="ອັບໂຫລດຮູບລາຍເຊັນ"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          {/* Expand to Modal (Optional) */}
          {onExpandModal && (
            <button
              type="button"
              onClick={onExpandModal}
              className="p-1 text-blue-600 hover:text-blue-800 rounded transition-colors"
              title="ຂະຫຍາຍແຕ້ມເຕັມຈໍ"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Visible Signature Drawing Canvas Box */}
      <div
        className="relative w-full rounded-xl border-2 border-dashed border-blue-300 bg-white overflow-hidden shadow-2xs cursor-crosshair group touch-none"
        style={{ height: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full block touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
        />

        {/* Signature placement line */}
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 border-b border-dashed border-slate-200 flex items-center justify-between text-[10px] text-slate-300 select-none">
          <span>✍️ ແຕ້ມລາຍເຊັນໃສ່ບ່ອນນີ້ (Sign here)</span>
          <span>X</span>
        </div>

        {/* Watermark text when no signature is drawn yet */}
        {!hasDrawn && !value && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-300 select-none pb-2">
            <span className="text-xs font-medium text-slate-400">
              ໃຊ້ປາກກາ, ນິ້ວມື ຫຼື ເມົາສ໌ ແຕ້ມລາຍເຊັນໃສ່ຊ່ອງນີ້ໂດຍກົງ
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
