/**
 * Formata valor numérico para moeda brasileira
 * @param value - Valor numérico
 * @returns String formatada como R$ 1.234,56
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return 'R$ 0,00';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return 'R$ 0,00';
  
  return numValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Formata número com separador de milhares
 * @param value - Valor numérico
 * @returns String formatada como 1.234
 */
export const formatNumber = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '0';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';
  
  return numValue.toLocaleString('pt-BR');
};

/**
 * Formata valor com casas decimais
 * @param value - Valor numérico
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada como 10,50
 */
export const formatDecimal = (value: number | string | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined || value === '') return '0';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';
  
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Formata porcentagem
 * @param value - Valor numérico (ex: 15 para 15%)
 * @returns String formatada como 15%
 */
export const formatPercent = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '0%';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0%';
  
  return `${numValue.toFixed(2)}%`;
};

/**
 * Remove formatação e retorna apenas números
 * @param value - String formatada (ex: "1.234" ou "1,234.56")
 * @returns Número sem formatação
 */
export const parseNumber = (value: string): number => {
  if (!value) return 0;
  
  // Remove tudo exceto números
  const numericValue = value.replace(/\D/g, '');
  
  return Number(numericValue) || 0;
};
