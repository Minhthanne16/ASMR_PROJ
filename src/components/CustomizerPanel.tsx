import React, { useState, useRef } from 'react';
import {
  Palette,
  Sliders,
  ChevronRight,
  Smile,
  Hand,
  Clock,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Upload,
  Trash2
} from 'lucide-react';
import type {
  SquishyConfig,
  InteractionMode,
  SquishyMaterialType,
  FaceExpression,
  RecoverySpeed,
  BackgroundConfig
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
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const meta = SHAPE_METADATA[config.shape];

  const modes: { id: InteractionMode; label: string; icon: string; desc: string }[] = [
    { id: 'poke', label: 'Ấn Lún', icon: '👆', desc: 'Chọc ngón tay tạo vết lõm' },
    { id: 'squish', label: 'Bóp Dẹp', icon: '🤲', desc: 'Bóp nén, hai bên phồng ra' },
    { id: 'stretch', label: 'Kéo Dãn', icon: '↔️', desc: 'Kéo dãn như kẹo dẻo' },
    { id: 'rotate', label: 'Xoay 360°', icon: '🔄', desc: 'Xoay ngắm mọi góc độ' },
  ];

  const materials: { id: SquishyMaterialType; label: string; icon: string; desc: string }[] = [
    { id: 'matte', label: 'Mút Xốp', icon: '☁️', desc: 'Mờ mịn memory foam' },
    { id: 'glossy', label: 'Thạch Kẹo', icon: '🍬', desc: 'Bóng óng ánh như thạch' },
    { id: 'velvet', label: 'Nhung Mịn', icon: '🪶', desc: 'Mềm nhung tán xạ sáng' },
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

  const bgColors = [
    { name: 'Lavender', hex: '#f4f0f9' },
    { name: 'Đào Ấm', hex: '#fdf0ed' },
    { name: 'Bạc Hà', hex: '#edf7f2' },
    { name: 'Biển Xanh', hex: '#eef6fc' },
    { name: 'Kem Ngọt', hex: '#faf6ec' },
    { name: 'Zen Tối', hex: '#161426' }
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
      className={`fixed top-24 md:top-20 right-4 z-20 transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1.5rem)]'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-10 top-3 soft-glass p-2 rounded-l-xl text-gray-700 hover:text-purple-600 shadow-md active:scale-95"
        title={isOpen ? 'Thu gọn bảng tùy biến' : 'Mở bảng tùy biến'}
      >
        {isOpen ? <ChevronRight className="w-5 h-5" /> : <Sliders className="w-5 h-5 text-purple-600 animate-pulse" />}
      </button>

      {/* Panel Content */}
      <div className="soft-glass rounded-3xl p-4 md:p-5 w-[305px] max-h-[calc(100vh-8.5rem)] overflow-y-auto custom-scrollbar flex flex-col gap-4 text-gray-800 shadow-xl">
        {/* Title */}
        <div className="flex items-center justify-between border-b border-gray-200/70 pb-2.5">
          <div className="flex items-center gap-2 font-bold text-sm text-purple-900">
            <Sliders className="w-4 h-4 text-purple-600" />
            <span>Tùy Chỉnh Squishy</span>
          </div>
          <span className="text-[11px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
            {meta.emoji} {meta.vietnameseName}
          </span>
        </div>

        {/* 1. INTERACTION MODES */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
            <Hand className="w-3.5 h-3.5 text-purple-600" />
            <span>Cách nghịch:</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {modes.map((m) => {
              const active = interactionMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onChangeMode(m.id)}
                  className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                    active
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-200 font-semibold'
                      : 'bg-white/60 hover:bg-white text-gray-700 hover:text-purple-700'
                  }`}
                >
                  <span className="text-base mb-0.5">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. COLOR PALETTE */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-2">
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-pink-500" />
              <span>Màu sắc đồ chơi:</span>
            </div>
            <label className="text-[11px] font-mono text-gray-500 cursor-pointer flex items-center gap-1">
              <span>Đổi màu</span>
              <input
                type="color"
                value={config.color}
                onChange={(e) => onChangeConfig({ color: e.target.value })}
                className="w-4 h-4 rounded cursor-pointer border-0 p-0"
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            {meta.colorPresets.map((c) => (
              <button
                key={c}
                onClick={() => onChangeConfig({ color: c })}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full shadow-inner transition-transform active:scale-90 border-2 ${
                  config.color.toLowerCase() === c.toLowerCase()
                    ? 'border-purple-600 scale-110 shadow-md ring-2 ring-purple-300'
                    : 'border-white/80 hover:scale-105'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 3. MATERIAL FINISH */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Chất liệu bề mặt:</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {materials.map((mat) => {
              const active = config.materialType === mat.id;
              return (
                <button
                  key={mat.id}
                  onClick={() => onChangeConfig({ materialType: mat.id })}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl text-center text-[11px] transition-all active:scale-95 ${
                    active
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-200'
                      : 'bg-white/60 hover:bg-white text-gray-700'
                  }`}
                >
                  <span className="text-sm mb-0.5">{mat.icon}</span>
                  <span>{mat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. FACIAL EXPRESSIONS */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
            <Smile className="w-3.5 h-3.5 text-amber-500" />
            <span>Biểu cảm mặt Cute:</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {expressions.map((exp) => {
              const active = config.expression === exp.id;
              return (
                <button
                  key={exp.id}
                  onClick={() => onChangeConfig({ expression: exp.id })}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs transition-all active:scale-95 ${
                    active
                      ? 'bg-amber-500 text-white font-semibold shadow-sm shadow-amber-200'
                      : 'bg-white/60 hover:bg-white text-gray-700'
                  }`}
                >
                  <span>{exp.icon}</span>
                  <span className="text-[11px]">{exp.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. RECOVERY SPEED (SLOW-RISE) */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>Tốc độ phồng lại (Slow-Rise):</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {speeds.map((s) => {
              const active = config.recoverySpeed === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onChangeConfig({ recoverySpeed: s.id })}
                  className={`flex items-center justify-between py-1.5 px-2.5 rounded-xl text-xs transition-all active:scale-95 ${
                    active
                      ? 'bg-teal-600 text-white font-semibold shadow-sm shadow-teal-200'
                      : 'bg-white/60 hover:bg-white text-gray-700'
                  }`}
                >
                  <span>{s.label}</span>
                  <span className={`text-[10px] font-mono ${active ? 'text-teal-100' : 'text-gray-400'}`}>
                    {s.time}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. BACKGROUND CUSTOMIZER (COLOR & IMAGE IMPORT) */}
        <div className="border-t border-gray-200/70 pt-3">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-2">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
              <span>Hình nền phòng chơi:</span>
            </div>
            <label className="text-[11px] font-mono text-gray-500 cursor-pointer flex items-center gap-1">
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
          <div className="grid grid-cols-6 gap-1.5 mb-2.5">
            {bgColors.map((bg) => (
              <button
                key={bg.hex}
                title={bg.name}
                onClick={() => onChangeBackground({ type: 'color', color: bg.hex, imageUrl: null })}
                style={{ backgroundColor: bg.hex }}
                className={`h-6 rounded-lg border transition active:scale-95 ${
                  backgroundConfig.type === 'color' && backgroundConfig.color.toLowerCase() === bg.hex.toLowerCase()
                    ? 'border-purple-600 scale-105 shadow-sm ring-2 ring-purple-300'
                    : 'border-gray-200/80 hover:border-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Import Custom Image */}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {backgroundConfig.type === 'image' && backgroundConfig.imageUrl ? (
              <div className="flex items-center justify-between bg-purple-50/80 p-2 rounded-xl border border-purple-200 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <img
                    src={backgroundConfig.imageUrl}
                    alt="Preview"
                    className="w-7 h-7 rounded-lg object-cover border border-purple-300 shrink-0"
                  />
                  <span className="truncate text-[11px] font-medium text-purple-800">Ảnh đã chọn</span>
                </div>
                <button
                  onClick={handleRemoveImage}
                  className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-100/60 rounded-lg transition"
                  title="Gỡ ảnh nền"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/40 hover:bg-purple-50 text-xs font-semibold text-purple-700 transition active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải ảnh nền từ máy (JPG/PNG)</span>
              </button>
            )}

            {/* Blur slider if image or color */}
            {backgroundConfig.type === 'image' && (
              <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1">
                <span>Độ mờ nền (Blur):</span>
                <input
                  type="range"
                  min="0"
                  max="16"
                  value={backgroundConfig.blur}
                  onChange={(e) => onChangeBackground({ blur: Number(e.target.value) })}
                  className="w-24 accent-purple-600 cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer tip */}
        <div className="bg-purple-50/70 border border-purple-100/80 rounded-xl p-2.5 text-[11px] text-purple-700 leading-relaxed">
          <p className="flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-purple-500" />
            <span>
              <strong>Mẹo:</strong> Nhấp giữ chuột trái để nhào nặn hoặc kéo chuột phải để xoay 360° squishy!
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
};
