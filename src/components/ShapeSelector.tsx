import React from 'react';
import type { SquishyShape } from '../types';
import { SHAPE_METADATA } from '../three/squishyModels';

interface ShapeSelectorProps {
  currentShape: SquishyShape;
  onSelectShape: (shape: SquishyShape) => void;
}

export const ShapeSelector: React.FC<ShapeSelectorProps> = ({ currentShape, onSelectShape }) => {
  const shapes: SquishyShape[] = ['bun', 'cheese', 'cat', 'toast', 'peach', 'avocado', 'tomato'];

  return (
    <nav
      aria-label="Chọn mẫu squishy"
      className="absolute bottom-2.5 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 w-auto max-w-[96vw] sm:max-w-[92vw]"
    >
      <div className="tactile-glass rounded-xl sm:rounded-2xl p-1 sm:p-2 flex items-center gap-1 sm:gap-1.5 overflow-x-auto sensory-scrollbar transition-all duration-300 shadow-lg">
        {shapes.map((id) => {
          const meta = SHAPE_METADATA[id];
          const isSelected = currentShape === id;

          return (
            <button
              key={id}
              onClick={() => onSelectShape(id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-150 whitespace-nowrap text-xs font-semibold select-none active:scale-95 ${
                isSelected
                  ? 'bg-stone-900 text-amber-100 shadow-md ring-1 ring-stone-950/20'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100/70 bg-transparent'
              }`}
            >
              <span className="text-sm sm:text-base leading-none">{meta.emoji}</span>
              <span className="tracking-tight text-[11px] sm:text-xs">{meta.vietnameseName}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
