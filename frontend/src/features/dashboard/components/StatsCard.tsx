import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  variant?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  isCurrency?: boolean;
}

export const StatsCard = ({ 
  title, 
  value, 
  icon, 
  variant = 'blue',
  isCurrency = false 
}: StatsCardProps) => {
  
  // Garantir que value seja número
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Formatação correta
  const displayValue = isCurrency
    ? numValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : numValue.toLocaleString('pt-BR');

  const variants = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <div className={`bg-gradient-to-br ${variants[variant]} rounded-xl sm:rounded-2xl shadow-lg p-4 text-white overflow-hidden`}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-white bg-opacity-20 rounded-lg shrink-0">
          {icon}
        </div>
      </div>
      
      <p className="text-xs sm:text-sm opacity-90 mb-1 font-medium uppercase tracking-wide">
        {title}
      </p>
      
      <p className={`font-bold break-words ${
        isCurrency 
          ? 'text-xl sm:text-2xl' 
          : 'text-2xl sm:text-3xl'
      }`}>
        {displayValue}
      </p>
    </div>
  );
};
