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
  isCurrency = false,
}: StatsCardProps) => {
  // ✅ GARANTIR QUE value SEJA NÚMERO
  let numValue = 0;
  
  if (typeof value === 'string') {
    numValue = parseFloat(value);
  } else {
    numValue = Number(value);
  }

  // ✅ VALIDAR SE É NÚMERO VÁLIDO
  if (isNaN(numValue)) {
    console.error('❌ StatsCard recebeu valor inválido:', value);
    numValue = 0;
  }

  // ✅ FORMATAÇÃO CORRETA
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
    <div
      className={`bg-gradient-to-br ${variants[variant]} rounded-2xl shadow-lg p-6 text-white`}
    >
      <div className="flex items-center justify-between mb-4">
        {icon}
      </div>
      <p className="text-white/80 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold mt-2">{displayValue}</p>
    </div>
  );
};
