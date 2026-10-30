import React from 'react';
import { Volume2, VolumeX, RotateCcw, Sparkles, Smile, Flame } from 'lucide-react';
import type { StressStats } from '../types';

interface StressBarProps {
  stats: StressStats;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onReset: () => void;
  onSqueezeAll: () => void;
  moodMessage: string;
}

export const StressBar: React.FC<StressBarProps> = ({
  stats,
  soundEnabled,
  onToggleSound,
  onReset,
  onSqueezeAll,
  moodMessage
}) => {
  // Determine color and status according to stress level
  const stress = stats.stressLevel;
  let statusBadge = 'Căng Thẳng';
  let barGradient = 'from-rose-500 to-amber-500';
  let badgeBg = 'bg-rose-100 text-rose-700 border-rose-200';

  if (stress <= 10) {
    statusBadge = 'Zen Tuyệt Đối 🧘';
    barGradient = 'from-emerald-400 to-teal-500';
    badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  } else if (stress <= 40) {
    statusBadge = 'Thư Giãn Sâu 🌿';
    barGradient = 'from-teal-400 to-cyan-500';
    badgeBg = 'bg-teal-100 text-teal-800 border-teal-200';
  } else if (stress <= 75) {
    statusBadge = 'Dễ Chịu Dần 🌸';
    barGradient = 'from-amber-400 to-pink-500';
    badgeBg = 'bg-amber-100 text-amber-800 border-amber-200';
  }

  return (
    <header className="absolute top-4 left-4 right-4 z-20 flex flex-col md:flex-row items-center justify-between gap-3 pointer-events-none">
      {/* Brand & Stats Card */}
      <div className="soft-glass rounded-2xl px-5 py-3 pointer-events-auto flex items-center gap-4 w-full md:w-auto justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-400 to-purple-400 flex items-center justify-center text-white shadow-md shadow-pink-200">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-800 tracking-tight">ASMR Squishy 3D</h1>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                {statusBadge}
              </span>
            </div>
            <p className="text-xs text-purple-600 font-medium italic mt-0.5 animate-fade-in">
              "{moodMessage}"
            </p>
          </div>
        </div>

        {/* Combo Badge */}
        {stats.comboCount > 1 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-extrabold text-xs rounded-full shadow-sm animate-bounce">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{stats.comboCount}x COMBO!</span>
          </div>
        )}
      </div>

      {/* Stress Meter & Action Buttons */}
      <div className="soft-glass rounded-2xl px-5 py-3 pointer-events-auto flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
        {/* Stress Bar */}
        <div className="flex flex-col gap-1 w-44 md:w-56">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
            <span className="flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-purple-500" />
              Mức Stress:
            </span>
            <span className="font-mono text-gray-800">{Math.round(stress)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200/80 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-300 ease-out shadow-sm`}
              style={{ width: `${stress}%` }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 border-l border-gray-200/80 pl-3">
          {/* Squeeze All button */}
          <button
            onClick={onSqueezeAll}
            title="Bóp dẹp toàn diện"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-100 hover:bg-purple-200 text-purple-700 transition active:scale-95 shadow-xs"
          >
            Bóp Bẹp 💥
          </button>

          {/* Reset button */}
          <button
            onClick={onReset}
            title="Làm mới squishy"
            className="p-2 rounded-xl text-gray-600 hover:text-purple-600 hover:bg-white/80 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Tắt âm thanh ASMR' : 'Bật âm thanh ASMR'}
            className={`p-2 rounded-xl transition active:scale-95 ${
              soundEnabled
                ? 'text-purple-600 bg-purple-50 hover:bg-purple-100'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
