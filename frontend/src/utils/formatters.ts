// Formata número com separador de milhares (ponto)
export const formatNumber = (value: string | number): string => {
  const numericValue = String(value).replace(/\D/g, ''); // Remove tudo que não é número
  
  if (!numericValue) return '';
  
  return Number(numericValue).toLocaleString('pt-BR');
};

// Remove formatação e retorna número puro
export const parseNumber = (value: string): number => {
  const numericValue = value.replace(/\D/g, '');
  return Number(numericValue) || 0;
};

// Formata valor monetário (R$ 2.000,00)
export const formatCurrency = (value: string | number): string => {
  const numericValue = String(value).replace(/\D/g, '');
  
  if (!numericValue) return '';
  
  const number = Number(numericValue) / 100; // Divide por 100 para considerar centavos
  return number.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
};
