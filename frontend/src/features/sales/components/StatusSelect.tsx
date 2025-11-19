import { getAvailableStatusOptions, SaleStatus } from '../utils/statusPermissions';

interface StatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  userRole?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Componente de seleção de status de venda com permissões baseadas em role
 * - Consultores não podem selecionar "Aprovado"
 * - Financeiro, CEO e Admin podem selecionar qualquer status
 */
export const StatusSelect: React.FC<StatusSelectProps> = ({
  value,
  onChange,
  userRole,
  className = '',
  disabled = false
}) => {
  const availableOptions = getAvailableStatusOptions(userRole);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      <option value="">Selecione um status...</option>
      {availableOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.emoji} {option.label}
        </option>
      ))}
    </select>
  );
};
