import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface GridWidthControlProps {
  value: number;
  onChange: (value: number) => void;
}

export const GridWidthControl: React.FC<GridWidthControlProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(3, value - 1))}
        className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
        title="Decrease width"
      >
        <Minus size={16} className="text-slate-600 dark:text-gray-300" />
      </button>
      <span className="text-sm text-slate-600 dark:text-gray-400 min-w-[20px] text-center">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(8, value + 1))}
        className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
        title="Increase width"
      >
        <Plus size={16} className="text-slate-600 dark:text-gray-300" />
      </button>
    </div>
  );
};