import React from 'react';
import type { DietaryType } from '../../types';

interface DietaryBadgeProps {
  type: DietaryType;
  showText?: boolean;
  className?: string;
}

export const DietaryBadge: React.FC<DietaryBadgeProps> = ({ type, showText = true, className = '' }) => {
  switch (type) {
    case 'veg':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 ${className}`}>
          <span className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center p-0.5 rounded-xs" aria-hidden="true">
            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
          </span>
          {showText && <span>Veg</span>}
        </span>
      );

    case 'non_veg':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-rose-800 ${className}`}>
          <span className="w-3.5 h-3.5 border border-rose-600 flex items-center justify-center p-0.5 rounded-xs" aria-hidden="true">
            <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-rose-600"></span>
          </span>
          {showText && <span>Non-Veg</span>}
        </span>
      );

    case 'egg':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 ${className}`}>
          <span className="w-3.5 h-3.5 border border-amber-600 flex items-center justify-center p-0.5 rounded-xs" aria-hidden="true">
            <span className="w-1.5 h-2 bg-amber-500 rounded-full"></span>
          </span>
          {showText && <span>Egg</span>}
        </span>
      );

    case 'vegan':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-teal-800 ${className}`}>
          <span className="w-3.5 h-3.5 border border-teal-600 flex items-center justify-center p-0.5 rounded-xs" aria-hidden="true">
            <svg className="w-2.5 h-2.5 text-teal-600 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </span>
          {showText && <span>Vegan</span>}
        </span>
      );

    default:
      return null;
  }
};
