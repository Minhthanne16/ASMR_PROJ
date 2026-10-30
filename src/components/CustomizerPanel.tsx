import React, { useState, useRef } from 'react';
import {
  Palette,
  Sliders,
  ChevronRight,
  Smile,
  Pointer,
  Shrink,
  Expand,
  RotateCw,
  Clock,
  Wind,
  Layers,
  Cloud,
  Feather,
  Droplets,
  Image as ImageIcon,
  Upload,
  Trash2,
  Keyboard,
  X
} from 'lucide-react';
import type {
  SquishyConfig,
  InteractionMode,
  SquishyMaterialType,
  FaceExpression,
  RecoverySpeed,
  BackgroundConfig,
  ASMRSoundProfile
} from '../types';
import { SHAPE_METADATA } from '../three/squishyModels';

interface CustomizerPanelProps {
  config: SquishyConfig;
  interactionMode: InteractionMode;
  backgroundConfig: BackgroundConfig;
  onChangeMode: (mode: InteractionMode) => void;
  onChangeConfig: (newConfig: Partial<SquishyConfig>) => void;
  onChangeBackground: (newBg: Partial<BackgroundConfig>) => void;
}

export const CustomizerPanel: React.FC<CustomizerPanelProps> = ({
  config,
  interactionMode,
  backgroundConfig,
  onChangeMode,
  onChangeConfig,
  onChangeBackground
}) => {
  // Default open on desktop, collapsed on mobile so squishy is 100% visible
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const meta = SHAPE_METADATA[config.shape];

  const modes: { id: InteractionMode; label: string; icon: React.ReactNode; desc: string; shortcut: string }[] = [
    { id: 'poke', label: 'Ấn Lún', icon: <Pointer className="w-4 h-4" />, desc: 'Chọc ngón tay tạo vết lõm', shortcut: '1' },
    { id: 'squish', label: 'Bóp Dẹp', icon: <Shrink className="w-4 h-4" />, desc: 'Bóp nén, hai bên phồng ra', shortcut: '2' },
    { id: 'stretch', label: 'Kéo Dãn', icon: <Expand className="w-4 h-4" />, desc: 'Kéo dãn như kẹo dẻo', shortcut: '3' },
    { id: 'rotate', label: 'Xoay 360°', icon: <RotateCw className="w-4 h-4" />, desc: 'Xoay ngắm mọi góc độ', shortcut: '4' },
  ];

  const materials: { id: SquishyMaterialType; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'matte', label: 'Mút Xốp', icon: <Cloud className="w-4 h-4" />, desc: 'Mờ mịn foam' },
    { id: 'glossy', label: 'Thạch Kẹo', icon: <Droplets className="w-4 h-4" />, desc: 'Bóng óng ánh' },
    { id: 'velvet', label: 'Nhung Mịn', icon: <Feather className="w-4 h-4" />, desc: 'Mềm tán xạ sáng' },
  ];

  const expressions: { id: FaceExpression; label: string; icon: string }[] = [
    { id: 'happy', label: 'Vui vẻ', icon: '😊' },
    { id: 'winking', label: 'Nháy mắt', icon: '😉' },
    { id: 'shocked', label: 'Há hốc', icon: '😮' },
    { id: 'sleepy', label: 'Ngủ say', icon: '😴' },
    { id: 'sparkle', label: 'Long lanh', icon: '✨' },
    { id: 'none', label: 'Trơn', icon: '⚪' },
  ];

  const speeds: { id: RecoverySpeed; label: string; time: string }[] = [
    { id: 'super_slow', label: 'Siêu Chậm', time: '~4.0s' },
    { id: 'slow', label: 'Chậm Foam', time: '~2.5s' },
    { id: 'medium', label: 'Vừa Phải', time: '~1.5s' },
    { id: 'fast', label: 'Nảy Nhanh', time: '~0.8s' },
  ];

  const soundProfiles: { id: ASMRSoundProfile; label: string; desc: string; icon: string }[] = [
    { id: 'slow_rise_whisper', label: 'Thở Hút Khí (Slow-Rise Whisper)', desc: 'Tiếng thở hút khí êm dịu (shhhhh...)', icon: '💨' },
    { id: 'crunchy', label: 'Giòn Rụm Lách Tách (Crunchy ASMR)', desc: 'Tiếng giòn rụm lách tách như video', icon: '🫧' },
  ];

  const bgColors = [
    { name: 'Oat Milk', hex: '#f7f5f0' },
    { name: 'Soft Peach', hex: '#faece4' },
    { name: 'Sage Garden', hex: '#edf3ee' },
    { name: 'Sky Mist', hex: '#ecf3f7' },
    { name: 'Warm Sand', hex: '#f6f2e8' },
    { name: 'Zen Charcoal', hex: '#1c1b1a' }
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onChangeBackground({ type: 'image', imageUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    onChangeBackground({ type: 'color', imageUrl: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <aside
      aria-label="Bảng tùy chỉnh squishy"
      className={`fixed top-14 sm:top-20 right-2 sm:right-4 z-20 transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1.5rem)]'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-10 top-2 sm:top-3 tactile-glass p-2 rounded-l-xl text-stone-700 hover:text-stone-900 shadow-md active:scale-95 transition-all duration-150"
        title={isOpen ? 'Thu gọn bảng tùy biến' : 'Mở bảng tùy biến'}
        aria-label={isOpen ? 'Thu gọn bảng tùy biến' : 'Mở bảng tùy biến'}
      >
        {isOpen ? <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-stone-900" />}
      </button>

      {/* Panel Content (responsive width and height) */}
      <div className="tactile-glass rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 w-[275px] sm:w-[310px] max-h-[calc(100dvh-5.5rem)] sm:max-h-[calc(100dvh-8rem)] overflow-y-auto sensory-scrollbar flex flex-col gap-3.5 text-stone-800 shadow-xl transition-all duration-300">
        {/* Title */}
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-2.5">
          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-stone-900">
            <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-700" />
            <span>Tùy Chỉnh Squishy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] sm:text-[11px] font-semibold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200/80">
              {meta.emoji} {meta.vietnameseName}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="sm:hidden p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              aria-label="Đóng bảng tùy biến"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 1. INTERACTION MODES */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Pointer className="w-3.5 h-3.5 text-stone-600" />
              <span>Chế độ nghịch:</span>
            </div>
            <span className="text-[10px] text-stone-500 font-mono hidden sm:inline">Phím 1-4</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {modes.map((m) => {
              const active = interactionMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onChangeMode(m.id)}
                  className={`flex flex-col items-center justify-center py-1.5 px-1.5 rounded-xl text-xs transition-all duration-150 active:scale-95 ${
                    active
                      ? 'bg-stone-900 text-stone-50 font-semibold shadow-sm'
                      : 'bg-white/70 hover:bg-white text-stone-700 hover:text-stone-950 border border-stone-200/60'
                  }`}
                  title={`${m.label}: ${m.desc}`}
                >
                  <span className="mb-0.5">{m.icon}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] sm:text-xs">{m.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. COLOR PALETTE */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-stone-600" />
              <span>Màu sắc:</span>
            </div>
            <label className="text-[10px] sm:text-[11px] text-stone-500 hover:text-stone-800 cursor-pointer flex items-center gap-1">
              <span>Đổi mã</span>
              <input
                type="color"
                value={config.color}
                onChange={(e) => onChangeConfig({ color: e.target.value })}
                className="w-4 h-4 rounded cursor-pointer border-0 p-0"
              />
            </label>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {meta.colorPresets.map((c) => (
              <button
                key={c}
                onClick={() => onChangeConfig({ color: c })}
                style={{ backgroundColor: c }}
                aria-label={`Chọn màu ${c}`}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-transform active:scale-90 border-2 ${
                  config.color.toLowerCase() === c.toLowerCase()
                    ? 'border-stone-900 scale-110 shadow-sm ring-2 ring-stone-400/50'
                    : 'border-white hover:scale-105 shadow-xs'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 3. MATERIAL FINISH */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 mb-1.5">
            <Layers className="w-3.5 h-3.5 text-stone-600" />
            <span>Chất liệu:</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {materials.map((mat) => {
              const active = config.materialType === mat.id;
              return (
                <button
                  key={mat.id}
                  onClick={() => onChangeConfig({ materialType: mat.id })}
                  className={`flex flex-col items-center py-1.5 px-1 rounded-xl text-center text-[10px] sm:text-[11px] transition-all duration-150 active:scale-95 ${
                    active
                      ? 'bg-stone-900 text-stone-50 font-semibold shadow-sm'
                      : 'bg-white/70 hover:bg-white text-stone-700 border border-stone-200/60'
                  }`}
                  title={mat.desc}
                >
                  <span className="mb-0.5">{mat.icon}</span>
                  <span>{mat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. FACIAL EXPRESSIONS */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 mb-1.5">
            <Smile className="w-3.5 h-3.5 text-stone-600" />
            <span>Biểu cảm mặt Cute:</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {expressions.map((exp) => {
              const active = config.expression === exp.id;
              return (
                <button
                  key={exp.id}
                  onClick={() => onChangeConfig({ expression: exp.id })}
                  className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-xl text-xs transition-all duration-150 active:scale-95 ${
                    active
                      ? 'bg-stone-900 text-stone-50 font-semibold shadow-sm'
                      : 'bg-white/70 hover:bg-white text-stone-700 border border-stone-200/60'
                  }`}
                >
                  <span>{exp.icon}</span>
                  <span className="text-[10px] sm:text-[11px]">{exp.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. ASMR SOUND STYLE */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 mb-1.5">
            <Wind className="w-3.5 h-3.5 text-stone-600" />
            <span>Âm thanh ASMR:</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {soundProfiles.map((sp) => {
              const active = (config.soundProfile || 'slow_rise_whisper') === sp.id;
              return (
                <button
                  key={sp.id}
                  onClick={() => onChangeConfig({ soundProfile: sp.id })}
                  className={`flex items-center justify-between py-1.5 px-2.5 rounded-xl text-xs transition-all duration-150 active:scale-95 text-left ${
                    active
                      ? 'bg-stone-900 text-stone-50 font-semibold shadow-sm'
                      : 'bg-white/70 hover:bg-white text-stone-700 border border-stone-200/60'
                  }`}
                  title={sp.desc}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{sp.icon}</span>
                    <span className="text-[11px]">{sp.label}</span>
                  </div>
                  {active && <span className="text-[9px] text-amber-300 font-mono">Đang chọn</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. RECOVERY SPEED (SLOW-RISE) */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-stone-600" />
            <span>Độ chậm phục hồi (Slow-Rise):</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {speeds.map((s) => {
              const active = config.recoverySpeed === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onChangeConfig({ recoverySpeed: s.id })}
                  className={`flex items-center justify-between py-1.5 px-2 rounded-xl text-xs transition-all duration-150 active:scale-95 ${
                    active
                      ? 'bg-stone-900 text-stone-50 font-semibold shadow-sm'
                      : 'bg-white/70 hover:bg-white text-stone-700 border border-stone-200/60'
                  }`}
                >
                  <span className="text-[11px]">{s.label}</span>
                  <span className={`text-[9px] font-mono ${active ? 'text-stone-300' : 'text-stone-500'}`}>
                    {s.time}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. BACKGROUND CUSTOMIZER */}
        <div className="border-t border-stone-200/80 pt-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-1.5">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-stone-600" />
              <span>Không gian phòng chơi:</span>
            </div>
            <label className="text-[10px] sm:text-[11px] text-stone-500 hover:text-stone-800 cursor-pointer flex items-center gap-1">
              <span>Màu riêng</span>
              <input
                type="color"
                value={backgroundConfig.color}
                onChange={(e) => onChangeBackground({ type: 'color', color: e.target.value })}
                className="w-4 h-4 rounded cursor-pointer border-0 p-0"
              />
            </label>
          </div>

          {/* Color Presets */}
          <div className="grid grid-cols-6 gap-1.5 mb-2">
            {bgColors.map((bg) => (
              <button
                key={bg.hex}
                title={bg.name}
                onClick={() => onChangeBackground({ type: 'color', color: bg.hex, imageUrl: null })}
                style={{ backgroundColor: bg.hex }}
                aria-label={`Chọn nền ${bg.name}`}
                className={`h-5 sm:h-6 rounded-lg border transition-all duration-150 active:scale-95 ${
                  backgroundConfig.type === 'color' && backgroundConfig.color.toLowerCase() === bg.hex.toLowerCase()
                    ? 'border-stone-900 scale-105 shadow-sm ring-2 ring-stone-400/50'
                    : 'border-stone-200/80 hover:border-stone-400'
                }`}
              />
            ))}
          </div>

          {/* Import Custom Image */}
          <div className="flex flex-col gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {backgroundConfig.type === 'image' && backgroundConfig.imageUrl ? (
              <div className="flex items-center justify-between bg-stone-100/90 p-1.5 rounded-xl border border-stone-200 text-xs">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <img
                    src={backgroundConfig.imageUrl}
                    alt="Preview"
                    className="w-6 h-6 rounded-lg object-cover border border-stone-300 shrink-0"
                  />
                  <span className="truncate text-[10px] font-medium text-stone-800">Ảnh đã tải lên</span>
                </div>
                <button
                  onClick={handleRemoveImage}
                  className="p-1 text-stone-500 hover:text-rose-600 hover:bg-stone-200/60 rounded-lg transition"
                  title="Gỡ ảnh nền"
                  aria-label="Gỡ ảnh nền"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border border-dashed border-stone-300 hover:border-stone-500 bg-white/50 hover:bg-white text-[11px] font-medium text-stone-700 transition-all duration-150 active:scale-95"
              >
                <Upload className="w-3.5 h-3.5 text-stone-500" />
                <span>Tải ảnh nền từ máy</span>
              </button>
            )}

            {backgroundConfig.type === 'image' && (
              <div className="flex items-center justify-between text-[10px] text-stone-600 pt-0.5">
                <span>Độ mờ nền (Blur):</span>
                <input
                  type="range"
                  min="0"
                  max="16"
                  value={backgroundConfig.blur}
                  onChange={(e) => onChangeBackground({ blur: Number(e.target.value) })}
                  className="w-20 sm:w-24 cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Shortcut tips (hidden on mobile, shown on desktop) */}
        <div className="hidden sm:block bg-stone-100/80 border border-stone-200/80 rounded-xl p-2.5 text-[11px] text-stone-700 leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold text-stone-900 mb-1">
            <Keyboard className="w-3.5 h-3.5 text-stone-600" />
            <span>Phím tắt nhanh:</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px] text-stone-600">
            <div><kbd className="px-1 py-0.5 bg-white rounded border border-stone-300 text-stone-800">Space</kbd> Bóp bẹp</div>
            <div><kbd className="px-1 py-0.5 bg-white rounded border border-stone-300 text-stone-800">R</kbd> Làm mới</div>
            <div><kbd className="px-1 py-0.5 bg-white rounded border border-stone-300 text-stone-800">M</kbd> Âm thanh</div>
            <div><kbd className="px-1 py-0.5 bg-white rounded border border-stone-300 text-stone-800">1-4</kbd> Đổi mode</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
