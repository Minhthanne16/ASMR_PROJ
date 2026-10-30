import React from 'react';
import { Heart, Sparkles, RefreshCw, X } from 'lucide-react';

interface ZenCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  squishCount: number;
}

export const ZenCelebrationModal: React.FC<ZenCelebrationModalProps> = ({
  isOpen,
  onClose,
  onRestart,
  squishCount
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-md transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="zen-modal-title"
    >
      <div className="tactile-glass rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 transform scale-100">
        {/* Close icon */}
        <button
          onClick={onClose}
          aria-label="Đóng bảng thông báo"
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-2 rounded-xl hover:bg-stone-100/80 transition-all duration-150 active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Serene Zen Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-sm mb-4">
          <Sparkles className="w-8 h-8 text-emerald-600" />
        </div>

        <h2 id="zen-modal-title" className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight mb-2">
          Đạt Trạng Thái Zen Tuyệt Đối 🌿
        </h2>

        <p className="text-sm text-stone-600 mb-5 leading-relaxed">
          Tất cả căng thẳng và muộn phiền đã được giải tỏa hoàn toàn sau{' '}
          <strong className="text-stone-900 font-semibold">{squishCount}</strong> lần bóp nặn!
          Tâm trí bạn giờ đây đang nhẹ bẫng và thư thái như một đám mây.
        </p>

        <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 mb-6 w-full flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800">
          <Heart className="w-4 h-4 fill-emerald-600 text-emerald-600" />
          <span>Bạn xứng đáng có những giây phút an yên này</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
          <button
            onClick={onRestart}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-all duration-150 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
            <span>Chơi Lại Từ Đầu</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-stone-100 bg-stone-900 hover:bg-stone-800 shadow-sm transition-all duration-150 active:scale-95"
          >
            Cứ Bóp Tiếp Thôi ✨
          </button>
        </div>
      </div>
    </div>
  );
};
