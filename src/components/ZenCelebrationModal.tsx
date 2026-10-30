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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-white/95 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-white flex flex-col items-center text-center relative overflow-hidden">
        {/* Close icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Big Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-400 to-purple-400 flex items-center justify-center text-white shadow-lg shadow-pink-200 mb-4 animate-bounce">
          <Sparkles className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight mb-2">
          Đạt Trạng Thái Zen! 🧘✨
        </h2>

        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Tất cả căng thẳng và muộn phiền đã được giải tỏa hoàn toàn sau{' '}
          <strong className="text-purple-600 font-bold">{squishCount}</strong> lần bóp nặn!
          Tâm trí bạn giờ đây đang nhẹ bẫng và thư thái như một đám mây.
        </p>

        <div className="bg-purple-50 rounded-2xl p-3.5 mb-6 w-full flex items-center justify-center gap-2 text-xs font-semibold text-purple-700">
          <Heart className="w-4 h-4 fill-pink-500 text-pink-500 animate-pulse" />
          <span>Bạn xứng đáng có những giây phút bình yên này</span>
        </div>

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Nạp Lại Stress (Chơi Lại)</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95 shadow-md shadow-purple-200 transition active:scale-95"
          >
            Cứ Bóp Tiếp Thôi! 💖
          </button>
        </div>
      </div>
    </div>
  );
};

