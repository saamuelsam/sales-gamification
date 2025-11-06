// src/features/dashboard/components/StatsCard.tsx

import React from 'react';
import { formatCurrency, formatNumber, formatPoints, formatKilowatts } from '@/utils/formatters';

type StatsCardProps = {
  title: string;
  value: number | string;
  variant?: 'currency' | 'number' | 'points' | 'kilowatts';
  compact?: boolean;
  icon?: React.ReactNode;
  subtitle?: string | React.ReactNode;
  className?: string;
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  variant = 'number',
  compact = false,
  icon,
  subtitle,
  className = '',
}) => {
  const safeValue = Number(value) || 0;
  let display = '';

  switch (variant) {
    case 'currency':
      if (compact) {
        display = new Intl.NumberFormat('pt-BR', {
          notation: 'compact',
          maximumFractionDigits: 1,
        }).format(safeValue) + ' R$';
      } else {
        display = formatCurrency(safeValue);
      }
      break;

    case 'kilowatts':
      if (compact) {
        display = new Intl.NumberFormat('pt-BR', {
          notation: 'compact',
          maximumFractionDigits: 1,
        }).format(safeValue) + ' kW';
      } else {
        display = formatKilowatts(safeValue);
      }
      break;

    case 'points':
      if (compact) {
        display = new Intl.NumberFormat('pt-BR', {
          notation: 'compact',
          maximumFractionDigits: 1,
        }).format(safeValue) + ' pts';
      } else {
        display = formatPoints(safeValue);
      }
      break;

    case 'number':
    default:
      if (compact) {
        display = new Intl.NumberFormat('pt-BR', {
          notation: 'compact',
          maximumFractionDigits: 1,
        }).format(safeValue);
      } else {
        display = formatNumber(safeValue);
      }
      break;
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 transition-all hover:shadow-md ${className}`}
      data-testid={`stat-card-${title.toLowerCase()}`}
    >
      <div className="flex items-start justify-between gap-3">
        {icon && (
          <div className="bg-gray-50 rounded-md p-2 flex items-center justify-center flex-shrink-0 text-gray-600">
            {icon}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 font-medium truncate uppercase tracking-wide">
            {title}
          </p>
          <p
            className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate"
            data-testid={`stat-value-${title.toLowerCase()}`}
          >
            {display}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
