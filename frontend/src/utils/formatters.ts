// src/utils/formatters.ts

export function parseNumber(value: string): number {
  return Number(value.replace(/[^\d.-]/g, ''));
}

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
  return `${num.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} pts`;
};

export const formatKilowatts = (value: number): string => {
  const num = Number(value) || 0;
  return `${num.toLocaleString('pt-BR')} kW`;
};
