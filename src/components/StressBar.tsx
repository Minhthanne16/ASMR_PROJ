import React from 'react';
import { Volume2, VolumeX, RotateCcw, Sparkles, Flame, Shrink } from 'lucide-react';
import type { StressStats } from '../types';

interface StressBarProps {
  stats: StressStats;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onReset: () => void;
  onSqueezeAll: () => void;
}

export const StressBar: React.FC<StressBarProps> = ({
  stats,
  soundEnabled,
  onToggleSound,
  onReset,
  onSqueezeAll
}) => {
  const stress = stats.stressLevel;

  let statusBadge = 'Căng Thẳng';
  let barColor = 'bg-stone-700';
  let badgeStyle = 'bg-stone-100 text-stone-700 border-stone-200';

  if (stress <= 10) {
    statusBadge = 'Zen 🌿';
    barColor = 'bg-emerald-600';
    badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (stress <= 40) {
    statusBadge = 'Thư Giãn 🍃';
    barColor = 'bg-teal-600';
    badgeStyle = 'bg-teal-50 text-teal-800 border-teal-200';
  } else if (stress <= 75) {
    statusBadge = 'Dịu Lại 🌸';
    barColor = 'bg-amber-600';
    badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
  } else {
    barColor = 'bg-rose-600';
    badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200';
  }

  return (
    <header className="absolute top-2.5 left-2.5 right-2.5 sm:top-4 sm:left-4 sm:right-4 z-20 flex items-center justify-between gap-2 pointer-events-none">
      {/* Brand & Ambient Status Island */}
      <div className="tactile-glass rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 pointer-events-auto flex items-center gap-2.5 sm:gap-3 transition-all duration-300 shadow-sm">
        <div className="w-8 h-8 rounded-xl bg-stone-900 text-amber-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-amber-300" />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <h1 className="text-xs sm:text-sm font-bold text-stone-900 tracking-tight hidden xs:inline">
            Squishy 3D
          </h1>
          <span className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
            {statusBadge}
          </span>
        </div>

        {/* Combo Counter Badge */}
        {stats.comboCount > 1 && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-stone-950 font-bold text-[10px] sm:text-xs rounded-full shadow-sm animate-pulse">
            <Flame className="w-3 h-3 fill-current" />
            <span>{stats.comboCount}x</span>
          </div>
        )}
      </div>

      {/* Stress Meter & Controls */}
      <div className="tactile-glass rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 pointer-events-auto flex items-center gap-2 sm:gap-3.5 transition-all duration-300 shadow-sm">
        {/* Compact Stress Bar */}
        <div className="flex flex-col gap-0.5 w-20 sm:w-36 md:w-44">
          <div className="flex justify-between items-center text-[10px] sm:text-xs font-medium text-stone-600">
            <span className="hidden sm:inline text-stone-700">Stress:</span>
            <span className="font-mono font-semibold text-stone-800">{Math.round(stress)}%</span>
          </div>
          <div className="w-full h-2 sm:h-2.5 bg-stone-200/80 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full ${barColor} transition-all duration-300 ease-out`}
              style={{ width: `${stress}%` }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 border-l border-stone-200 pl-2 sm:pl-3">
          {/* Squeeze All button */}
          <button
            onClick={onSqueezeAll}
            title="Bóp bẹp toàn diện (Phím tắt: Space)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-stone-100 transition-all duration-150 active:scale-95 shadow-sm"
          >
            <Shrink className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden md:inline">Bóp Bẹp</span>
          </button>

          {/* Reset button */}
          <button
            onClick={onReset}
            title="Làm mới squishy (Phím tắt: R)"
            className="p-1.5 sm:p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100/80 transition-all duration-150 active:scale-95"
            aria-label="Làm mới squishy"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Tắt âm thanh ASMR (Phím tắt: M)' : 'Bật âm thanh ASMR (Phím tắt: M)'}
            aria-label={soundEnabled ? 'Tắt âm thanh ASMR' : 'Bật âm thanh ASMR'}
            className={`p-1.5 sm:p-2 rounded-xl transition-all duration-150 active:scale-95 ${
              soundEnabled
                ? 'text-stone-900 bg-amber-100/70 hover:bg-amber-200/70'
                : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-900" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
