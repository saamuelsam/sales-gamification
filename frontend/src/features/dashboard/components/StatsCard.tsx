// src/features/dashboard/components/StatsCard.tsx
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: 'blue' | 'green' | 'yellow' | 'purple';
}

const variantStyles = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  yellow: 'from-yellow-500 to-yellow-600',
  purple: 'from-purple-500 to-purple-600',
};

export const StatsCard = ({ title, value, icon, variant = 'blue' }: StatsCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">{title}</p>
          <h3 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
            {value}
          </h3>
        </div>
        <div className={`bg-gradient-to-br ${variantStyles[variant]} p-2 rounded-lg shadow-sm`}>
          <div className="text-white">{icon}</div>
        </div>
      </div>
    </div>
  );
};
