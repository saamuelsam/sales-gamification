/**
 * Utilitário para gerenciar permissões de status de vendas
 */

export type SaleStatus = 'negotiation' | 'pending' | 'approved' | 'financing_denied' | 'cancelled' | 'delivered';

export interface StatusOption {
  value: SaleStatus;
  label: string;
  emoji: string;
  color: string;
}

// Configuração completa de todos os status
export const allStatusOptions: StatusOption[] = [
  {
    value: 'negotiation',
    label: 'Negociação',
    emoji: '💬',
    color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400'
  },
  {
    value: 'pending',
    label: 'Pendente',
    emoji: '⏳',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400'
  },
  {
    value: 'approved',
    label: 'Aprovado',
    emoji: '✅',
    color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400'
  },
  {
    value: 'financing_denied',
    label: 'Financiamento Negado',
    emoji: '❌',
    color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400'
  },
  {
    value: 'cancelled',
    label: 'Cancelado',
    emoji: '⛔',
    color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300'
  },
  {
    value: 'delivered',
    label: 'Entregue',
    emoji: '📦',
    color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400'
  }
];

/**
 * Retorna os status permitidos de acordo com a role do usuário
 * @param userRole - Role do usuário logado
 * @returns Array de status options permitidos
 */
export const getAvailableStatusOptions = (userRole: string | undefined): StatusOption[] => {
  // CEO, Admin e Financeiro podem usar todos os status
  if (!userRole || ['ceo', 'admin', 'financeiro'].includes(userRole)) {
    return allStatusOptions;
  }

  // Consultores, Gerentes e Diretor Comercial NÃO podem aprovar
  // Podem usar todos os outros status
  return allStatusOptions.filter(option => option.value !== 'approved');
};

/**
 * Verifica se o usuário pode definir um determinado status
 * @param userRole - Role do usuário
 * @param status - Status que deseja definir
 * @returns true se pode, false se não pode
 */
export const canSetStatus = (userRole: string | undefined, status: SaleStatus): boolean => {
  // CEO, Admin e Financeiro podem tudo
  if (!userRole || ['ceo', 'admin', 'financeiro'].includes(userRole)) {
    return true;
  }

  // Outros não podem aprovar
  return status !== 'approved';
};

/**
 * Obtém a configuração de um status específico
 */
export const getStatusConfig = (status: SaleStatus): StatusOption | undefined => {
  return allStatusOptions.find(opt => opt.value === status);
};
