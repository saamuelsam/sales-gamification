// src/utils/formatters.ts

export const formatCurrency = (value: number | string): string => {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
};

export const formatNumber = (value: number | string): string => {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR');
};

export const formatPoints = (points: number | string): string => {
  const num = Number(points) || 0;
  // Exibe pontos com separador de milhar, sem casas decimais
  return `${num.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} pts`;
};

export const formatKilowatts = (value: number): string => {
  const num = Number(value) || 0;
  return `${num.toLocaleString('pt-BR')} kW`;
};
