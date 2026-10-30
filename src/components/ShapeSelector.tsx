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
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-auto max-w-[92vw]">
      <div className="soft-glass rounded-2xl p-2 px-3 flex items-center gap-2 overflow-x-auto custom-scrollbar shadow-lg">
        {shapes.map((id) => {
          const meta = SHAPE_METADATA[id];
          const isSelected = currentShape === id;

          return (
            <button
              key={id}
              onClick={() => onSelectShape(id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-200 whitespace-nowrap text-xs font-semibold select-none active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-200 scale-105'
                  : 'text-gray-700 hover:bg-white/90 hover:text-purple-600 bg-white/40'
              }`}
            >
              <span className="text-base">{meta.emoji}</span>
              <span>{meta.vietnameseName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
