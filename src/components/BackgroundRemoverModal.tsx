import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  Eraser,
  Pipette,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface BackgroundRemoverModalProps {
  isOpen: boolean;
  initialImage?: string;
  targetLabel?: string;
  onClose: () => void;
  onApply: (transparentPngDataUrl: string) => void;
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function detectCornerColor(data: Uint8ClampedArray, width: number, height: number): RGB {
  const sampleCoords = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [0, Math.floor(height / 2)],
    [width - 1, Math.floor(height / 2)],
    [Math.floor(width / 2), height - 1],
  ];

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let count = 0;

  for (const [x, y] of sampleCoords) {
    const idx = (y * width + x) * 4;
    if (data[idx + 3] > 20) {
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
      count++;
    }
  }

  if (count === 0) return { r: 255, g: 255, b: 255 };
  return {
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count),
  };
}

export function BackgroundRemoverModal({
  isOpen,
  initialImage,
  targetLabel = 'Image',
  onClose,
  onApply,
}: BackgroundRemoverModalProps) {
  const [sourceUrl, setSourceUrl] = useState<string>(initialImage || '');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [targetColor, setTargetColor] = useState<RGB>({ r: 255, g: 255, b: 255 });
  const [tolerance, setTolerance] = useState<number>(40);
  const [feather, setFeather] = useState<number>(10);
  const [mode, setMode] = useState<'flood' | 'global'>('flood');
  const [previewBg, setPreviewBg] = useState<'checker' | 'wine' | 'cream'>('checker');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadedImgRef = useRef<HTMLImageElement | null>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSourceUrl(initialImage || '');
      setResultUrl('');
      setErrorMsg(null);
      setTolerance(40);
      setFeather(10);
      setMode('flood');
    }
  }, [isOpen, initialImage]);

  const runRemoval = useCallback(
    (img: HTMLImageElement, bgColor: RGB, tol: number, soft: number, removalMode: 'flood' | 'global') => {
      setIsProcessing(true);
      setErrorMsg(null);

      try {
        const maxDim = 1024;
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
        const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
        const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setIsProcessing(false);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const hardLimit = tol;
        const softLimit = tol + soft * 2.5;

        if (removalMode === 'global') {
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue;
            const dist = colorDistance(data[i], data[i + 1], data[i + 2], bgColor.r, bgColor.g, bgColor.b);
            if (dist <= hardLimit) {
              data[i + 3] = 0;
            } else if (soft > 0 && dist < softLimit) {
              const factor = (dist - hardLimit) / (softLimit - hardLimit);
              data[i + 3] = Math.round(data[i + 3] * factor);
            }
          }
        } else {
          // Edge-connected flood fill so interior colors of the subject/logo stay intact
          const visited = new Uint8Array(width * height);
          const queue = new Int32Array(width * height);
          let head = 0;
          let tail = 0;

          const enqueueIfBg = (x: number, y: number) => {
            const pos = y * width + x;
            if (visited[pos]) return;
            const idx = pos * 4;
            const dist = colorDistance(data[idx], data[idx + 1], data[idx + 2], bgColor.r, bgColor.g, bgColor.b);
            if (dist <= softLimit || data[idx + 3] < 10) {
              visited[pos] = 1;
              queue[tail++] = pos;
            }
          };

          for (let x = 0; x < width; x++) {
            enqueueIfBg(x, 0);
            enqueueIfBg(x, height - 1);
          }
          for (let y = 0; y < height; y++) {
            enqueueIfBg(0, y);
            enqueueIfBg(width - 1, y);
          }

          while (head < tail) {
            const pos = queue[head++];
            const idx = pos * 4;
            const dist = colorDistance(data[idx], data[idx + 1], data[idx + 2], bgColor.r, bgColor.g, bgColor.b);

            if (dist <= hardLimit) {
              data[idx + 3] = 0;
            } else if (soft > 0 && dist < softLimit) {
              const factor = (dist - hardLimit) / (softLimit - hardLimit);
              data[idx + 3] = Math.round(data[idx + 3] * factor);
            }

            // Only continue flooding through pixels that are close enough to background
            if (dist <= hardLimit + soft) {
              const x = pos % width;
              const y = (pos - x) / width;
              if (x > 0) enqueueIfBg(x - 1, y);
              if (x < width - 1) enqueueIfBg(x + 1, y);
              if (y > 0) enqueueIfBg(x, y - 1);
              if (y < height - 1) enqueueIfBg(x, y + 1);
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const webpUrl = canvas.toDataURL('image/webp', 0.88);
        const pngUrl = canvas.toDataURL('image/png');
        setResultUrl(webpUrl.startsWith('data:image/webp') && webpUrl.length < pngUrl.length ? webpUrl : pngUrl);
      } catch {
        setErrorMsg(
          'This external image blocks browser pixel editing (CORS). Upload the image file from your device to remove its background.'
        );
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  // Load image whenever sourceUrl changes
  useEffect(() => {
    if (!isOpen || !sourceUrl?.trim()) {
      loadedImgRef.current = null;
      setResultUrl('');
      return;
    }

    const img = new Image();
    if (!sourceUrl.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      loadedImgRef.current = img;

      // Draw onto sourceCanvas for eyedropper sampling & auto-detect corner color
      const maxDim = 600;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
      const w = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
      const h = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

      const sCanvas = sourceCanvasRef.current;
      if (sCanvas) {
        sCanvas.width = w;
        sCanvas.height = h;
        const sCtx = sCanvas.getContext('2d', { willReadFrequently: true });
        if (sCtx) {
          sCtx.clearRect(0, 0, w, h);
          sCtx.drawImage(img, 0, 0, w, h);
          try {
            const sample = sCtx.getImageData(0, 0, w, h);
            const detected = detectCornerColor(sample.data, w, h);
            setTargetColor(detected);
            runRemoval(img, detected, tolerance, feather, mode);
            return;
          } catch {
            setErrorMsg(
              'This external image blocks browser pixel editing (CORS). Upload the image file from your device to remove its background.'
            );
            return;
          }
        }
      }
      runRemoval(img, targetColor, tolerance, feather, mode);
    };
    img.onerror = () => {
      setErrorMsg('Could not load image. Please upload an image file from your device.');
    };
    img.src = sourceUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sourceUrl]);

  // Re-run when parameters change
  useEffect(() => {
    if (!isOpen || !loadedImgRef.current) return;
    const timer = setTimeout(() => {
      if (loadedImgRef.current) {
        runRemoval(loadedImgRef.current, targetColor, tolerance, feather, mode);
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [isOpen, targetColor, tolerance, feather, mode, runRemoval]);

  const handleLocalFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string | undefined;
      if (dataUrl) {
        setErrorMsg(null);
        setSourceUrl(dataUrl);
      } else {
        setErrorMsg('Could not read the selected image file.');
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to load the selected image file from your device.');
    };
    reader.readAsDataURL(file);
  };

  const handleSampleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sourceCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    try {
      const pixel = ctx.getImageData(
        Math.max(0, Math.min(canvas.width - 1, x)),
        Math.max(0, Math.min(canvas.height - 1, y)),
        1,
        1
      ).data;
      setTargetColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
    } catch {
      // Ignore CORS error
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = 'transparent-cutout.png';
    a.click();
  };

  if (!isOpen) return null;

  const previewBgStyle: React.CSSProperties =
    previewBg === 'wine'
      ? { backgroundColor: '#3d111e' }
      : previewBg === 'cream'
      ? { backgroundColor: '#efeee9' }
      : {
          backgroundColor: '#1f1f1f',
          backgroundImage:
            'linear-gradient(45deg, #2d2d2d 25%, transparent 25%), linear-gradient(-45deg, #2d2d2d 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2d2d2d 75%), linear-gradient(-45deg, transparent 75%, #2d2d2d 75%)',
          backgroundSize: '18px 18px',
          backgroundPosition: '0 0, 0 9px, 9px -9px, -9px 0px',
        };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92dvh] bg-[#161616] text-[#efeee9] rounded-2xl sm:rounded-3xl border border-white/15 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-white/10 bg-[#121212] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#ebd2d8] text-[#3d111e] flex items-center justify-center shrink-0">
              <Eraser size={15} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white truncate">
                Background Remover &mdash; {targetLabel}
              </h3>
              <p className="text-[11px] text-white/55 truncate">
                Click any background pixel on the original image to sample &bull; Outputs transparent PNG
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Background Remover"
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Top Upload + Mode Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-black/40 border border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer transition-all">
                <Upload size={14} />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLocalFilePick}
                />
              </label>

              <div className="inline-flex items-center rounded-xl bg-black/50 border border-white/10 p-1">
                <button
                  type="button"
                  onClick={() => setMode('flood')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                    mode === 'flood' ? 'bg-[#ebd2d8] text-[#3d111e]' : 'text-white/65 hover:text-white'
                  }`}
                >
                  Smart Edge Cutout
                </button>
                <button
                  type="button"
                  onClick={() => setMode('global')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                    mode === 'global' ? 'bg-[#ebd2d8] text-[#3d111e]' : 'text-white/65 hover:text-white'
                  }`}
                >
                  All Matching Color
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/55 text-[11px] flex items-center gap-1">
                <Pipette size={12} /> Sampled BG:
              </span>
              <span
                className="w-5 h-5 rounded-md border border-white/30 inline-block"
                style={{ backgroundColor: `rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b})` }}
                title={`RGB(${targetColor.r}, ${targetColor.g}, ${targetColor.b})`}
              />
              <button
                type="button"
                onClick={() => {
                  setTolerance(40);
                  setFeather(10);
                  setMode('flood');
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer"
                title="Reset settings"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-400/35 text-xs text-amber-200">
              {errorMsg}
            </div>
          )}

          {/* Side-by-side Canvases */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original (Click to sample) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold text-white/60">
                <span>Original (Click Background to Sample)</span>
              </div>
              <div className="h-56 sm:h-64 rounded-xl bg-black/60 border border-white/15 flex items-center justify-center p-3 overflow-hidden">
                {sourceUrl?.trim() ? (
                  <canvas
                    ref={sourceCanvasRef}
                    onClick={handleSampleClick}
                    className="max-h-full max-w-full object-contain cursor-crosshair"
                    title="Click any pixel to set the background color to remove"
                  />
                ) : (
                  <span className="text-xs text-white/40">Upload an image to begin</span>
                )}
              </div>
            </div>

            {/* Result Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold text-white/60">
                <span className="flex items-center gap-1.5 text-[#ebd2d8]">
                  <Sparkles size={12} /> Transparent Result
                </span>
                <div className="flex items-center gap-1">
                  {(['checker', 'wine', 'cream'] as const).map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setPreviewBg(bg)}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold cursor-pointer border ${
                        previewBg === bg
                          ? 'border-[#ebd2d8] text-[#ebd2d8] bg-white/10'
                          : 'border-white/15 text-white/50 hover:text-white'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
              <div
                className="h-56 sm:h-64 rounded-xl border border-white/15 flex items-center justify-center p-3 overflow-hidden relative"
                style={previewBgStyle}
              >
                {isProcessing ? (
                  <span className="text-xs text-white/70 font-semibold">Processing cutout...</span>
                ) : resultUrl ? (
                  <img
                    src={resultUrl}
                    alt="Transparent cutout preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-white/40">Preview will appear here</span>
                )}
              </div>
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-black/35 border border-white/10">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold uppercase tracking-wider text-white/80">Color Tolerance</label>
                <span className="font-mono text-[#ebd2d8]">{tolerance}</span>
              </div>
              <input
                type="range"
                min={5}
                max={130}
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full accent-[#ebd2d8] cursor-pointer"
              />
              <p className="text-[10px] text-white/45">
                Increase to remove shadows or gradients around the background.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold uppercase tracking-wider text-white/80">Edge Smoothness</label>
                <span className="font-mono text-[#ebd2d8]">{feather}</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={feather}
                onChange={(e) => setFeather(Number(e.target.value))}
                className="w-full accent-[#ebd2d8] cursor-pointer"
              />
              <p className="text-[10px] text-white/45">
                Softens harsh edges for clean blending on dark or light backgrounds.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-t border-white/10 bg-[#121212] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={!resultUrl}
            onClick={handleDownload}
            className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            <Download size={14} />
            <span>Download PNG</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-white/20 text-xs font-bold uppercase tracking-wider text-white/80 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!resultUrl}
              onClick={() => {
                if (resultUrl) {
                  onApply(resultUrl);
                  onClose();
                }
              }}
              className="px-5 py-2.5 rounded-full bg-[#ebd2d8] text-[#3d111e] hover:bg-[#efeee9] disabled:opacity-40 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-lg"
            >
              <Check size={14} />
              <span>Use Transparent Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
