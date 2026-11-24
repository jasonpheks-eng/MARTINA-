import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eraser,
  FlipHorizontal2,
  FlipVertical2,
  Palette,
  RotateCcw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import type { ImageStyleConfig, ThemeColors } from '../studioFormat';

interface ImageStyleControlsProps {
  style?: ImageStyleConfig;
  onChange: (next: ImageStyleConfig) => void;
  themeColors: ThemeColors;
  onOpenBgRemover: () => void;
  defaultOpen?: boolean;
  compact?: boolean;
}

export function ImageStyleControls({
  style,
  onChange,
  themeColors,
  onOpenBgRemover,
  defaultOpen = false,
  compact = false,
}: ImageStyleControlsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const current = style || {};

  const update = (patch: Partial<ImageStyleConfig>) => {
    onChange({ ...current, ...patch });
  };

  const resetAll = () => {
    onChange({
      scale: 100,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
      blendMode: 'normal',
      bgColor: 'transparent',
      matchTheme: false,
      fit: 'cover',
      rounded: 'none',
      opacity: 100,
    });
  };

  const themeSwatches = [
    { id: 'transparent', label: 'None', color: 'transparent' },
    { id: 'theme-wine', label: 'Wine', color: themeColors.wine },
    { id: 'theme-card', label: 'Card', color: themeColors.cardBg },
    { id: 'theme-blush', label: 'Blush', color: themeColors.blush },
    { id: 'theme-cream', label: 'Cream', color: themeColors.cream },
    { id: 'theme-wellness', label: 'Sage', color: themeColors.wellnessBg },
  ];

  return (
    <div className="rounded-xl bg-black/30 border border-white/10 overflow-hidden">
      {/* Quick Action Bar (always visible right under upload button) */}
      <div className="p-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenBgRemover}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#ebd2d8]/15 hover:bg-[#ebd2d8]/25 text-[11px] font-bold text-[#ebd2d8] border border-[#ebd2d8]/35 cursor-pointer transition-all"
            title="Open Background Remover"
          >
            <Eraser size={12} />
            <span>Remove BG</span>
          </button>

          <button
            type="button"
            onClick={() => update({ flipX: !current.flipX })}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${
              current.flipX
                ? 'bg-[#ebd2d8] text-[#3d111e] border-[#ebd2d8]'
                : 'bg-white/5 text-white/75 border-white/10 hover:border-white/30'
            }`}
            title="Flip Horizontally"
          >
            <FlipHorizontal2 size={12} />
            <span>Flip H</span>
          </button>

          <button
            type="button"
            onClick={() => update({ flipY: !current.flipY })}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${
              current.flipY
                ? 'bg-[#ebd2d8] text-[#3d111e] border-[#ebd2d8]'
                : 'bg-white/5 text-white/75 border-white/10 hover:border-white/30'
            }`}
            title="Flip Vertically"
          >
            <FlipVertical2 size={12} />
            <span>Flip V</span>
          </button>

          <button
            type="button"
            onClick={() =>
              update({
                matchTheme: !current.matchTheme,
                bgColor: !current.matchTheme && (!current.bgColor || current.bgColor === 'transparent')
                  ? 'theme-wine'
                  : current.bgColor,
              })
            }
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${
              current.matchTheme
                ? 'bg-[#ebd2d8] text-[#3d111e] border-[#ebd2d8]'
                : 'bg-white/5 text-white/75 border-white/10 hover:border-white/30'
            }`}
            title="Match image tone & background with active Studio Theme"
          >
            <Sparkles size={12} />
            <span>Match Theme</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] font-bold uppercase tracking-wider text-white/80 cursor-pointer"
        >
          <Sliders size={11} />
          <span>{compact ? 'Style' : 'Size, Color & Position'}</span>
          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Expandable Detailed Controls */}
      {isOpen && (
        <div className="p-3 border-t border-white/10 bg-black/25 space-y-3.5">
          {/* Size & Position Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-white/70">
                <span>Size / Zoom</span>
                <span className="font-mono text-[#ebd2d8]">{current.scale ?? 100}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={160}
                value={current.scale ?? 100}
                onChange={(e) => update({ scale: Number(e.target.value) })}
                className="w-full accent-[#ebd2d8] cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-white/70">
                <span>Position X</span>
                <span className="font-mono text-[#ebd2d8]">{current.offsetX ?? 0}px</span>
              </div>
              <input
                type="range"
                min={-80}
                max={80}
                value={current.offsetX ?? 0}
                onChange={(e) => update({ offsetX: Number(e.target.value) })}
                className="w-full accent-[#ebd2d8] cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-white/70">
                <span>Position Y</span>
                <span className="font-mono text-[#ebd2d8]">{current.offsetY ?? 0}px</span>
              </div>
              <input
                type="range"
                min={-80}
                max={80}
                value={current.offsetY ?? 0}
                onChange={(e) => update({ offsetY: Number(e.target.value) })}
                className="w-full accent-[#ebd2d8] cursor-pointer"
              />
            </div>
          </div>

          {/* Background Color (Theme Swatches + Custom Color Picker) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-white/65 flex items-center gap-1">
                <Palette size={11} /> Background Color (Match Theme or Custom)
              </label>
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-white/55 hover:text-white cursor-pointer"
              >
                <RotateCcw size={10} /> Reset
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {themeSwatches.map((swatch) => {
                const active = (current.bgColor || 'transparent') === swatch.id;
                return (
                  <button
                    key={swatch.id}
                    type="button"
                    onClick={() => update({ bgColor: swatch.id })}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase cursor-pointer ${
                      active
                        ? 'border-[#ebd2d8] bg-white/15 text-white'
                        : 'border-white/15 bg-black/40 text-white/65 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-white/30 shrink-0"
                      style={{
                        backgroundColor: swatch.color === 'transparent' ? '#222' : swatch.color,
                      }}
                    />
                    <span>{swatch.label}</span>
                  </button>
                );
              })}
              <label className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-white/15 bg-black/40 text-[10px] font-bold uppercase text-white/75 cursor-pointer">
                <input
                  type="color"
                  value={
                    current.bgColor && current.bgColor.startsWith('#')
                      ? current.bgColor
                      : themeColors.wine
                  }
                  onChange={(e) => update({ bgColor: e.target.value })}
                  className="w-4 h-4 rounded border-0 bg-transparent cursor-pointer"
                />
                <span>Custom</span>
              </label>
            </div>
          </div>

          {/* Blend Mode (Instant BG Removal) + Fit + Opacity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                BG Blend Mode
              </label>
              <select
                value={current.blendMode || 'normal'}
                onChange={(e) =>
                  update({ blendMode: e.target.value as ImageStyleConfig['blendMode'] })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-[11px] text-white"
              >
                <option value="normal">Normal / PNG Cutout</option>
                <option value="screen">Remove Black BG</option>
                <option value="multiply">Remove White BG</option>
                <option value="lighten">Soften Dark BG</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                Image Fit
              </label>
              <div className="grid grid-cols-2 gap-1">
                {(['cover', 'contain'] as const).map((fitMode) => (
                  <button
                    key={fitMode}
                    type="button"
                    onClick={() => update({ fit: fitMode })}
                    className={`py-1.5 rounded-lg border text-[10px] font-bold uppercase cursor-pointer ${
                      (current.fit || 'cover') === fitMode
                        ? 'bg-[#ebd2d8] text-[#3d111e] border-[#ebd2d8]'
                        : 'bg-black/40 text-white/70 border-white/15'
                    }`}
                  >
                    {fitMode}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-white/70">
                <span>Opacity</span>
                <span className="font-mono text-[#ebd2d8]">{current.opacity ?? 100}%</span>
              </div>
              <input
                type="range"
                min={30}
                max={100}
                value={current.opacity ?? 100}
                onChange={(e) => update({ opacity: Number(e.target.value) })}
                className="w-full accent-[#ebd2d8] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
